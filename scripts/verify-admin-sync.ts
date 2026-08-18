import { appRouter } from "../server/routers";
import { getDb, getUserByOpenId } from "../server/db";
import { alumni as legacyAlumni } from "../client/src/data/alumni";

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is not available for the controlled owner migration.");

const owner = await getUserByOpenId(ownerOpenId);
if (!owner || owner.role !== "admin") throw new Error("The project owner must have an administrator role before importing the legacy directory.");

const caller = appRouter.createCaller({
  user: owner,
  req: {} as never,
  res: {} as never,
});

const payload = legacyAlumni.map(person => ({
  slug: person.slug,
  fullName: person.name,
  batchNumber: person.batch,
  districtName: person.district,
  studentId: person.studentId,
  photoUrl: person.photo,
  organization: person.organization,
  designation: person.position,
  industry: person.industry,
  country: person.country,
  city: person.city,
  session: person.profile?.session,
  bloodGroup: person.profile?.bloodGroup,
  school: person.profile?.school,
  college: person.profile?.college,
  bsc: person.profile?.bsc,
  msc: person.profile?.msc,
  skill: person.profile?.skill,
  researchActivities: person.profile?.researchActivities,
  currentDuration: person.profile?.currentWork?.duration,
  previousOrganization: person.profile?.previousWork?.organization,
  previousDesignation: person.profile?.previousWork?.designation,
  previousDuration: person.profile?.previousWork?.duration,
  whatsapp: person.profile?.contacts?.whatsapp,
  facebook: person.profile?.contacts?.facebook,
  linkedin: person.profile?.contacts?.linkedin,
}));

const imported = await caller.admin.alumni.importLegacy(payload);
const publicAlumni = await caller.publicData.alumniList();
const publicBatches = await caller.publicData.batchDirectory();
const publicDistricts = await caller.publicData.districtDirectory();
const db = await getDb();
if (!db || publicAlumni.length < payload.length || publicBatches.length === 0 || publicDistricts.length === 0) {
  throw new Error("Legacy migration did not produce the expected public directory records.");
}

console.log(JSON.stringify({ imported: imported.imported, publicAlumni: publicAlumni.length, publicBatches: publicBatches.length, publicDistricts: publicDistricts.length }));
