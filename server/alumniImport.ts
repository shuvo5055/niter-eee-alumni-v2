import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { activityLogs, alumni, batches, districts } from "../drizzle/schema";

const optionalText = z.string().trim().max(5000).optional().nullable();
export const alumniExcelRowInput = z.object({
  rowNumber: z.number().int().min(2), fullName: optionalText, studentId: optionalText, email: optionalText, phone: optionalText,
  batchNumber: z.number().int().min(1).max(99).optional().nullable(), session: optionalText, districtName: optionalText,
  currentOrganization: optionalText, currentDesignation: optionalText, graduationYear: z.number().int().min(1950).max(2100).optional().nullable(),
  address: optionalText, linkedin: optionalText, photoUrl: optionalText, country: optionalText, city: optionalText, industry: optionalText,
  bloodGroup: optionalText, school: optionalText, college: optionalText, bsc: optionalText, msc: optionalText, skill: optionalText,
  researchActivities: optionalText, currentDuration: optionalText, previousOrganization: optionalText, previousDesignation: optionalText,
  previousDuration: optionalText, whatsapp: optionalText, facebook: optionalText, status: z.enum(["draft", "published"]).optional(),
});
export type AlumniExcelRow = z.infer<typeof alumniExcelRowInput>;

type ImportIssue = { rowNumber: number; problem: string; correction: string };
type ValidRow = AlumniExcelRow & { action: "new" | "update"; existingId?: number; slug: string };

const clean = (value?: string | null) => value?.trim() || null;
const normalizedEmail = (value?: string | null) => clean(value)?.toLowerCase() || null;
const normalizeKey = (value?: string | null) => clean(value)?.toLowerCase() || "";
const normalizePhotoUrl = (value?: string | null) => {
  const source = clean(value);
  if (!source) return null;
  if (source.startsWith("/manus-storage/")) return source;
  if (source.startsWith("manus-storage/")) return `/${source}`;
  if (/^https?:\/\//i.test(source)) return source;
  return `/manus-storage/${source.replace(/^\/+/, "")}`;
};
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const importedSlug = (row: AlumniExcelRow) => `${slugify(clean(row.fullName) || "alumnus")}-${slugify(clean(row.studentId) || normalizedEmail(row.email) || String(row.rowNumber))}`.slice(0, 160);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function buildImportPlan(db: any, rows: AlumniExcelRow[]) {
  const existing: Array<{ id: number; slug: string; studentId: string | null; email: string | null }> = await db.select({ id: alumni.id, slug: alumni.slug, studentId: alumni.studentId, email: alumni.email }).from(alumni);
  const byStudentId = new Map<string, { id: number; slug: string; studentId: string | null; email: string | null }>(existing.filter(item => clean(item.studentId)).map(item => [normalizeKey(item.studentId), item]));
  const byEmail = new Map<string, { id: number; slug: string; studentId: string | null; email: string | null }>(existing.filter(item => clean(item.email)).map(item => [normalizeKey(item.email), item]));
  const seenStudentIds = new Set<string>(); const seenEmails = new Set<string>();
  const issues: ImportIssue[] = []; const validRows: ValidRow[] = [];

  for (const source of rows) {
    const row = { ...source, fullName: clean(source.fullName), studentId: clean(source.studentId), email: normalizedEmail(source.email), districtName: clean(source.districtName), session: clean(source.session), currentOrganization: clean(source.currentOrganization), currentDesignation: clean(source.currentDesignation), address: clean(source.address), linkedin: clean(source.linkedin), photoUrl: normalizePhotoUrl(source.photoUrl), country: clean(source.country), city: clean(source.city), industry: clean(source.industry), bloodGroup: clean(source.bloodGroup), school: clean(source.school), college: clean(source.college), bsc: clean(source.bsc), msc: clean(source.msc), skill: clean(source.skill), researchActivities: clean(source.researchActivities), currentDuration: clean(source.currentDuration), previousOrganization: clean(source.previousOrganization), previousDesignation: clean(source.previousDesignation), previousDuration: clean(source.previousDuration), whatsapp: clean(source.whatsapp), facebook: clean(source.facebook), phone: clean(source.phone) };
    if (!row.fullName || row.fullName.length < 2) { issues.push({ rowNumber: row.rowNumber, problem: "Missing alumni name", correction: "Provide a full name with at least two characters." }); continue; }
    if (!row.batchNumber) { issues.push({ rowNumber: row.rowNumber, problem: "Missing or invalid batch", correction: "Provide a numeric batch between 1 and 99." }); continue; }
    if (!row.studentId && !row.email) { issues.push({ rowNumber: row.rowNumber, problem: "Missing unique identity", correction: "Provide a Student ID or email address." }); continue; }
    if (row.email && !emailPattern.test(row.email)) { issues.push({ rowNumber: row.rowNumber, problem: "Invalid email address", correction: "Use a complete address such as name@example.com." }); continue; }
    const studentKey = normalizeKey(row.studentId); const emailKey = normalizeKey(row.email);
    if ((studentKey && seenStudentIds.has(studentKey)) || (emailKey && seenEmails.has(emailKey))) { issues.push({ rowNumber: row.rowNumber, problem: "Duplicate identity in this file", correction: "Keep only one row for each Student ID or email." }); continue; }
    if (studentKey) seenStudentIds.add(studentKey); if (emailKey) seenEmails.add(emailKey);
    const byId = studentKey ? byStudentId.get(studentKey) : undefined; const byMail = emailKey ? byEmail.get(emailKey) : undefined;
    if (byId && byMail && byId.id !== byMail.id) { issues.push({ rowNumber: row.rowNumber, problem: "Conflicting identity match", correction: "Use the Student ID and email that belong to the same alumnus." }); continue; }
    const current = byMail || byId;
    validRows.push({ ...row, action: current ? "update" : "new", existingId: current?.id, slug: current?.slug || importedSlug(row) });
  }
  const batchNumbers = new Set(validRows.map(row => row.batchNumber!));
  const districtNames = new Set(validRows.map(row => normalizeKey(row.districtName)).filter(Boolean));
  const [existingBatches, existingDistricts] = await Promise.all([
    db.select({ batchNumber: batches.batchNumber }).from(batches),
    db.select({ name: districts.name }).from(districts),
  ]);
  const batchSet = new Set(existingBatches.map((item: any) => item.batchNumber));
  const districtSet = new Set(existingDistricts.map((item: any) => normalizeKey(item.name)));
  return {
    validRows, issues,
    totalRows: rows.length, newAlumni: validRows.filter(row => row.action === "new").length,
    updatedAlumni: validRows.filter(row => row.action === "update").length,
    newBatches: Array.from(batchNumbers).filter(number => !batchSet.has(number)),
    newDistricts: Array.from(districtNames).filter(name => !districtSet.has(name)),
  };
}

export async function previewAlumniExcelImport(db: any, rows: AlumniExcelRow[]) {
  const plan = await buildImportPlan(db, rows);
  return {
    totalRows: plan.totalRows, newAlumni: plan.newAlumni, updatedAlumni: plan.updatedAlumni,
    newBatches: plan.newBatches, newDistricts: plan.newDistricts, skippedRows: plan.issues, validRows: plan.validRows.map(row => ({ rowNumber: row.rowNumber, fullName: row.fullName, studentId: row.studentId, email: row.email, batchNumber: row.batchNumber, districtName: row.districtName, action: row.action })),
  };
}

export async function commitAlumniExcelImport(db: any, actorId: number, rows: AlumniExcelRow[]) {
  return db.transaction(async (tx: any) => {
    const plan = await buildImportPlan(tx, rows);
    const batchIds = new Map<number, number>(); const districtIds = new Map<string, number>();
    for (const row of plan.validRows) {
      if (!batchIds.has(row.batchNumber!)) {
        await tx.insert(batches).values({ batchNumber: row.batchNumber!, session: row.session, displayName: `Batch ${row.batchNumber}`, isActive: true }).onDuplicateKeyUpdate({ set: { batchNumber: row.batchNumber! } });
        const [batch] = await tx.select({ id: batches.id }).from(batches).where(eq(batches.batchNumber, row.batchNumber!)).limit(1);
        if (!batch) throw new Error(`Batch ${row.batchNumber} could not be resolved.`); batchIds.set(row.batchNumber!, batch.id);
      }
      const districtKey = normalizeKey(row.districtName);
      if (districtKey && !districtIds.has(districtKey)) {
        await tx.insert(districts).values({ name: row.districtName!, isActive: true }).onDuplicateKeyUpdate({ set: { name: row.districtName! } });
        const [district] = await tx.select({ id: districts.id }).from(districts).where(eq(districts.name, row.districtName!)).limit(1);
        if (!district) throw new Error(`District ${row.districtName} could not be resolved.`); districtIds.set(districtKey, district.id);
      }
    }
    let created = 0; let updated = 0;
    for (const row of plan.validRows) {
      const values = { slug: row.slug, fullName: row.fullName!, batchId: batchIds.get(row.batchNumber!) ?? null, districtId: districtIds.get(normalizeKey(row.districtName)) ?? null, session: row.session, studentId: row.studentId, email: row.email, phone: row.phone, address: row.address, graduationYear: row.graduationYear ?? null, bloodGroup: row.bloodGroup, photoUrl: row.photoUrl, school: row.school, college: row.college, bsc: row.bsc, msc: row.msc, skill: row.skill, researchActivities: row.researchActivities, currentOrganization: row.currentOrganization, currentDesignation: row.currentDesignation, currentDuration: row.currentDuration, previousOrganization: row.previousOrganization, previousDesignation: row.previousDesignation, previousDuration: row.previousDuration, whatsapp: row.whatsapp, facebook: row.facebook, linkedin: row.linkedin, country: row.country || "Bangladesh", city: row.city, industry: row.industry, status: row.status || "published" as "draft" | "published" };
      if (row.existingId) { const { photoUrl, ...valuesWithoutPhoto } = values; await tx.update(alumni).set(photoUrl ? values : valuesWithoutPhoto).where(eq(alumni.id, row.existingId)); updated += 1; }
      else { await tx.insert(alumni).values({ ...values, createdBy: actorId }); created += 1; }
    }
    await tx.insert(activityLogs).values({ actorId, action: "excel_imported", entityType: "alumni", details: { processed: rows.length, created, updated, skipped: plan.issues.length, newBatches: plan.newBatches.length, newDistricts: plan.newDistricts.length } });
    return { processed: rows.length, created, updated, skipped: plan.issues, newBatches: plan.newBatches.length, newDistricts: plan.newDistricts.length };
  });
}
