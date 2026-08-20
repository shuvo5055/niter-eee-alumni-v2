import { and, count, desc, eq, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ALUMNI_SESSION_COOKIE, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, alumniProcedure, editorProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { getDb, recordActivity, upsertUser } from "./db";
import { sdk } from "./_core/sdk";
import { alumni, alumniProfileChanges, batches, districts, galleryItems, jobs, siteContent, users } from "../drizzle/schema";
import { storagePut } from "./storage";
import { alumniExcelRowInput, commitAlumniExcelImport, previewAlumniExcelImport } from "./alumniImport";
import { alumniClaimIdentityInput, alumniClaimSetupInput, alumniClaimSignInInput, alumniProfileDraftInput, hashAlumniPassword, verifyAlumniPassword } from "./alumniClaim";

const optionalText = z.string().trim().max(5000).optional().nullable();
const normalizeManagedPhotoUrl = (value: string) => {
  if (value.startsWith("/manus-storage/")) return value;
  if (value.startsWith("manus-storage/")) return `/${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `/manus-storage/${value.replace(/^\/+/, "")}`;
};
const optionalPhotoUrl = z.string().trim().max(5000).transform(normalizeManagedPhotoUrl).optional().nullable();
const alumniInput = z.object({
  id: z.number().int().optional(), fullName: z.string().trim().min(2).max(200), slug: z.string().trim().min(2).max(160),
  batchId: z.number().int().optional().nullable(), districtId: z.number().int().optional().nullable(), session: optionalText,
  studentId: optionalText, email: z.string().trim().email().max(320).transform(value => value.toLowerCase()).optional().nullable(), phone: optionalText, address: optionalText, graduationYear: z.number().int().min(1950).max(2100).optional().nullable(), bloodGroup: optionalText, photoUrl: optionalPhotoUrl, school: optionalText, college: optionalText,
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
  batchNumber: batches.batchNumber, districtName: districts.name, createdAt: alumni.createdAt,
};
const adminAlumniSelect = { ...publicAlumniSelect, email: alumni.email, phone: alumni.phone, address: alumni.address, claimed: alumni.claimed, claimedAt: alumni.claimedAt };

export const appRouter = router({
  system: systemRouter,
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
    setupPassword: publicProcedure.input(alumniClaimSetupInput).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [record] = await db.select().from(alumni).where(eq(alumni.email, input.email)).limit(1);
      if (!record || record.passwordHash || record.claimed) throw new TRPCError({ code: "UNAUTHORIZED", message: claimFailureMessage });
      await db.update(alumni).set({ passwordHash: hashAlumniPassword(input.password), claimed: true, claimedAt: new Date(), claimFailedAttempts: 0, claimLockedUntil: null }).where(eq(alumni.id, record.id));
      await db.insert((await import("../drizzle/schema")).activityLogs).values({ actorId: null, action: "claimed", entityType: "alumni", entityId: String(record.id), details: { source: "first_time_claim" } });
      await setAlumniSession(ctx, record.id);
      return { success: true, slug: record.slug } as const;
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
      const [pending] = await db.select({ id: alumniProfileChanges.id, status: alumniProfileChanges.status, createdAt: alumniProfileChanges.createdAt }).from(alumniProfileChanges).where(and(eq(alumniProfileChanges.alumniId, record.id), eq(alumniProfileChanges.status, "pending"))).limit(1);
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
      const rows = await db.select(publicAlumniSelect).from(alumni).leftJoin(batches, eq(alumni.batchId, batches.id)).leftJoin(districts, eq(alumni.districtId, districts.id)).where(and(eq(alumni.slug, input.slug), eq(alumni.status, "published"))).limit(1);
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
      save: editorProcedure.input(alumniInput).mutation(async ({ ctx, input }) => { const db = await requireDb(); const { id, ...values } = input; if (id) { await db.update(alumni).set(values).where(eq(alumni.id, id)); await recordActivity({ actorId: ctx.user.id, action: "updated", entityType: "alumni", entityId: String(id), details: { fullName: input.fullName } }); return { id }; } const result = await db.insert(alumni).values({ ...values, createdBy: ctx.user.id }); const insertedId = Number(result[0].insertId); await recordActivity({ actorId: ctx.user.id, action: "created", entityType: "alumni", entityId: String(insertedId), details: { fullName: input.fullName } }); return { id: insertedId }; }),
      delete: editorProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => { const db = await requireDb(); await db.delete(alumni).where(eq(alumni.id, input.id)); await recordActivity({ actorId: ctx.user.id, action: "deleted", entityType: "alumni", entityId: String(input.id) }); return { success: true }; }),
      importLegacy: editorProcedure.input(z.array(legacyAlumniInput).max(1000)).mutation(async ({ ctx, input }) => { const db = await requireDb(); for (const row of input) { await db.insert(batches).values({ batchNumber: row.batchNumber, displayName: `Batch ${row.batchNumber}` }).onDuplicateKeyUpdate({ set: { batchNumber: row.batchNumber } }); await db.insert(districts).values({ name: row.districtName }).onDuplicateKeyUpdate({ set: { name: row.districtName } }); const [batch] = await db.select().from(batches).where(eq(batches.batchNumber, row.batchNumber)).limit(1); const [district] = await db.select().from(districts).where(eq(districts.name, row.districtName)).limit(1); const values={slug:row.slug,fullName:row.fullName,batchId:batch?.id,districtId:district?.id,session:row.session,studentId:row.studentId,bloodGroup:row.bloodGroup,photoUrl:row.photoUrl,school:row.school,college:row.college,bsc:row.bsc,msc:row.msc,skill:row.skill,researchActivities:row.researchActivities,currentOrganization:row.organization,currentDesignation:row.designation,currentDuration:row.currentDuration,previousOrganization:row.previousOrganization,previousDesignation:row.previousDesignation,previousDuration:row.previousDuration,whatsapp:row.whatsapp,facebook:row.facebook,linkedin:row.linkedin,industry:row.industry,country:row.country??"Bangladesh",city:row.city,status:"published" as const,createdBy:ctx.user.id}; await db.insert(alumni).values(values).onDuplicateKeyUpdate({ set: values }); } await recordActivity({ actorId: ctx.user.id, action: "imported", entityType: "alumni", details: { count: input.length } }); return { imported: input.length }; }),
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
    uploadPhoto: editorProcedure.input(z.object({ fileName: z.string().max(160), mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/), dataBase64: z.string().min(16).max(7_000_000) })).mutation(async ({ ctx, input }) => { const base64 = input.dataBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, ""); const result = await storagePut(`alumni/${ctx.user.id}/${input.fileName}`, Buffer.from(base64, "base64"), input.mimeType); return result; }),
  }),
});

export type AppRouter = typeof appRouter;
