/** Circuit Archive design system: a professional profile reads like an alumni record, not a social media card. */
import { Link } from "wouter";
import { ArrowLeft, BriefcaseBusiness, Building2, GraduationCap, MapPin, Globe2, Linkedin, Mail, ShieldCheck, Facebook, MessageCircle } from "lucide-react";
import { getAlumni } from "@/data/alumni";

export default function Profile({ params }: { params: { slug: string } }) {
  const person = getAlumni(params.slug);

  if (!person) {
    return (
      <section className="not-found-page">
        <div>
          <p className="eyebrow">RECORD NOT FOUND</p>
          <h1>This profile is not in the public archive.</h1>
          <Link href="/alumni" className="button button--navy">Back to alumni</Link>
        </div>
      </section>
    );
  }

  const academicProfile = person.profileMode === "academic";

  return (
    <section className="profile-page">
      <div className="container">
        <Link href="/alumni" className="back-to-directory"><ArrowLeft size={16} />Back to Alumni</Link>

        <div className="profile-hero">
          <div
            className="profile-hero__portrait"
            style={academicProfile ? { width: "190px", height: "190px", borderRadius: "50%", overflow: "hidden", justifySelf: "center", alignSelf: "center" } : undefined}
          >
            <img src={person.photo} alt={`Portrait of ${person.name}`} style={academicProfile ? { width: "100%", height: "100%", borderRadius: "50%" } : undefined} />
            {!academicProfile && <span />}
          </div>
          <div className="profile-hero__info">
            {!academicProfile && <p className="eyebrow">NITER EEE / BATCH {person.batch}</p>}
            <h1>{person.name}</h1>
            {academicProfile ? (
              <div className="profile-record-summary" style={{ display: "flex", flexWrap: "wrap", gap: "9px 18px", marginTop: "14px", color: "#c8e2e6", fontSize: "11px", fontWeight: 700 }}>
                <span>Session: {person.profileSession}</span>
                <span>ID: {person.studentId}</span>
                <span>BG: {person.bloodGroup}</span>
                <span>District: {person.district}</span>
              </div>
            ) : (
              <>
                <p className="profile-role">{person.position}</p>
                <p className="profile-organization"><Building2 size={18} />{person.organization}</p>
                <div className="profile-location"><span><MapPin size={15} />{person.district}, Bangladesh</span><span><Globe2 size={15} />{person.city}, {person.country}</span></div>
              </>
            )}
          </div>
          <div className="profile-hero__badge"><ShieldCheck size={18} /><span>PUBLIC ALUMNI<br />RECORD</span></div>
        </div>

        {academicProfile ? (
          <div className="profile-grid">
            <section className="profile-section profile-section--personal">
              <div className="profile-section__title"><div><p className="eyebrow">ACADEMIC INFORMATION</p></div></div>
              <dl>
                <div><dt>School</dt><dd>{person.profileSchool}</dd></div>
                <div><dt>College</dt><dd>{person.profileCollege}</dd></div>
                <div><dt>BSC</dt><dd>{person.profileBsc}</dd></div>
                <div><dt>MSc</dt><dd>{person.profileMsc}</dd></div>
                <div><dt>Skill</dt><dd>{person.profileSkills}</dd></div>
                <div><dt>Research activities</dt><dd>{person.profileResearchActivities}</dd></div>
              </dl>
            </section>

            <section className="profile-section">
              <div className="profile-section__title"><div><p className="eyebrow">PROFESSIONAL INFORMATION</p></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "26px", alignItems: "start" }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: "14px" }}>CURRENT WORK</p>
                  <dl style={{ gridTemplateColumns: "1fr", gap: "13px" }}>
                    <div><dt>Organization</dt><dd>{person.organization}</dd></div>
                    <div><dt>Designation</dt><dd>{person.position}</dd></div>
                    <div><dt>Duration</dt><dd>{person.profileCurrentDuration}</dd></div>
                  </dl>
                </div>
                <div style={{ borderLeft: "1px solid #d6dedb", paddingLeft: "26px" }}>
                  <p className="eyebrow" style={{ marginBottom: "14px" }}>PREVIOUS WORK</p>
                  <dl style={{ gridTemplateColumns: "1fr", gap: "13px" }}>
                    <div><dt>Organization</dt><dd>{person.profilePreviousOrganization}</dd></div>
                    <div><dt>Designation</dt><dd>{person.profilePreviousDesignation}</dd></div>
                    <div><dt>Duration</dt><dd>{person.profilePreviousDuration}</dd></div>
                  </dl>
                </div>
              </div>
            </section>

            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", padding: "20px 29px", borderRight: "1px solid #d6dedb", borderBottom: "1px solid #d6dedb", background: "#fffdf8" }}>
              <span className="eyebrow">CONTACT:</span>
              <a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="WhatsApp" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#17546a", fontSize: "11px", fontWeight: 800 }}><MessageCircle size={17} />WhatsApp</a>
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#17546a", fontSize: "11px", fontWeight: 800 }}><Facebook size={17} />Facebook</a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#17546a", fontSize: "11px", fontWeight: 800 }}><Linkedin size={17} />LinkedIn</a>
            </div>
          </div>
        ) : (
          <div className="profile-grid">
            <section className="profile-section profile-section--personal"><div className="profile-section__title"><span>01</span><div><p className="eyebrow">PERSONAL INFORMATION</p><h2>At a glance</h2></div></div><dl><div><dt>Batch</dt><dd>Batch {person.batch}</dd></div><div><dt>Student ID</dt><dd>{person.studentId}</dd></div><div><dt>Graduation year</dt><dd>{person.graduationYear}</dd></div><div><dt>Home district</dt><dd>{person.district}</dd></div></dl></section>
            <section className="profile-section"><div className="profile-section__title"><span>02</span><div><p className="eyebrow">PROFESSIONAL INFORMATION</p><h2>Current work</h2></div></div><dl><div><dt>Current position</dt><dd>{person.position}</dd></div><div><dt>Organization</dt><dd>{person.organization}</dd></div><div><dt>Industry</dt><dd>{person.industry}</dd></div><div><dt>Current location</dt><dd>{person.city}, {person.country}</dd></div></dl></section>
            <section className="profile-section"><div className="profile-section__title"><span>03</span><div><p className="eyebrow">EDUCATION</p><h2>Learning record</h2></div></div><div className="education-record"><GraduationCap size={23} /><div><strong>NITER EEE</strong><p>{person.degree}</p><small>Graduated {person.graduationYear}</small></div></div>{person.higherEducation && <div className="education-record"><BriefcaseBusiness size={23} /><div><strong>Higher Education</strong><p>{person.higherEducation}</p></div></div>}</section>
            <section className="profile-section profile-section--contact"><div className="profile-section__title"><span>04</span><div><p className="eyebrow">SOCIAL / CONTACT</p><h2>Professional channels</h2></div></div><p>Public profiles do not display private email or phone information. Professional contact can be coordinated through the alumni network.</p><div className="profile-buttons"><button className="button button--outline"><Linkedin size={17} />LinkedIn</button><button className="button button--outline"><Mail size={17} />Request introduction</button></div></section>
          </div>
        )}
      </div>
    </section>
  );
}
