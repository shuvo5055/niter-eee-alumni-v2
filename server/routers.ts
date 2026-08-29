import { and, count, desc, eq, gt, isNull, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ALUMNI_SESSION_COOKIE, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, alumniProcedure, editorProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { getDb, recordActivity, upsertUser } from "./db";
import { sdk } from "./_core/sdk";
import { alumni, alumniProfileChanges, batchAccessAttempts, batchAlumniSubmissions, batches, batchSubmissionAccess, districts, galleryItems, jobs, siteContent, users } from "../drizzle/schema";
import { storagePut } from "./storage";
import { alumniExcelRowInput, commitAlumniExcelImport, previewAlumniExcelImport } from "./alumniImport";
import { alumniClaimSignInInput, alumniProfileDraftInput, verifyAlumniPassword } from "./alumniClaim";
import { verifyBatchAccessCode } from "./batchAccess";

const optionalText = z.string().trim().max(5000).optional().nullable();
const optionalEmail = z.string().trim().max(320).refine(value => !value || z.string().email().safeParse(value).success, "Enter a valid email address.").transform(value => value ? value.toLowerCase() : undefined).optional().nullable();
const normalizeManagedPhotoUrl = (value: string) => {
  if (value.startsWith("/manus-storage/")) return value;
  if (value.startsWith("manus-storage/")) return `/${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `/manus-storage/${value.replace(/^\/+/, "")}`;
};
const optionalPhotoUrl = z.preprocess(
  value => typeof value === "string" && !value.trim() ? undefined : value,
  z.string().trim().max(5000).transform(normalizeManagedPhotoUrl).optional().nullable(),
);
const alumniInput = z.object({
  id: z.number().int().optional(), fullName: z.string().trim().min(2).max(200), slug: z.string().trim().min(2).max(160),
  batchId: z.number().int().optional().nullable(), districtId: z.number().int().optional().nullable(), session: optionalText,
  studentId: optionalText, email: optionalEmail, phone: optionalText, address: optionalText, graduationYear: z.number().int().min(1950).max(2100).optional().nullable(), bloodGroup: optionalText, photoUrl: optionalPhotoUrl, school: optionalText, college: optionalText,
  bsc: optionalText, msc: optionalText, skill: optionalText, researchActivities: optionalText,
  currentOrganization: optionalText, currentDesignation: optionalText, currentDuration: optionalText,
  previousOrganization: optionalText, previousDesignation: optionalText, previousDuration: optionalText,
  whatsapp: optionalText, facebook: optionalText, linkedin: optionalText, country: optionalText, city: optionalText,
  industry: optionalText, status: z.enum(["draft", "published"]).default("draft"),
});
const batchInput = z.object({ id: z.number().int().optional(), batchNumber: z.number().int().min(1).max(99), session: optionalText, displayName: optionalText, isActive: z.boolean().default(true) });
const districtInput = z.object({ id: z.number().int().optional(), name: z.string().trim().min(2).max(120), division: optionalText, isActive: z.boolean().default(true) });
const jobInput = z.object({ id: z.number().int().optional(), title: z.string().trim().min(2).max(220), organization: z.string().trim().min(2).max(220), location: optionalText, employmentType: optionalText, description: optionalText, requirements: optionalText, applicationLink: optionalText, applicationContact: optionalText, deadline: z.string().optional().nullable(), status: z.enum(["draft", "published"]).default("draft") });
const galleryInput = z.object({ id: z.number().int().optional(), title: z.string().trim().min(2).max(220), category: z.string().trim().min(2).max(120), imageUrl: z.string().trim().min(1), eventDate: z.string().optional().nullable(), status: z.enum(["draft", "published"]).default("draft") });
const legacyAlumniInput = z.object({ slug: z.string().min(2).max(160), fullName: z.string().min(2).max(200), batchNumber: z.number().int().min(1), districtName: z.string().min(2).max(120), studentId: optionalText, photoUrl: optionalPhotoUrl, organization: optionalText, designation: optionalText, industry: optionalText, country: optionalText, city: optionalText, session: optionalText, bloodGroup: optionalText, school: optionalText, college: optionalText, bsc: optionalText, msc: optionalText, skill: optionalText, researchActivities: optionalText, currentDuration: optionalText, previousOrganization: optionalText, previousDesignation: optionalText, previousDuration: optionalText, whatsapp: optionalText, facebook: optionalText, linkedin: optionalText });
const requireDb = async () => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" }); return db; };
const parseDate = (value?: string | null) => value ? new Date(value) : null;
const hashValue = (value: string) => createHash("sha256").update(value).digest();
const matchesSecret = (provided: string, configured: string) => timingSafeEqual(hashValue(provided), hashValue(configured));
const credentialAdminOpenId = (email: string) => `credential-admin-${createHash("sha256").update(email).digest("hex").slice(0, 40)}`;
const ALUMNI_SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const claimFailureMessage = "We could not verify your alumni information. Please check your details or contact the administrator.";
const setAlumniSession = async (ctx: any, alumniId: number) => {
  const token = await sdk.createSessionToken(`alumni-claim-${alumniId}`, { expiresInMs: ALUMNI_SESSION_MS, name: "Alumni Claim" });
  ctx.res.cookie(ALUMNI_SESSION_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: ALUMNI_SESSION_MS });
};

const publicAlumniSelect = {
  id: alumni.id, slug: alumni.slug, fullName: alumni.fullName, session: alumni.session, studentId: alumni.studentId, graduationYear: alumni.graduationYear, bloodGroup: alumni.bloodGroup, photoUrl: alumni.photoUrl,
  school: alumni.school, college: alumni.college, bsc: alumni.bsc, msc: alumni.msc, skill: alumni.skill, researchActivities: alumni.researchActivities,
  currentOrganization: alumni.currentOrganization, currentDesignation: alumni.currentDesignation, currentDuration: alumni.currentDuration,
  previousOrganization: alumni.previousOrganization, previousDesignation: alumni.previousDesignation, previousDuration: alumni.previousDuration,
  whatsapp: alumni.whatsapp, facebook: alumni.facebook, linkedin: alumni.linkedin, country: alumni.country, city: alumni.city, industry: alumni.industry,
  batchNumber: batches.batchNumber, districtName: districts.name, createdAt: alumni.createdAt, updatedAt: alumni.updatedAt,
};
const adminAlumniSelect = { ...publicAlumniSelect, email: alumni.email, phone: alumni.phone, address: alumni.address, claimed: alumni.claimed, claimedAt: alumni.claimedAt };
// Email is intentionally restricted to a single public profile response so directory listings never expose contact details in bulk.
const publicProfileAlumniSelect = { ...publicAlumniSelect, email: alumni.email };
const publicSubmissionInput = z.object({
  accessToken: z.string().trim().min(24).max(160),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320).transform(value => value.toLowerCase()),
  studentId: optionalText, phone: optionalText, districtId: z.number().int().positive().nullable().optional(), session: optionalText,
  bloodGroup: optionalText, school: optionalText, college: optionalText, bsc: optionalText, msc: optionalText, skill: optionalText, researchActivities: optionalText,
  currentOrganization: optionalText, currentDesignation: optionalText, currentDuration: optionalText, previousOrganization: optionalText, previousDesignation: optionalText, previousDuration: optionalText,
  whatsapp: optionalText, facebook: optionalText, linkedin: optionalText, country: optionalText, city: optionalText, industry: optionalText, photoUrl: z.string().trim().max(5000).optional().nullable(),
});
const submissionFingerprint = (ctx: { req: { headers: Record<string, unknown> } }) => {
  const forwarded = ctx.req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : typeof forwarded === "string" ? forwarded.split(",")[0] : "";
  const agent = typeof ctx.req.headers["user-agent"] === "string" ? ctx.req.headers["user-agent"] : "";
  return createHash("sha256").update(`${ip}|${agent}`).digest("hex");
};
const hashSubmissionToken = (token: string) => createHash("sha256").update(token).digest("hex");
const isSupportedImage = (bytes: Buffer, mimeType: string) => (mimeType === "image/jpeg" && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) || (mimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) || (mimeType === "image/webp" && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP");

export const appRouter = router({
  system: systemRouter,
  batchSubmission: router({
    verifyAccessCode: publicProcedure.input(z.object({ batchNumber: z.number().int().min(1).max(99), accessCode: z.string().trim().min(1).max(160) })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [batch] = await db.select({ id: batches.id }).from(batches).where(and(eq(batches.batchNumber, input.batchNumber), eq(batches.isActive, true))).limit(1);
      if (!batch) return { verified: false } as const;
      const fingerprintHash = submissionFingerprint(ctx);
      const [attempt] = await db.select().from(batchAccessAttempts).where(and(eq(batchAccessAttempts.batchId, batch.id), eq(batchAccessAttempts.fingerprintHash, fingerprintHash))).limit(1);
      const now = new Date();
      if (attempt?.lockedUntil && attempt.lockedUntil > now) return { verified: false } as const;
      if (!verifyBatchAccessCode(input.batchNumber, input.accessCode)) {
        const withinWindow = attempt?.updatedAt && attempt.updatedAt.getTime() >= Date.now() - 15 * 60 * 1000;
        const failures = (withinWindow ? attempt?.failedAttempts ?? 0 : 0) + 1;
        const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        if (attempt) await db.update(batchAccessAttempts).set({ failedAttempts: failures, lockedUntil }).where(eq(batchAccessAttempts.id, attempt.id));
        else await db.insert(batchAccessAttempts).values({ batchId: batch.id, fingerprintHash, failedAttempts: failures, lockedUntil });
        return { verified: false } as const;
      }
      if (attempt) await db.update(batchAccessAttempts).set({ failedAttempts: 0, lockedUntil: null }).where(eq(batchAccessAttempts.id, attempt.id));
      const accessToken = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
      await db.insert(batchSubmissionAccess).values({ batchId: batch.id, tokenHash: hashSubmissionToken(accessToken), expiresAt });
      return { verified: true, accessToken, expiresAt } as const;
    }),
    submit: publicProcedure.input(publicSubmissionInput).mutation(async ({ input }) => {
      const db = await requireDb();
      const [access] = await db.select().from(batchSubmissionAccess).where(and(eq(batchSubmissionAccess.tokenHash, hashSubmissionToken(input.accessToken)), gt(batchSubmissionAccess.expiresAt, new Date()), isNull(batchSubmissionAccess.usedAt))).limit(1);
      if (!access) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your verified access has expired. Please verify the batch access code again." });
      if (input.photoUrl && !input.photoUrl.startsWith(`/manus-storage/batch-submissions/${access.batchId}/`)) throw new TRPCError({ code: "BAD_REQUEST", message: "Profile photo must be uploaded through the verified submission form." });
      const consumeResult = await db.update(batchSubmissionAccess).set({ usedAt: new Date() }).where(and(eq(batchSubmissionAccess.id, access.id), isNull(batchSubmissionAccess.usedAt)));
      if (Number(consumeResult[0].affectedRows) !== 1) throw new TRPCError({ code: "CONFLICT", message: "This verified access was already used. Please verify the batch access code again." });
      const [existingAlumnus] = await db.select({ id: alumni.id }).from(alumni).where(or(eq(alumni.email, input.email), input.studentId ? eq(alumni.studentId, input.studentId) : undefined)).limit(1);
      if (existingAlumnus) throw new TRPCError({ code: "CONFLICT", message: "An alumni record with this email or Student ID already exists. Use Claim / Update My Profile instead." });
      const [pendingDuplicate] = await db.select({ id: batchAlumniSubmissions.id }).from(batchAlumniSubmissions).where(and(eq(batchAlumniSubmissions.status, "pending"), or(eq(batchAlumniSubmissions.email, input.email), input.studentId ? eq(batchAlumniSubmissions.studentId, input.studentId) : undefined))).limit(1);
      if (pendingDuplicate) throw new TRPCError({ code: "CONFLICT", message: "A submission with this email or Student ID is already pending administrator review." });
      const { accessToken, districtId, photoUrl, ...submittedData } = input;
      await db.insert(batchAlumniSubmissions).values({ batchId: access.batchId, districtId: districtId ?? null, fullName: input.fullName, email: input.email, studentId: input.studentId ?? null, phone: input.phone ?? null, photoUrl: photoUrl ?? null, submittedData: { ...submittedData, districtId: districtId ?? null, photoUrl: photoUrl ?? null }, status: "pending" });
      return { success: true } as const;
    }),
    uploadPhoto: publicProcedure.input(z.object({ accessToken: z.string().trim().min(24).max(160), fileName: z.string().max(160), mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/), dataBase64: z.string().min(16).max(7_000_000) })).mutation(async ({ input }) => {
      const db = await requireDb();
      const [access] = await db.select({ id: batchSubmissionAccess.id, batchId: batchSubmissionAccess.batchId }).from(batchSubmissionAccess).where(and(eq(batchSubmissionAccess.tokenHash, hashSubmissionToken(input.accessToken)), gt(batchSubmissionAccess.expiresAt, new Date()), isNull(batchSubmissionAccess.usedAt))).limit(1);
      if (!access) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your verified access has expired. Please verify the batch access code again." });
      const base64 = input.dataBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const bytes = Buffer.from(base64, "base64");
      if (bytes.length === 0 || bytes.length > 5_000_000 || !isSupportedImage(bytes, input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid JPG, PNG, or WebP image smaller than 5 MB." });
      return storagePut(`batch-submissions/${access.batchId}/${input.fileName}`, bytes, input.mimeType);
    }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    signIn: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(256), remember: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const configuredPassword = process.env.ADMIN_PASSWORD;
      if (!configuredEmail || !configuredPassword) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Administrator access is not configured." });
      if (!matchesSecret(input.email.toLowerCase(), configuredEmail) || !matchesSecret(input.password, configuredPassword)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      const openId = credentialAdminOpenId(configuredEmail);
      await upsertUser({ openId, name: "Administrator", email: configuredEmail, loginMethod: "credentials", role: "admin", lastSignedIn: new Date() });
      const expiresInMs = input.remember ? ONE_YEAR_MS : 1000 * 60 * 60 * 12;
      const token = await sdk.createSessionToken(openId, { expiresInMs, name: "Administrator" });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: expiresInMs });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  alumniClaim: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.alumniSession) return null;
      const db = await requireDb();
      const [record] = await db.select({ id: alumni.id, slug: alumni.slug, fullName: alumni.fullName, email: alumni.email, studentId: alumni.studentId, claimed: alumni.claimed }).from(alumni).where(eq(alumni.id, ctx.alumniSession.alumniId)).limit(1);
      return record ?? null;
    }),
    signIn: publicProcedure.input(alumniClaimSignInInput).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [record] = await db.select().from(alumni).where(eq(alumni.email, input.email)).limit(1);
      const now = new Date();
      if (!record || !record.passwordHash || (record.claimLockedUntil && record.claimLockedUntil > now) || !verifyAlumniPassword(input.password, record.passwordHash)) {
        if (record && (!record.claimLockedUntil || record.claimLockedUntil <= now)) {
          const attempts = (record.claimLockedUntil && record.claimLockedUntil <= now ? 0 : record.claimFailedAttempts ?? 0) + 1;
          await db.update(alumni).set({ claimFailedAttempts: attempts, claimLockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(alumni.id, record.id));
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: claimFailureMessage });
      }
      await db.update(alumni).set({ claimed: true, claimedAt: record.claimedAt ?? now, claimFailedAttempts: 0, claimLockedUntil: null }).where(eq(alumni.id, record.id));
      await setAlumniSession(ctx, record.id);
      return { success: true, slug: record.slug } as const;
    }),
    signOut: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(ALUMNI_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
    profile: alumniProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      const [record] = await db.select().from(alumni).where(eq(alumni.id, ctx.alumniSession.alumniId)).limit(1);
      if (!record) throw new TRPCError({ code: "UNAUTHORIZED", message: "Alumni sign-in is required." });
      const [pending] = await db.select({ id: alumniProfileChanges.id, status: alumniProfileChanges.status, createdAt: alumniProfileChanges.createdAt, proposedData: alumniProfileChanges.proposedData }).from(alumniProfileChanges).where(and(eq(alumniProfileChanges.alumniId, record.id), eq(alumniProfileChanges.status, "pending"))).limit(1);
      return { record, pendingChange: pending ?? null };
    }),
    submitProfileChange: alumniProcedure.input(alumniProfileDraftInput).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const alumniId = ctx.alumniSession.alumniId;
      const [existing] = await db.select({ id: alumniProfileChanges.id }).from(alumniProfileChanges).where(and(eq(alumniProfileChanges.alumniId, alumniId), eq(alumniProfileChanges.status, "pending"))).limit(1);
      if (existing) await db.update(alumniProfileChanges).set({ proposedData: input, updatedAt: new Date() }).where(eq(alumniProfileChanges.id, existing.id));
      else await db.insert(alumniProfileChanges).values({ alumniId, submittedByAlumniId: alumniId, proposedData: input, status: "pending" });
      await db.insert((await import("../drizzle/schema")).activityLogs).values({ actorId: null, action: "profile_change_submitted", entityType: "alumni", entityId: String(alumniId) });
      return { success: true } as const;
    }),
    uploadPhoto: alumniProcedure.input(z.object({ fileName: z.string().max(160), mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/), dataBase64: z.string().min(16).max(7_000_000) })).mutation(async ({ ctx, input }) => {
      const base64 = input.dataBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const result = await storagePut(`alumni-claims/${ctx.alumniSession.alumniId}/${input.fileName}`, Buffer.from(base64, "base64"), input.mimeType);
      const db = await requireDb();
      const alumniId = ctx.alumniSession.alumniId;
      const [record] = await db.select({ fullName: alumni.fullName }).from(alumni).where(eq(alumni.id, alumniId)).limit(1);
      if (!record) throw new TRPCError({ code: "UNAUTHORIZED", message: "Alumni sign-in is required." });
      const [pending] = await db.select({ id: alumniProfileChanges.id, proposedData: alumniProfileChanges.proposedData }).from(alumniProfileChanges).where(and(eq(alumniProfileChanges.alumniId, alumniId), eq(alumniProfileChanges.status, "pending"))).limit(1);
      const existingDraft = pending?.proposedData && typeof pending.proposedData === "object" ? pending.proposedData as Record<string, unknown> : {};
      const proposedData = { ...existingDraft, fullName: typeof existingDraft.fullName === "string" && existingDraft.fullName.trim() ? existingDraft.fullName : record.fullName, photoUrl: result.url };
      if (pending) await db.update(alumniProfileChanges).set({ proposedData, updatedAt: new Date() }).where(eq(alumniProfileChanges.id, pending.id));
      else await db.insert(alumniProfileChanges).values({ alumniId, submittedByAlumniId: alumniId, proposedData, status: "pending" });
      await db.insert((await import("../drizzle/schema")).activityLogs).values({ actorId: null, action: "profile_photo_uploaded", entityType: "alumni", entityId: String(alumniId) });
      return { ...result, pendingReview: true };
    }),
  }),
  publicData: router({
    alumniList: publicProcedure.input(z.object({ search: z.string().optional(), batch: z.number().optional(), batchNumber: z.number().optional(), district: z.string().optional() }).optional()).query(async ({ input }) => {
      const db = await requireDb();
      const conditions = [eq(alumni.status, "published")];
      if (input?.batch) conditions.push(eq(alumni.batchId, input.batch));
      if (input?.batchNumber) conditions.push(eq(batches.batchNumber, input.batchNumber));
      if (input?.district) conditions.push(eq(districts.name, input.district));
      if (input?.search?.trim()) { const term = `%${input.search.trim()}%`; conditions.push(or(like(alumni.fullName, term), like(alumni.currentOrganization, term), like(alumni.currentDesignation, term), like(alumni.studentId, term))!); }
      return db.select(publicAlumniSelect).from(alumni).leftJoin(batches, eq(alumni.batchId, batches.id)).leftJoin(districts, eq(alumni.districtId, districts.id)).where(and(...conditions)).orderBy(desc(alumni.createdAt));
    }),
    alumniBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const db = await requireDb();
      const rows = await db.select(publicProfileAlumniSelect).from(alumni).leftJoin(batches, eq(alumni.batchId, batches.id)).leftJoin(districts, eq(alumni.districtId, districts.id)).where(and(eq(alumni.slug, input.slug), eq(alumni.status, "published"))).limit(1);
      return rows[0] ?? null;
    }),
    batchDirectory: publicProcedure.query(async () => { const db = await requireDb(); return db.select({ id: batches.id, batchNumber: batches.batchNumber, session: batches.session, alumniCount: count(alumni.id) }).from(batches).leftJoin(alumni, and(eq(alumni.batchId, batches.id), eq(alumni.status, "published"))).where(eq(batches.isActive, true)).groupBy(batches.id, batches.batchNumber, batches.session).orderBy(batches.batchNumber); }),
    districtDirectory: publicProcedure.query(async () => { const db = await requireDb(); return db.select({ id: districts.id, name: districts.name, division: districts.division, alumniCount: count(alumni.id) }).from(districts).leftJoin(alumni, and(eq(alumni.districtId, districts.id), eq(alumni.status, "published"))).where(eq(districts.isActive, true)).groupBy(districts.id, districts.name, districts.division).orderBy(districts.name); }),
    publishedJobs: publicProcedure.query(async () => { const db = await requireDb(); return db.select().from(jobs).where(eq(jobs.status, "published")).orderBy(desc(jobs.createdAt)); }),
    gallery: publicProcedure.query(async () => { const db = await requireDb(); return db.select().from(galleryItems).where(eq(galleryItems.status, "published")).orderBy(desc(galleryItems.createdAt)); }),
    content: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => { const db = await requireDb(); const rows = await db.select().from(siteContent).where(eq(siteContent.key, input.key)).limit(1); return rows[0] ?? null; }),
  }),
  admin: router({
    overview: editorProcedure.query(async () => {
      const db = await requireDb();
      const [[alumniCount], [batchCount], [districtCount], [jobCount], [userCount], recentAlumni, recentJobs, byBatch, byDistrict] = await Promise.all([
        db.select({ value: count() }).from(alumni), db.select({ value: count() }).from(batches), db.select({ value: count() }).from(districts), db.select({ value: count() }).from(jobs), db.select({ value: count() }).from(users),
        db.select({ id: alumni.id, slug: alumni.slug, fullName: alumni.fullName, photoUrl: alumni.photoUrl, session: alumni.session, batchNumber: batches.batchNumber, districtName: districts.name, currentOrganization: alumni.currentOrganization, currentDesignation: alumni.currentDesignation, status: alumni.status, createdAt: alumni.createdAt }).from(alumni).leftJoin(batches, eq(alumni.batchId, batches.id)).leftJoin(districts, eq(alumni.districtId, districts.id)).orderBy(desc(alumni.createdAt)).limit(5),
        db.select({ id: jobs.id, title: jobs.title, organization: jobs.organization, location: jobs.location, status: jobs.status, createdAt: jobs.createdAt }).from(jobs).orderBy(desc(jobs.createdAt)).limit(5),
        db.select({ label: batches.batchNumber, value: count(alumni.id) }).from(batches).leftJoin(alumni, eq(alumni.batchId, batches.id)).groupBy(batches.id, batches.batchNumber).orderBy(batches.batchNumber),
        db.select({ label: districts.name, value: count(alumni.id) }).from(districts).leftJoin(alumni, eq(alumni.districtId, districts.id)).groupBy(districts.id, districts.name).orderBy(districts.name),
      ]);
      return { counts: { alumni: alumniCount?.value ?? 0, batches: batchCount?.value ?? 0, districts: districtCount?.value ?? 0, jobs: jobCount?.value ?? 0, users: userCount?.value ?? 0 }, recentAlumni, recentJobs, byBatch, byDistrict };
    }),
    alumni: router({
      list: editorProcedure.input(z.object({ search: z.string().optional(), batchId: z.number().optional(), districtId: z.number().optional(), organization: z.string().optional() }).optional()).query(async ({ input }) => { const db = await requireDb(); const conditions = []; if (input?.search?.trim()) { const term = `%${input.search.trim()}%`; conditions.push(or(like(alumni.fullName, term), like(alumni.studentId, term), like(alumni.currentOrganization, term))!); } if (input?.batchId) conditions.push(eq(alumni.batchId, input.batchId)); if (input?.districtId) conditions.push(eq(alumni.districtId, input.districtId)); if (input?.organization?.trim()) conditions.push(like(alumni.currentOrganization, `%${input.organization.trim()}%`)); return db.select({ ...adminAlumniSelect, status: alumni.status, updatedAt: alumni.updatedAt }).from(alumni).leftJoin(batches, eq(alumni.batchId, batches.id)).leftJoin(districts, eq(alumni.districtId, districts.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(alumni.updatedAt)); }),
      save: editorProcedure.input(alumniInput).mutation(async ({ ctx, input }) => { const db = await requireDb(); const { id, photoUrl, ...values } = input; const updateValues = photoUrl === undefined ? values : { ...values, photoUrl }; if (id) { await db.update(alumni).set(updateValues).where(eq(alumni.id, id)); await recordActivity({ actorId: ctx.user.id, action: "updated", entityType: "alumni", entityId: String(id), details: { fullName: input.fullName } }); return { id }; } const result = await db.insert(alumni).values({ ...values, ...(photoUrl === undefined ? {} : { photoUrl }), createdBy: ctx.user.id }); const insertedId = Number(result[0].insertId); await recordActivity({ actorId: ctx.user.id, action: "created", entityType: "alumni", entityId: String(insertedId), details: { fullName: input.fullName } }); return { id: insertedId }; }),
      delete: editorProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => { const db = await requireDb(); await db.delete(alumni).where(eq(alumni.id, input.id)); await recordActivity({ actorId: ctx.user.id, action: "deleted", entityType: "alumni", entityId: String(input.id) }); return { success: true }; }),
      importLegacy: editorProcedure.input(z.array(legacyAlumniInput).max(1000)).mutation(async ({ ctx, input }) => { const db = await requireDb(); for (const row of input) { await db.insert(batches).values({ batchNumber: row.batchNumber, displayName: `Batch ${row.batchNumber}` }).onDuplicateKeyUpdate({ set: { batchNumber: row.batchNumber } }); await db.insert(districts).values({ name: row.districtName }).onDuplicateKeyUpdate({ set: { name: row.districtName } }); const [batch] = await db.select().from(batches).where(eq(batches.batchNumber, row.batchNumber)).limit(1); const [district] = await db.select().from(districts).where(eq(districts.name, row.districtName)).limit(1); const values={slug:row.slug,fullName:row.fullName,batchId:batch?.id,districtId:district?.id,session:row.session,studentId:row.studentId,bloodGroup:row.bloodGroup,photoUrl:row.photoUrl,school:row.school,college:row.college,bsc:row.bsc,msc:row.msc,skill:row.skill,researchActivities:row.researchActivities,currentOrganization:row.organization,currentDesignation:row.designation,currentDuration:row.currentDuration,previousOrganization:row.previousOrganization,previousDesignation:row.previousDesignation,previousDuration:row.previousDuration,whatsapp:row.whatsapp,facebook:row.facebook,linkedin:row.linkedin,industry:row.industry,country:row.country??"Bangladesh",city:row.city,status:"published" as const,createdBy:ctx.user.id}; const { photoUrl, ...valuesWithoutPhoto } = values; await db.insert(alumni).values(values).onDuplicateKeyUpdate({ set: photoUrl === undefined ? valuesWithoutPhoto : values }); } await recordActivity({ actorId: ctx.user.id, action: "imported", entityType: "alumni", details: { count: input.length } }); return { imported: input.length }; }),
      previewExcelImport: editorProcedure.input(z.array(alumniExcelRowInput).min(1).max(1000)).mutation(async ({ input }) => previewAlumniExcelImport(await requireDb(), input)),
      commitExcelImport: editorProcedure.input(z.array(alumniExcelRowInput).min(1).max(1000)).mutation(async ({ ctx, input }) => commitAlumniExcelImport(await requireDb(), ctx.user.id, input)),
    }),
    batches: router({ list: editorProcedure.query(async () => (await requireDb()).select().from(batches).orderBy(batches.batchNumber)), save: editorProcedure.input(batchInput).mutation(async ({ ctx, input }) => { const db = await requireDb(); const { id, ...values } = input; if (id) await db.update(batches).set(values).where(eq(batches.id, id)); else await db.insert(batches).values(values); await recordActivity({ actorId: ctx.user.id, action: id ? "updated" : "created", entityType: "batch", entityId: id ? String(id) : undefined, details: values }); return { success: true }; }), delete: editorProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => { const db = await requireDb(); const linked = await db.select({ value: count() }).from(alumni).where(eq(alumni.batchId, input.id)); if ((linked[0]?.value ?? 0) > 0) throw new TRPCError({ code: "CONFLICT", message: "Move linked alumni before deleting this batch." }); await db.delete(batches).where(eq(batches.id, input.id)); await recordActivity({ actorId: ctx.user.id, action: "deleted", entityType: "batch", entityId: String(input.id) }); return { success: true }; }) }),
    districts: router({ list: editorProcedure.query(async () => (await requireDb()).select().from(districts).orderBy(districts.name)), save: editorProcedure.input(districtInput).mutation(async ({ ctx, input }) => { const db = await requireDb(); const { id, ...values } = input; if (id) await db.update(districts).set(values).where(eq(districts.id, id)); else await db.insert(districts).values(values); await recordActivity({ actorId: ctx.user.id, action: id ? "updated" : "created", entityType: "district", entityId: id ? String(id) : undefined, details: values }); return { success: true }; }), delete: editorProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => { const db = await requireDb(); const linked = await db.select({ value: count() }).from(alumni).where(eq(alumni.districtId, input.id)); if ((linked[0]?.value ?? 0) > 0) throw new TRPCError({ code: "CONFLICT", message: "Move linked alumni before deleting this district." }); await db.delete(districts).where(eq(districts.id, input.id)); await recordActivity({ actorId: ctx.user.id, action: "deleted", entityType: "district", entityId: String(input.id) }); return { success: true }; }) }),
    jobs: router({ list: editorProcedure.query(async () => (await requireDb()).select().from(jobs).orderBy(desc(jobs.updatedAt))), save: editorProcedure.input(jobInput).mutation(async ({ ctx, input }) => { const db = await requireDb(); const { id, deadline, ...values } = input; const row = { ...values, deadline: parseDate(deadline), createdBy: ctx.user.id }; if (id) await db.update(jobs).set(row).where(eq(jobs.id, id)); else await db.insert(jobs).values(row); await recordActivity({ actorId: ctx.user.id, action: id ? "updated" : "created", entityType: "job", entityId: id ? String(id) : undefined, details: { title: input.title } }); return { success: true }; }), delete: editorProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => { const db = await requireDb(); await db.delete(jobs).where(eq(jobs.id, input.id)); await recordActivity({ actorId: ctx.user.id, action: "deleted", entityType: "job", entityId: String(input.id) }); return { success: true }; }) }),
    gallery: router({ list: editorProcedure.query(async () => (await requireDb()).select().from(galleryItems).orderBy(desc(galleryItems.updatedAt))), save: editorProcedure.input(galleryInput).mutation(async ({ ctx, input }) => { const db = await requireDb(); const { id, eventDate, ...values } = input; const row = { ...values, eventDate: parseDate(eventDate), createdBy: ctx.user.id }; if (id) await db.update(galleryItems).set(row).where(eq(galleryItems.id, id)); else await db.insert(galleryItems).values(row); await recordActivity({ actorId: ctx.user.id, action: id ? "updated" : "created", entityType: "gallery", entityId: id ? String(id) : undefined, details: { title: input.title } }); return { success: true }; }), delete: editorProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => { const db = await requireDb(); await db.delete(galleryItems).where(eq(galleryItems.id, input.id)); await recordActivity({ actorId: ctx.user.id, action: "deleted", entityType: "gallery", entityId: String(input.id) }); return { success: true }; }) }),
    content: router({ list: editorProcedure.query(async () => (await requireDb()).select().from(siteContent).orderBy(siteContent.key)), save: editorProcedure.input(z.object({ key: z.string().trim().min(2).max(120), value: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => { const db = await requireDb(); await db.insert(siteContent).values({ key: input.key, value: input.value, updatedBy: ctx.user.id }).onDuplicateKeyUpdate({ set: { value: input.value, updatedBy: ctx.user.id } }); await recordActivity({ actorId: ctx.user.id, action: "updated", entityType: "content", entityId: input.key }); return { success: true }; }) }),
    users: router({ list: adminProcedure.query(async () => (await requireDb()).select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn))), setRole: adminProcedure.input(z.object({ id: z.number().int(), role: z.enum(["user", "editor", "admin"]) })).mutation(async ({ ctx, input }) => { const db = await requireDb(); if (ctx.user.id === input.id && input.role !== "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove your own administrator access." }); await db.update(users).set({ role: input.role }).where(eq(users.id, input.id)); await recordActivity({ actorId: ctx.user.id, action: "role_changed", entityType: "user", entityId: String(input.id), details: { role: input.role } }); return { success: true }; }) }),
    activity: adminProcedure.query(async () => (await requireDb()).select().from((await import("../drizzle/schema")).activityLogs).orderBy(desc((await import("../drizzle/schema")).activityLogs.createdAt)).limit(100)),
    profileChanges: router({
      list: adminProcedure.query(async () => {
        const db = await requireDb();
        return db.select({ id: alumniProfileChanges.id, alumniId: alumniProfileChanges.alumniId, proposedData: alumniProfileChanges.proposedData, status: alumniProfileChanges.status, reviewNotes: alumniProfileChanges.reviewNotes, createdAt: alumniProfileChanges.createdAt, fullName: alumni.fullName, slug: alumni.slug, studentId: alumni.studentId, email: alumni.email }).from(alumniProfileChanges).leftJoin(alumni, eq(alumniProfileChanges.alumniId, alumni.id)).orderBy(desc(alumniProfileChanges.createdAt));
      }),
      review: adminProcedure.input(z.object({ id: z.number().int(), decision: z.enum(["approved", "rejected"]), notes: z.string().trim().max(1000).optional().nullable() })).mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const [change] = await db.select().from(alumniProfileChanges).where(and(eq(alumniProfileChanges.id, input.id), eq(alumniProfileChanges.status, "pending"))).limit(1);
        if (!change) throw new TRPCError({ code: "NOT_FOUND", message: "This profile change is no longer pending." });
        if (input.decision === "approved") {
          const proposedData = alumniProfileDraftInput.parse(change.proposedData);
          if (proposedData.email) {
            const [emailOwner] = await db.select({ id: alumni.id }).from(alumni).where(eq(alumni.email, proposedData.email)).limit(1);
            if (emailOwner && emailOwner.id !== change.alumniId) throw new TRPCError({ code: "BAD_REQUEST", message: "The requested email is already assigned to another alumni record." });
          }
          await db.update(alumni).set(proposedData).where(eq(alumni.id, change.alumniId));
        }
        await db.update(alumniProfileChanges).set({ status: input.decision, reviewNotes: input.notes ?? null, reviewedBy: ctx.user.id, reviewedAt: new Date() }).where(eq(alumniProfileChanges.id, change.id));
        await recordActivity({ actorId: ctx.user.id, action: `profile_change_${input.decision}`, entityType: "alumni", entityId: String(change.alumniId), details: { changeId: change.id } });
        return { success: true } as const;
      }),
    }),
    batchSubmissions: router({
      list: adminProcedure.query(async () => {
        const db = await requireDb();
        return db.select({ id: batchAlumniSubmissions.id, batchId: batchAlumniSubmissions.batchId, batchNumber: batches.batchNumber, fullName: batchAlumniSubmissions.fullName, email: batchAlumniSubmissions.email, studentId: batchAlumniSubmissions.studentId, phone: batchAlumniSubmissions.phone, photoUrl: batchAlumniSubmissions.photoUrl, submittedData: batchAlumniSubmissions.submittedData, status: batchAlumniSubmissions.status, reviewerNotes: batchAlumniSubmissions.reviewerNotes, createdAt: batchAlumniSubmissions.createdAt }).from(batchAlumniSubmissions).leftJoin(batches, eq(batchAlumniSubmissions.batchId, batches.id)).orderBy(desc(batchAlumniSubmissions.createdAt));
      }),
      update: adminProcedure.input(z.object({ id: z.number().int(), fullName: z.string().trim().min(2).max(200), email: z.string().trim().email().max(320).transform(value => value.toLowerCase()), studentId: optionalText, phone: optionalText, districtId: z.number().int().positive().nullable().optional(), submittedData: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const [submission] = await db.select({ status: batchAlumniSubmissions.status, photoUrl: batchAlumniSubmissions.photoUrl }).from(batchAlumniSubmissions).where(eq(batchAlumniSubmissions.id, input.id)).limit(1);
        if (!submission || submission.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Only pending public submissions can be edited." });
        await db.update(batchAlumniSubmissions).set({ fullName: input.fullName, email: input.email, studentId: input.studentId ?? null, phone: input.phone ?? null, districtId: input.districtId ?? null, submittedData: { ...input.submittedData, photoUrl: submission.photoUrl } }).where(eq(batchAlumniSubmissions.id, input.id));
        await recordActivity({ actorId: ctx.user.id, action: "batch_submission_edited", entityType: "batch_submission", entityId: String(input.id) });
        return { success: true } as const;
      }),
      review: adminProcedure.input(z.object({ id: z.number().int(), decision: z.enum(["approved", "rejected"]), notes: z.string().trim().max(1000).optional().nullable() })).mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const [submission] = await db.select().from(batchAlumniSubmissions).where(and(eq(batchAlumniSubmissions.id, input.id), eq(batchAlumniSubmissions.status, "pending"))).limit(1);
        if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "This public submission is no longer pending." });
        let approvedAlumniId: number | null = null;
        if (input.decision === "approved") {
          const matchingConditions = [eq(alumni.email, submission.email)];
          if (submission.studentId) matchingConditions.push(eq(alumni.studentId, submission.studentId));
          const [existing] = await db.select({ id: alumni.id }).from(alumni).where(or(...matchingConditions)).limit(1);
          if (existing) throw new TRPCError({ code: "CONFLICT", message: "A matching alumni record already exists. Resolve the duplicate before approval." });
          const data = submission.submittedData && typeof submission.submittedData === "object" ? submission.submittedData as Record<string, unknown> : {};
          const field = (key: string) => typeof data[key] === "string" ? data[key] : null;
          const safeSlug = `${submission.fullName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "alumni"}-submission-${submission.id}`;
          const result = await db.insert(alumni).values({ fullName: submission.fullName, slug: safeSlug, batchId: submission.batchId, districtId: submission.districtId, email: submission.email, studentId: submission.studentId, phone: submission.phone, photoUrl: submission.photoUrl, session: field("session"), bloodGroup: field("bloodGroup"), school: field("school"), college: field("college"), bsc: field("bsc"), msc: field("msc"), skill: field("skill"), researchActivities: field("researchActivities"), currentOrganization: field("currentOrganization"), currentDesignation: field("currentDesignation"), currentDuration: field("currentDuration"), previousOrganization: field("previousOrganization"), previousDesignation: field("previousDesignation"), previousDuration: field("previousDuration"), whatsapp: field("whatsapp"), facebook: field("facebook"), linkedin: field("linkedin"), country: field("country") || "Bangladesh", city: field("city"), industry: field("industry"), status: "published", createdBy: ctx.user.id });
          approvedAlumniId = Number(result[0].insertId);
        }
        await db.update(batchAlumniSubmissions).set({ status: input.decision, reviewerNotes: input.notes ?? null, reviewedBy: ctx.user.id, reviewedAt: new Date(), approvedAlumniId }).where(eq(batchAlumniSubmissions.id, submission.id));
        await recordActivity({ actorId: ctx.user.id, action: `batch_submission_${input.decision}`, entityType: "batch_submission", entityId: String(submission.id), details: { approvedAlumniId } });
        return { success: true } as const;
      }),
    }),
    uploadPhoto: editorProcedure.input(z.object({ fileName: z.string().max(160), mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/), dataBase64: z.string().min(16).max(7_000_000) })).mutation(async ({ ctx, input }) => { const base64 = input.dataBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, ""); const result = await storagePut(`alumni/${ctx.user.id}/${input.fileName}`, Buffer.from(base64, "base64"), input.mimeType); return result; }),
  }),
});

export type AppRouter = typeof appRouter;
