/** Circuit Archive batch index: administrator-managed batches automatically take over after the legacy directory is imported. */
import { Link } from "wouter";
import { ArrowUpRight, Users } from "lucide-react";
import { PageHero } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { DirectoryLoading } from "@/components/DirectoryLoading";

export default function Batches() {
  const managed = trpc.publicData.batchDirectory.useQuery();
  const records = managed.data ?? [];

  return <>
    <PageHero
      eyebrow="COHORT ARCHIVE"
      title="Find the people who started with you."
      description="Every batch carries a distinct story. Start with your cohort, then follow its professional paths."
    />
    <section className="archive-section">
      <div className="container">
        <div className="section-head section-head--archive">
          <div>
            <p className="eyebrow">BATCH DIRECTORY</p>
            <h2>NITER EEE, <em>by batch.</em></h2>
          </div>
        </div>
        {managed.isFetching ? <DirectoryLoading label="Loading verified batch records…" /> : records.length ? <div className="batch-grid">
          {records.map(batch => <Link href={`/batches/${batch.batchNumber}`} className="batch-card" key={batch.id} style={{ color: "#ffffff" }}>
            <div>
              <h3 style={{ color: "#000000" }}>Batch {batch.batchNumber}</h3>
              <span><Users size={16} />{batch.alumniCount} Alumni</span>
            </div>
            <ArrowUpRight className="batch-card__arrow" size={20} />
          </Link>)}
        </div> : <div className="empty-state"><p className="eyebrow">BATCH DIRECTORY</p><h2>No batch records are available.</h2><p>Published batches will appear here when they are added to the alumni directory.</p></div>}
      </div>
    </section>
  </>;
}
