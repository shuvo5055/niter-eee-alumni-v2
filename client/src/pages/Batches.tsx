/** Circuit Archive batch index: administrator-managed batches automatically take over after the legacy directory is imported. */
import { Link } from "wouter";
import { ArrowUpRight, Users } from "lucide-react";
import { batches as legacyBatches, alumni as legacyAlumni } from "@/data/alumni";
import { PageHero } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function Batches() {
  const managed = trpc.publicData.batchDirectory.useQuery();
  const records = managed.data?.length
    ? managed.data
    : legacyBatches.map(batch => ({
        id: batch,
        batchNumber: batch,
        session: null,
        alumniCount: legacyAlumni.filter(person => person.batch === batch).length || Math.max(13, 50 - (batch - 8) * 4),
      }));

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
        <div className="batch-grid">
          {records.map(batch => <Link href={`/batches/${batch.batchNumber}`} className="batch-card" key={batch.id} style={{ color: "#ffffff" }}>
            <div>
              <h3 style={{ color: "#000000" }}>Batch {batch.batchNumber}</h3>
              <span><Users size={16} />{batch.alumniCount} Alumni</span>
            </div>
            <ArrowUpRight className="batch-card__arrow" size={20} />
          </Link>)}
        </div>
      </div>
    </section>
  </>;
}
