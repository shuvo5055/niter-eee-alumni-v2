/** Circuit Archive design system: one shared alumni profile template renders each record’s own academic, career, and contact information. */
import { Link } from "wouter";
import { ArrowLeft, Facebook, Linkedin, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { getAlumni } from "@/data/alumni";
import { trpc } from "@/lib/trpc";
import AlumniClaimPanel from "@/components/AlumniClaimPanel";
import { toPublicImageUrl, useManagedImageFallback } from "@/lib/publicImages";

const displayValue = (value?: string) => value?.trim() || "-";

export default function Profile({ params }: { params: { slug: string } }) {
  const managed = trpc.publicData.alumniBySlug.useQuery({ slug: params.slug });
  const legacyPerson = getAlumni(params.slug);
  const person = managed.data ? {
    name: managed.data.fullName,
    photo: toPublicImageUrl(managed.data.photoUrl),
    studentId: managed.data.studentId || "-",
    district: managed.data.districtName || "-",
    degree: managed.data.bsc || "-",
    higherEducation: managed.data.msc || "-",
    industry: managed.data.industry || "-",
    organization: managed.data.currentOrganization || "-",
    position: managed.data.currentDesignation || "-",
    profile: {
      session: managed.data.session || "-", bloodGroup: managed.data.bloodGroup || "-", school: managed.data.school || "-", college: managed.data.college || "-", bsc: managed.data.bsc || "-", msc: managed.data.msc || "-", skill: managed.data.skill || "-", researchActivities: managed.data.researchActivities || "-",
      currentWork: { organization: managed.data.currentOrganization || "-", designation: managed.data.currentDesignation || "-", duration: managed.data.currentDuration || "-" },
      previousWork: { organization: managed.data.previousOrganization || "-", designation: managed.data.previousDesignation || "-", duration: managed.data.previousDuration || "-" },
      contacts: { whatsapp: managed.data.whatsapp || undefined, facebook: managed.data.facebook || undefined, linkedin: managed.data.linkedin || undefined },
    },
  } : legacyPerson;

  if (!person && !managed.isLoading) {
    return <section className="not-found-page"><div><p className="eyebrow">RECORD NOT FOUND</p><h1>This profile is not in the public archive.</h1><Link href="/alumni" className="button button--navy">Back to alumni</Link></div></section>;
  }
  if (!person) return <section className="not-found-page"><div><p className="eyebrow">LOADING RECORD</p><h1>Opening alumni profile…</h1></div></section>;

  const profile = person.profile ?? {};
  const contacts = profile.contacts ?? {};
  const academicRows = [
    ["School", displayValue(profile.school)],
    ["College", displayValue(profile.college)],
    ["BSC", displayValue(profile.bsc ?? person.degree)],
    ["MSc", displayValue(profile.msc ?? person.higherEducation)],
    ["Skill", displayValue(profile.skill ?? person.industry)],
    ["Research Activities", displayValue(profile.researchActivities)],
  ];
  const currentWork = [
    ["Organization", displayValue(profile.currentWork?.organization ?? person.organization)],
    ["Designation", displayValue(profile.currentWork?.designation ?? person.position)],
    ["Duration", displayValue(profile.currentWork?.duration)],
  ];
  const previousWork = [
    ["Organization", displayValue(profile.previousWork?.organization)],
    ["Designation", displayValue(profile.previousWork?.designation)],
    ["Duration", displayValue(profile.previousWork?.duration)],
  ];
  const socialLinks = [
    { label: "WhatsApp", href: contacts.whatsapp || "https://wa.me/", icon: MessageCircle },
    { label: "Facebook", href: contacts.facebook || "https://www.facebook.com/", icon: Facebook },
    { label: "LinkedIn", href: contacts.linkedin || "https://www.linkedin.com/", icon: Linkedin },
  ];

  return (
    <section className="profile-page">
      <div className="container">
        <Link href="/alumni" className="back-to-directory"><ArrowLeft size={16} />Back to Alumni</Link>

        <div className="profile-hero">
          <div className="profile-hero__portrait" style={{ width: "190px", height: "190px", borderRadius: "50%", overflow: "hidden", justifySelf: "center", alignSelf: "center" }}>
            <img src={toPublicImageUrl(person.photo)} onError={useManagedImageFallback} alt={`Portrait of ${person.name}`} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
          </div>
          <div className="profile-hero__info" style={{ transform: "translateY(-22px)" }}>
            <h1>{person.name}</h1>
            <div className="profile-record-summary" style={{ display: "grid", gap: "6px", marginTop: "18px", color: "#c8e2e6", fontSize: "11px", fontWeight: 700, lineHeight: 1.25 }}>
              <span>Session: {displayValue(profile.session)}</span>
              <span>ID: {displayValue(person.studentId)}</span>
              <span>BG: {displayValue(profile.bloodGroup)}</span>
              <span>District: {displayValue(person.district)}</span>
            </div>
          </div>
          <div className="profile-hero__badge"><ShieldCheck size={18} /><span>PUBLIC ALUMNI<br />RECORD</span></div>
        </div>
        {managed.data && <AlumniClaimPanel slug={managed.data.slug} />}

        <div className="profile-grid">
          <section className="profile-section profile-section--personal">
            <div className="profile-section__title"><div><p className="eyebrow">ACADEMIC INFORMATION</p></div></div>
            <dl>{academicRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </section>

          <section className="profile-section">
            <div className="profile-section__title"><div><p className="eyebrow">PROFESSIONAL INFORMATION</p></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "26px", alignItems: "start" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "14px" }}>CURRENT WORK</p>
                <dl style={{ gridTemplateColumns: "1fr", gap: "13px" }}>{currentWork.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              </div>
              <div style={{ borderLeft: "1px solid #d6dedb", paddingLeft: "26px" }}>
                <p className="eyebrow" style={{ marginBottom: "14px" }}>PREVIOUS WORK</p>
                <dl style={{ gridTemplateColumns: "1fr", gap: "13px" }}>{previousWork.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              </div>
            </div>
          </section>

          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", padding: "20px 29px", borderRight: "1px solid #d6dedb", borderBottom: "1px solid #d6dedb", background: "#fffdf8" }}>
            <span className="eyebrow">CONTACT:</span>
            {socialLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#17546a", fontSize: "11px", fontWeight: 800 }}><Icon size={17} />{label}</a>)}
          </div>
        </div>
      </div>
    </section>
  );
}
