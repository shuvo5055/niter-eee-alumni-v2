/** Circuit Archive directory: managed public records appear immediately after an administrator publishes them. */
import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { ArrowDownUp, ArrowRight, UsersRound } from "lucide-react";
import AlumniCard from "@/components/AlumniCard";
import DirectoryControls from "@/components/DirectoryControls";
import { PageHero } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { AlumniCardsLoading } from "@/components/DirectoryLoading";

const toCardRecord = (person: any) => ({ id: String(person.id), slug: person.slug, name: person.fullName, batch: person.batchNumber ?? "-", position: person.currentDesignation || "-", organization: person.currentOrganization || "-", district: person.districtName || "-", country: person.country || "Bangladesh", city: person.city || "-", industry: person.industry || "-", graduationYear: 0, studentId: person.studentId || "-", degree: person.bsc || "-", photo: person.photoUrl, photoRevision: person.updatedAt, category: person.industry || "Other", addedAt: new Date(person.createdAt).getTime() });

export default function Alumni() {
  const searchParams = useSearch();
  const urlQuery = new URLSearchParams(searchParams).get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [batch, setBatch] = useState("all");
  const [district, setDistrict] = useState("all");
  const [job, setJob] = useState("all");
  const [org, setOrg] = useState("all");
  const [country, setCountry] = useState("all");
  const [sort, setSort] = useState("recent");
  const [shown, setShown] = useState(9);
  const managed = trpc.publicData.alumniList.useQuery({ search: query || undefined });
  const source = managed.data?.map(toCardRecord) ?? [];
  const filtered = useMemo(() => source.filter((person: any) => (batch === "all" || String(person.batch) === batch) && (district === "all" || person.district === district) && (job === "all" || person.category === job || person.industry === job) && (org === "all" || person.organization === org) && (country === "all" || person.country === country)).sort((a: any, b: any) => sort === "az" ? a.name.localeCompare(b.name) : sort === "za" ? b.name.localeCompare(a.name) : b.addedAt - a.addedAt), [source, batch, district, job, org, country, sort]);
  const clearSearch = () => { setQuery(""); setShown(9); };
  return <><PageHero eyebrow="ALUMNI DIRECTORY" title="Every path starts with a name." description=""/><section className="directory-page"><div className="container"><DirectoryControls query={query} setQuery={value => { setQuery(value); setShown(9); }} batch={batch} setBatch={value => { setBatch(value); setShown(9); }} district={district} setDistrict={value => { setDistrict(value); setShown(9); }} job={job} setJob={value => { setJob(value); setShown(9); }} organization={org} setOrganization={value => { setOrg(value); setShown(9); }} country={country} setCountry={value => { setCountry(value); setShown(9); }}/><div className="directory-meta"><span><UsersRound size={17}/><strong>{managed.isFetching ? "…" : filtered.length}</strong> public alumni records</span><label><ArrowDownUp size={16}/><select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently added</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label></div>{managed.isFetching ? <AlumniCardsLoading/> : managed.isError ? <div className="empty-state"><p className="eyebrow">DIRECTORY ERROR</p><h2>Unable to load alumni data. Please try again.</h2><button className="button button--outline" onClick={() => managed.refetch()}>Try again <ArrowRight size={17}/></button></div> : filtered.length ? <><div className="alumni-grid">{filtered.slice(0, shown).map((person: any) => <AlumniCard person={person} key={person.id}/>)}</div>{shown < filtered.length && <div className="load-more"><button className="button button--outline" onClick={() => setShown(count => count + 6)}>Load more alumni <ArrowRight size={17}/></button></div>}</> : <div className="empty-state"><p className="eyebrow">NO RESULTS FOUND</p><h2>No results found</h2><p>No alumni match your search. Try another name, batch, district, profession, or organization.</p>{query && <button className="button button--outline" onClick={clearSearch}>Clear Search <ArrowRight size={17}/></button>}</div>}</div></section></>;
}
