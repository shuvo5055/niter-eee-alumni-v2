import { useMemo } from "react";
import { useLocation } from "wouter";
import { BarChart3, BriefcaseBusiness, Building2, Eye, FilePlus2, FolderPlus, Globe2, GraduationCap, Image, MapPinned, Plus, RefreshCw, Trash2, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { toPublicImageUrl, useManagedImageFallback } from "@/lib/publicImages";

const chartColors = ["#42d3f0", "#277ea3", "#315fc0", "#4fa7b8", "#4a91d0", "#6ec5d2"];
const fmt = (value?: Date | string | null) => value ? new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function AdminOverview({ adminName }: { adminName: string }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const overview = trpc.admin.overview.useQuery();
  const deleteAlumni = trpc.admin.alumni.delete.useMutation({ onSuccess: () => { toast.success("Alumni record removed"); utils.admin.overview.invalidate(); utils.admin.alumni.list.invalidate(); } });
  const deleteJob = trpc.admin.jobs.delete.useMutation({ onSuccess: () => { toast.success("Job post removed"); utils.admin.overview.invalidate(); utils.admin.jobs.list.invalidate(); utils.publicData.publishedJobs.invalidate(); } });
  const data = overview.data;
  const cards = [
    { label: "Total Alumni", helper: "Directory records", value: data?.counts.alumni ?? 0, icon: Users, tone: "cyan" },
    { label: "Total Batches", helper: "Active cohorts", value: data?.counts.batches ?? 0, icon: GraduationCap, tone: "violet" },
    { label: "Total Districts", helper: "Directory coverage", value: data?.counts.districts ?? 0, icon: MapPinned, tone: "blue" },
    { label: "Total Jobs", helper: "Opportunity posts", value: data?.counts.jobs ?? 0, icon: BriefcaseBusiness, tone: "amber" },
    { label: "Admin / Users", helper: "Authorized accounts", value: data?.counts.users ?? 0, icon: UserCog, tone: "green" },
  ];
  const batches = data?.byBatch ?? [];
  const maxBatch = Math.max(1, ...batches.map(row => Number(row.value)));
  const districts = (data?.byDistrict ?? []).filter(row => Number(row.value) > 0).slice(0, 5);
  const districtTotal = Math.max(1, districts.reduce((total, row) => total + Number(row.value), 0));
  const donut = useMemo(() => { let mark = 0; return districts.map((row, index) => { const next = mark + Number(row.value) / districtTotal * 100; const segment = `${chartColors[index % chartColors.length]} ${mark}% ${next}%`; mark = next; return segment; }).join(", ") || "#dce7ee 0 100%"; }, [districts, districtTotal]);
  const go = (path: string) => setLocation(path);

  return <div className="admin-overview">
    <section className="admin-welcome">
      <div><p className="admin-kicker">NITER EEE ALUMNI NETWORK</p><h1>Welcome back, {adminName || "Admin"}.</h1><p>Here’s what’s happening across the NITER EEE Alumni Network.</p></div>
      <button className="admin-action admin-action--light" onClick={() => overview.refetch()}><RefreshCw size={15} />Refresh data</button>
    </section>
    <section className="admin-stat-grid admin-stat-grid--premium">{cards.map(({ label, helper, value, icon: Icon, tone }) => <article className={`admin-stat admin-stat--${tone}`} key={label}><div className="admin-stat__icon"><Icon size={19} /></div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></article>)}</section>
    <section className="admin-quick-actions"><div><p className="admin-kicker">QUICK ACTIONS</p><h2>Manage the network faster.</h2></div><div className="admin-quick-actions__buttons"><button onClick={() => go("/admin/alumni")}><Plus size={16} />Add New Alumni</button><button onClick={() => go("/admin/batches")}><GraduationCap size={16} />Add New Batch</button><button onClick={() => go("/admin/jobs")}><BriefcaseBusiness size={16} />Add Job</button><button onClick={() => go("/admin/alumni")}><FilePlus2 size={16} />Import Alumni</button><button className="admin-action--ghost" onClick={() => window.open("/", "_blank", "noopener")}><Globe2 size={16} />View Public Website</button></div></section>
    <section className="admin-analytics-grid">
      <article className="admin-chart-card"><div className="admin-card-heading"><div><p className="admin-kicker">LIVE DIRECTORY DATA</p><h2>Alumni by Batch</h2></div><BarChart3 size={20} /></div>{batches.length ? <div className="admin-batch-chart">{batches.map((row, index) => <div key={String(row.label)}><div className="admin-batch-chart__value">{row.value}</div><i style={{ height: `${Math.max(9, Number(row.value) / maxBatch * 100)}%`, background: chartColors[index % chartColors.length] }} /><span>B{row.label}</span></div>)}</div> : <p className="admin-empty">No managed batch data yet.</p>}</article>
      <article className="admin-chart-card"><div className="admin-card-heading"><div><p className="admin-kicker">LIVE DIRECTORY DATA</p><h2>Alumni by District</h2></div><MapPinned size={20} /></div>{districts.length ? <div className="admin-district-chart"><div className="admin-donut" style={{ background: `conic-gradient(${donut})` }}><span><strong>{districtTotal}</strong><small>ALUMNI</small></span></div><div className="admin-chart-legend">{districts.map((row, index) => <div key={String(row.label)}><i style={{ background: chartColors[index % chartColors.length] }} /><span>{row.label}</span><strong>{row.value}</strong></div>)}</div></div> : <p className="admin-empty">No managed district data yet.</p>}</article>
    </section>
    <section className="admin-data-card"><div className="admin-card-heading"><div><p className="admin-kicker">DIRECTORY ACTIVITY</p><h2>Recently Added Alumni</h2></div><button className="admin-text-link" onClick={() => go("/admin/alumni")}>View All Alumni</button></div><div className="admin-table-wrap"><table className="admin-premium-table"><thead><tr><th>Profile</th><th>Batch / Session</th><th>District</th><th>Current Organization</th><th>Designation</th><th>Added Date</th><th>Actions</th></tr></thead><tbody>{data?.recentAlumni?.map((row: any) => <tr key={row.id}><td className="admin-person">{row.photoUrl ? <img src={toPublicImageUrl(row.photoUrl)} onError={useManagedImageFallback} alt="" /> : <span>{row.fullName?.slice(0, 1)}</span>}<strong>{row.fullName}</strong></td><td>Batch {row.batchNumber ?? "—"}<small>{row.session || "—"}</small></td><td>{row.districtName || "—"}</td><td>{row.currentOrganization || "—"}</td><td>{row.currentDesignation || "—"}</td><td>{fmt(row.createdAt)}</td><td className="admin-row-actions"><button title="View public profile" onClick={() => window.open(`/alumni/${row.slug}`, "_blank", "noopener")}><Eye size={15} /></button><button title="Edit alumni" onClick={() => go("/admin/alumni")}><FolderPlus size={15} /></button><button title="Delete alumni" className="danger" onClick={() => window.confirm(`Delete ${row.fullName}?`) && deleteAlumni.mutate({ id: row.id })}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>{!data?.recentAlumni?.length && <p className="admin-empty admin-empty--spaced">No recently added alumni yet.</p>}</section>
    <section className="admin-data-card"><div className="admin-card-heading"><div><p className="admin-kicker">OPPORTUNITY BOARD</p><h2>Recent Job Posts</h2></div><button className="admin-text-link" onClick={() => go("/admin/jobs")}>View All Jobs</button></div><div className="admin-table-wrap"><table className="admin-premium-table"><thead><tr><th>Job Title</th><th>Organization</th><th>Location</th><th>Posted Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data?.recentJobs?.map((row: any) => <tr key={row.id}><td><strong>{row.title}</strong></td><td>{row.organization}</td><td>{row.location || "—"}</td><td>{fmt(row.createdAt)}</td><td><em className={`status status--${row.status}`}>{row.status}</em></td><td className="admin-row-actions"><button title="View jobs" onClick={() => window.open("/jobs", "_blank", "noopener")}><Eye size={15} /></button><button title="Edit job" onClick={() => go("/admin/jobs")}><FolderPlus size={15} /></button><button title="Delete job" className="danger" onClick={() => window.confirm(`Delete ${row.title}?`) && deleteJob.mutate({ id: row.id })}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>{!data?.recentJobs?.length && <p className="admin-empty admin-empty--spaced">No job posts have been managed yet.</p>}</section>
  </div>;
}
