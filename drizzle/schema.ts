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
