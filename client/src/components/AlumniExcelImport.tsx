import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ALUMNI_IMPORT_FIELDS, ALUMNI_IMPORT_LABELS, suggestAlumniImportMapping, toImportText, type AlumniImportField } from "@shared/alumniImport";
import { trpc } from "@/lib/trpc";

type SourceRow = { rowNumber: number; values: Record<string, unknown> };
type ImportRow = { rowNumber: number; fullName?: string | null; studentId?: string | null; email?: string | null; phone?: string | null; batchNumber?: number | null; session?: string | null; districtName?: string | null; currentOrganization?: string | null; currentDesignation?: string | null; graduationYear?: number | null; address?: string | null; linkedin?: string | null; photoUrl?: string | null; country?: string | null; city?: string | null; industry?: string | null; bloodGroup?: string | null; school?: string | null; college?: string | null; bsc?: string | null; msc?: string | null; skill?: string |null; researchActivities?: string | null; currentDuration?: string | null; previousOrganization?: string | null; previousDesignation?: string | null; previousDuration?: string | null; whatsapp?: string | null; facebook?: string | null; status?: "draft" | "published" };

const textFields = ALUMNI_IMPORT_FIELDS.filter(field => field !== "department" && field !== "batchNumber" && field !== "graduationYear" && field !== "status");
const normalizeStatus = (value: unknown) => String(value ?? "").trim().toLowerCase() === "draft" ? "draft" : "published" as const;
const parseOptionalNumber = (value: unknown) => { const text = toImportText(value); if (!text) return null; const numeric = Number(text); return Number.isInteger(numeric) ? numeric : null; };

export default function AlumniExcelImport({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<AlumniImportField, string>>>({});
  const [preview, setPreview] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const previewMutation = trpc.admin.alumni.previewExcelImport.useMutation({ onSuccess: setPreview, onError: error => toast.error(error.message) });
  const commitMutation = trpc.admin.alumni.commitExcelImport.useMutation({ onSuccess: data => { setSummary(data); setPreview(null); onImported(); toast.success("Import completed successfully"); }, onError: error => toast.error(error.message) });

  const mappedRows = useMemo<ImportRow[]>(() => sourceRows.map(row => {
    const value = (field: AlumniImportField) => mapping[field] ? row.values[mapping[field]!] : null;
    const text = (field: AlumniImportField) => toImportText(value(field));
    return {
      rowNumber: row.rowNumber,
      fullName: text("fullName"), studentId: text("studentId"), email: text("email"), phone: text("phone"),
      batchNumber: parseOptionalNumber(value("batchNumber")), session: text("session"), districtName: text("districtName"),
      currentOrganization: text("currentOrganization"), currentDesignation: text("currentDesignation"), graduationYear: parseOptionalNumber(value("graduationYear")),
      address: text("address"), linkedin: text("linkedin"), photoUrl: text("photoUrl"), country: text("country"), city: text("city"), industry: text("industry"),
      bloodGroup: text("bloodGroup"), school: text("school"), college: text("college"), bsc: text("bsc"), msc: text("msc"), skill: text("skill"), researchActivities: text("researchActivities"),
      currentDuration: text("currentDuration"), previousOrganization: text("previousOrganization"), previousDesignation: text("previousDesignation"), previousDuration: text("previousDuration"), whatsapp: text("whatsapp"), facebook: text("facebook"), status: normalizeStatus(value("status")),
    };
  }), [mapping, sourceRows]);

  const downloadTemplate = () => {
    const columns = ALUMNI_IMPORT_FIELDS.filter(field => field !== "department").map(field => ALUMNI_IMPORT_LABELS[field]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([columns]), "Alumni Import");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Required fields", "Full name, Batch, and either Student ID or Email"], ["Status", "Use published or draft. Blank defaults to published."], ["Identity", "Student ID has priority. Email is used when Student ID is unavailable."]]), "Instructions");
    XLSX.writeFile(workbook, "niter-eee-alumni-import-template.xlsx");
  };

  const readWorkbook = async (file?: File) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) { toast.error("Upload an .xlsx or .xls Excel file."); return; }
    if (file.size > 5_000_000) { toast.error("Keep Excel files below 5 MB."); return; }
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0] || ""];
      const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "", raw: false });
      const nextHeaders = Object.keys(sheetRows[0] || {});
      if (!nextHeaders.length) { toast.error("The first worksheet needs a header row and at least one data row."); return; }
      if (sheetRows.length > 1000) { toast.error("Import up to 1,000 alumni per file."); return; }
      setFileName(file.name); setHeaders(nextHeaders); setSourceRows(sheetRows.map((values, index) => ({ rowNumber: index + 2, values }))); setMapping(suggestAlumniImportMapping(nextHeaders)); setPreview(null); setSummary(null);
    } catch { toast.error("The Excel file could not be read. Check the workbook format and try again."); }
  };

  return <div className="admin-modal admin-import-modal" role="dialog" aria-modal="true" aria-label="Import alumni from Excel">
    <div className="admin-modal__body admin-import-modal__body">
      <button className="admin-modal__close" onClick={onClose} aria-label="Close Excel import"><X size={18} /></button>
      <p className="eyebrow">EXCEL BULK IMPORT</p>
      <h2>Import the alumni directory.</h2>
      <p className="admin-import-intro">Upload one Excel file, review the mapped columns and validation preview, then securely create or update alumni records.</p>
      {summary ? <section className="admin-import-summary"><CheckCircle2 size={24} /><div><strong>Import completed successfully</strong><span>{summary.processed} processed · {summary.created} new · {summary.updated} updated · {summary.newBatches} batches · {summary.newDistricts} districts · {summary.skipped.length} skipped</span></div></section> : <>
        <div className="admin-import-actions"><button className="admin-action admin-action--muted" onClick={downloadTemplate}><Download size={15} /> Excel template</button><button className="admin-action" onClick={() => fileInput.current?.click()}><Upload size={15} /> {fileName ? "Replace file" : "Upload Excel"}</button><input ref={fileInput} className="sr-only" type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={event => readWorkbook(event.target.files?.[0])} /></div>
        {!sourceRows.length ? <div className="admin-import-dropzone"><FileSpreadsheet size={30} /><strong>Upload an .xlsx or .xls file</strong><span>Up to 1,000 rows. The workbook stays in your browser until you confirm the import.</span></div> : <>
          <div className="admin-import-file"><FileSpreadsheet size={18} /><span><strong>{fileName}</strong><small>{sourceRows.length} data rows · {headers.length} columns detected</small></span></div>
          <section className="admin-import-mapping"><div><p className="eyebrow">COLUMN MAPPING</p><span>Review detected columns before validation. Required: Full name, Batch, and Student ID or Email.</span></div><div className="admin-import-mapping-grid">{ALUMNI_IMPORT_FIELDS.filter(field => field !== "department").map(field => <label key={field}><span>{ALUMNI_IMPORT_LABELS[field]}{["fullName", "batchNumber", "studentId"].includes(field) ? " *" : ""}</span><select value={mapping[field] || "__skip"} onChange={event => { setMapping(current => ({ ...current, [field]: event.target.value === "__skip" ? undefined : event.target.value })); setPreview(null); }}><option value="__skip">Do not import</option>{headers.map(header => <option value={header} key={header}>{header}</option>)}</select></label>)}</div></section>
          <div className="admin-modal__actions"><button className="admin-action admin-action--muted" onClick={onClose}>Cancel</button><button className="admin-action" disabled={previewMutation.isPending} onClick={() => previewMutation.mutate(mappedRows)}>{previewMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <FileSpreadsheet size={15} />} Validate & preview</button></div>
          {preview && <section className="admin-import-preview"><div className="admin-import-preview__title"><div><p className="eyebrow">IMPORT PREVIEW</p><h3>Review before importing</h3></div><span>{preview.totalRows} rows analysed</span></div><div className="admin-import-stats"><div><strong>{preview.newAlumni}</strong><span>New alumni</span></div><div><strong>{preview.updatedAlumni}</strong><span>Updates</span></div><div><strong>{preview.newBatches.length}</strong><span>New batches</span></div><div><strong>{preview.newDistricts.length}</strong><span>New districts</span></div><div><strong>{preview.skippedRows.length}</strong><span>Skipped</span></div></div>{preview.skippedRows.length > 0 && <div className="admin-import-errors"><AlertTriangle size={17} /><div><strong>{preview.skippedRows.length} rows need correction</strong>{preview.skippedRows.slice(0, 8).map((issue: any) => <p key={`${issue.rowNumber}-${issue.problem}`}>Row {issue.rowNumber}: {issue.problem} — {issue.correction}</p>)}</div></div>}<div className="admin-import-preview-table"><table><thead><tr><th>Row</th><th>Alumnus</th><th>Identity</th><th>Batch</th><th>District</th><th>Action</th></tr></thead><tbody>{preview.validRows.slice(0, 10).map((row: any) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.fullName}</td><td>{row.studentId || row.email || "-"}</td><td>Batch {row.batchNumber}</td><td>{row.districtName || "-"}</td><td><em className={`status status--${row.action === "new" ? "published" : "draft"}`}>{row.action}</em></td></tr>)}</tbody></table></div><div className="admin-modal__actions"><button className="admin-action admin-action--muted" onClick={() => setPreview(null)}>Adjust mapping</button><button className="admin-action" disabled={!preview.validRows.length || commitMutation.isPending} onClick={() => commitMutation.mutate(mappedRows)}>{commitMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Import {preview.validRows.length} valid alumni</button></div></section>}
        </>}
      </>}
    </div>
  </div>;
}
