/** Circuit Archive directory: managed public records appear immediately after an administrator publishes them, with the existing legacy directory retained until import. */
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowDownUp, ArrowRight, UsersRound } from "lucide-react";
import AlumniCard from "@/components/AlumniCard";
import DirectoryControls from "@/components/DirectoryControls";
import { alumni as legacyAlumni } from "@/data/alumni";
import { PageHero } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { toPublicImageUrl } from "@/lib/publicImages";

const toCardRecord = (person: any) => ({ id: String(person.id), slug: person.slug, name: person.fullName, batch: person.batchNumber ?? "-", position: person.currentDesignation || "-", organization: person.currentOrganization || "-", district: person.districtName || "-", country: person.country || "Bangladesh", city: person.city || "-", industry: person.industry || "-", graduationYear: 0, studentId: person.studentId || "-", degree: person.bsc || "-", photo: person.photoUrl, photoRevision: person.updatedAt, category: person.industry || "Other", addedAt: new Date(person.createdAt).getTime() });

export default function Alumni() {
  const [location] = useLocation(); const urlQuery = new URLSearchParams(location.split("?")[1] || "").get("q") || "";
  const [query, setQuery] = useState(urlQuery); const [batch, setBatch] = useState("all"); const [district, setDistrict] = useState("all"); const [job, setJob] = useState("all"); const [org, setOrg] = useState("all"); const [country, setCountry] = useState("all"); const [sort, setSort] = useState("recent"); const [shown, setShown] = useState(9);
  const managed = trpc.publicData.alumniList.useQuery({ search: query || undefined });
  const source = managed.data ? managed.data.map(toCardRecord) : legacyAlumni;
  const filtered = useMemo(() => source.filter((person: any) => { const text = `${person.name} ${person.position} ${person.organization} ${person.district} ${person.batch}`.toLowerCase(); return text.includes(query.toLowerCase()) && (batch === "all" || String(person.batch) === batch) && (district === "all" || person.district === district) && (job === "all" || person.category === job || person.industry === job) && (org === "all" || person.organization === org) && (country === "all" || person.country === country); }).sort((a: any, b: any) => sort === "az" ? a.name.localeCompare(b.name) : sort === "za" ? b.name.localeCompare(a.name) : b.addedAt - a.addedAt), [source, query, batch, district, job, org, country, sort]);
  return <><PageHero eyebrow="ALUMNI DIRECTORY" title="Every path starts with a name." description="Browse the living record of NITER EEE alumni—across generations, locations, and fields of expertise."/><section className="directory-page"><div className="container"><DirectoryControls query={query} setQuery={setQuery} batch={batch} setBatch={setBatch} district={district} setDistrict={setDistrict} job={job} setJob={setJob} organization={org} setOrganization={setOrg} country={country} setCountry={setCountry}/><div className="directory-meta"><span><UsersRound size={17}/><strong>{filtered.length}</strong> public alumni records</span><label><ArrowDownUp size={16}/><select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently added</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label></div>{filtered.length ? <><div className="alumni-grid">{filtered.slice(0, shown).map((person: any) => <AlumniCard person={person} key={person.id}/>)}</div>{shown < filtered.length && <div className="load-more"><button className="button button--outline" onClick={() => setShown(count => count + 6)}>Load more alumni <ArrowRight size={17}/></button></div>}</> : <div className="empty-state"><p className="eyebrow">NO MATCHES</p><h2>Try a wider search.</h2><p>Clear one or more filters to reveal records from the wider NITER EEE community.</p></div>}</div></section></>;
}
