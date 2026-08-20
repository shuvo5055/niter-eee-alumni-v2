export const ALUMNI_IMPORT_FIELDS = [
  "studentId", "fullName", "email", "phone", "batchNumber", "session", "districtName", "department",
  "currentOrganization", "currentDesignation", "graduationYear", "address", "linkedin", "photoUrl", "country",
  "city", "industry", "bloodGroup", "school", "college", "bsc", "msc", "skill", "researchActivities",
  "currentDuration", "previousOrganization", "previousDesignation", "previousDuration", "whatsapp", "facebook", "status",
] as const;

export type AlumniImportField = typeof ALUMNI_IMPORT_FIELDS[number];

export const ALUMNI_IMPORT_LABELS: Record<AlumniImportField, string> = {
  studentId: "Student ID", fullName: "Full name", email: "Email", phone: "Phone", batchNumber: "Batch", session: "Session",
  districtName: "District", department: "Department", currentOrganization: "Current organization", currentDesignation: "Job title",
  graduationYear: "Graduation year", address: "Address", linkedin: "LinkedIn", photoUrl: "Profile image URL", country: "Country",
  city: "City", industry: "Industry", bloodGroup: "Blood group", school: "School", college: "College", bsc: "BSc", msc: "MSc",
  skill: "Skill", researchActivities: "Research activities", currentDuration: "Current work duration", previousOrganization: "Previous organization",
  previousDesignation: "Previous designation", previousDuration: "Previous work duration", whatsapp: "WhatsApp", facebook: "Facebook", status: "Status",
};

const aliases: Record<AlumniImportField, string[]> = {
  studentId: ["student id", "alumni id", "id", "studentid", "alumniid"],
  fullName: ["name", "full name", "alumni name", "fullname"],
  email: ["email", "email address", "mail"],
  phone: ["phone", "mobile", "phone number", "mobile number", "contact number"],
  batchNumber: ["batch", "batch number", "batch no", "batchno"],
  session: ["session", "academic session"],
  districtName: ["district", "home district"],
  department: ["department", "dept"],
  currentOrganization: ["current organization", "organization", "company", "employer"],
  currentDesignation: ["job title", "designation", "current position", "position", "job"],
  graduationYear: ["graduation year", "graduationyear", "passing year", "year"],
  address: ["address", "current address"],
  linkedin: ["linkedin", "linkedin url"],
  photoUrl: ["profile image url", "photo url", "image url", "profile photo"],
  country: ["country", "current country"], city: ["city", "current city"], industry: ["industry", "profession"],
  bloodGroup: ["blood group", "bloodgroup", "bg"], school: ["school"], college: ["college"], bsc: ["bsc", "b.sc", "bachelor"],
  msc: ["msc", "m.sc", "master"], skill: ["skill", "skills"], researchActivities: ["research activities", "research"],
  currentDuration: ["current duration", "work duration", "duration"], previousOrganization: ["previous organization", "previous company"],
  previousDesignation: ["previous designation", "previous position"], previousDuration: ["previous duration", "previous work duration"],
  whatsapp: ["whatsapp", "whatsapp url"], facebook: ["facebook", "facebook url"], status: ["status", "publication status"],
};

export function normalizeExcelHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[_\-/.()]+/g, " ").replace(/\s+/g, " ");
}

export function suggestAlumniImportMapping(headers: string[]) {
  const mapping: Partial<Record<AlumniImportField, string>> = {};
  for (const field of ALUMNI_IMPORT_FIELDS) {
    const matched = headers.find(header => aliases[field].includes(normalizeExcelHeader(header)));
    if (matched) mapping[field] = matched;
  }
  return mapping;
}

export function toImportText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
