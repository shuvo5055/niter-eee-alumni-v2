import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "editor", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const batches = mysqlTable("batches", {
  id: int("id").autoincrement().primaryKey(),
  batchNumber: int("batchNumber").notNull(),
  session: varchar("session", { length: 64 }),
  displayName: varchar("displayName", { length: 120 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ batchNumberUnique: uniqueIndex("batches_number_uq").on(table.batchNumber) }));

export const districts = mysqlTable("districts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  division: varchar("division", { length: 120 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ nameUnique: uniqueIndex("districts_name_uq").on(table.name) }));

export const alumni = mysqlTable("alumni", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  batchId: int("batchId"),
  districtId: int("districtId"),
  session: varchar("session", { length: 64 }),
  studentId: varchar("studentId", { length: 80 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 80 }),
  address: text("address"),
  graduationYear: int("graduationYear"),
  bloodGroup: varchar("bloodGroup", { length: 12 }),
  photoUrl: text("photoUrl"),
  school: text("school"),
  college: text("college"),
  bsc: text("bsc"),
  msc: text("msc"),
  skill: text("skill"),
  researchActivities: text("researchActivities"),
  currentOrganization: text("currentOrganization"),
  currentDesignation: text("currentDesignation"),
  currentDuration: varchar("currentDuration", { length: 160 }),
  previousOrganization: text("previousOrganization"),
  previousDesignation: text("previousDesignation"),
  previousDuration: varchar("previousDuration", { length: 160 }),
  whatsapp: text("whatsapp"),
  facebook: text("facebook"),
  linkedin: text("linkedin"),
  country: varchar("country", { length: 120 }).default("Bangladesh"),
  city: varchar("city", { length: 120 }),
  industry: varchar("industry", { length: 160 }),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  claimed: boolean("claimed").default(false).notNull(),
  claimedAt: timestamp("claimedAt"),
  claimFailedAttempts: int("claimFailedAttempts").default(0).notNull(),
  claimLockedUntil: timestamp("claimLockedUntil"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  slugUnique: uniqueIndex("alumni_slug_uq").on(table.slug),
  studentIdUnique: uniqueIndex("alumni_student_id_uq").on(table.studentId),
  emailUnique: uniqueIndex("alumni_email_uq").on(table.email),
  batchIndex: index("alumni_batch_idx").on(table.batchId),
  districtIndex: index("alumni_district_idx").on(table.districtId),
  statusIndex: index("alumni_status_idx").on(table.status),
}));

export const alumniProfileChanges = mysqlTable("alumniProfileChanges", {
  id: int("id").autoincrement().primaryKey(),
  alumniId: int("alumniId").notNull(),
  submittedByAlumniId: int("submittedByAlumniId").notNull(),
  proposedData: json("proposedData").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewNotes: text("reviewNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  alumniIndex: index("alumni_profile_changes_alumni_idx").on(table.alumniId),
  statusIndex: index("alumni_profile_changes_status_idx").on(table.status),
}));

/** Short-lived server-verified grants used only to submit a new record for a selected batch. */
export const batchSubmissionAccess = mysqlTable("batchSubmissionAccess", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  tokenHashUnique: uniqueIndex("batch_submission_access_token_uq").on(table.tokenHash),
  batchExpiryIndex: index("batch_submission_access_batch_expiry_idx").on(table.batchId, table.expiresAt),
}));

/** Rate-limit state contains a hashed request fingerprint rather than a raw IP address. */
export const batchAccessAttempts = mysqlTable("batchAccessAttempts", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull(),
  fingerprintHash: varchar("fingerprintHash", { length: 64 }).notNull(),
  failedAttempts: int("failedAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  batchFingerprintUnique: uniqueIndex("batch_access_attempts_fingerprint_uq").on(table.batchId, table.fingerprintHash),
}));

/** New public entries are isolated from canonical alumni data until an Administrator approves them. */
export const batchAlumniSubmissions = mysqlTable("batchAlumniSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull(),
  districtId: int("districtId"),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  studentId: varchar("studentId", { length: 80 }),
  phone: varchar("phone", { length: 80 }),
  photoUrl: text("photoUrl"),
  submittedData: json("submittedData").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewerNotes: text("reviewerNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  approvedAlumniId: int("approvedAlumniId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  statusIndex: index("batch_alumni_submissions_status_idx").on(table.status),
  batchIndex: index("batch_alumni_submissions_batch_idx").on(table.batchId),
  emailIndex: index("batch_alumni_submissions_email_idx").on(table.email),
  studentIdIndex: index("batch_alumni_submissions_student_id_idx").on(table.studentId),
}));

export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  organization: varchar("organization", { length: 220 }).notNull(),
  location: varchar("location", { length: 220 }),
  employmentType: varchar("employmentType", { length: 80 }),
  description: text("description"),
  requirements: text("requirements"),
  applicationLink: text("applicationLink"),
  applicationContact: varchar("applicationContact", { length: 220 }),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ statusIndex: index("jobs_status_idx").on(table.status) }));

export const galleryItems = mysqlTable("galleryItems", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  eventDate: timestamp("eventDate"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 120 }).notNull(),
  value: json("value"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ keyUnique: uniqueIndex("site_content_key_uq").on(table.key) }));

export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId"),
  action: varchar("action", { length: 160 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
