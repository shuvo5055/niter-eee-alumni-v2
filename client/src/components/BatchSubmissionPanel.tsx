import { ChangeEvent, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Step = "closed" | "verify" | "form" | "complete";
type FormValues = Record<string, string>;
const enabledBatches = new Set([11, 12, 13, 14, 15, 16]);
const emptyForm: FormValues = { fullName: "", email: "", studentId: "", phone: "", districtId: "", session: "", bloodGroup: "", school: "", college: "", bsc: "", msc: "", skill: "", researchActivities: "", currentOrganization: "", currentDesignation: "", currentDuration: "", previousOrganization: "", previousDesignation: "", previousDuration: "", whatsapp: "", facebook: "", linkedin: "", country: "Bangladesh", city: "", industry: "", photoUrl: "" };

export default function BatchSubmissionPanel({ batchNumber }: { batchNumber: number }) {
  const [step, setStep] = useState<Step>("closed");
  const [accessCode, setAccessCode] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [form, setForm] = useState<FormValues>({ ...emptyForm });
  const districts = trpc.publicData.districtDirectory.useQuery();
  const verify = trpc.batchSubmission.verifyAccessCode.useMutation({
    onSuccess: result => {
      if (!result.verified) { toast.error("Invalid access code. Please try again."); return; }
      setAccessToken(result.accessToken);
      setAccessCode("");
      setStep("form");
      toast.success("Access verified. You can now submit your information.");
    },
    onError: () => toast.error("Invalid access code. Please try again."),
  });
  const submit = trpc.batchSubmission.submit.useMutation({
    onSuccess: () => { setStep("complete"); setAccessToken(""); setForm({ ...emptyForm }); },
    onError: error => toast.error(error.message),
  });
  const upload = trpc.batchSubmission.uploadPhoto.useMutation({
    onSuccess: result => { setForm(current => ({ ...current, photoUrl: result.url })); toast.success("Photo uploaded securely."); },
    onError: error => toast.error(error.message || "Photo upload failed. Please try again."),
  });
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const onPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!accessToken) { toast.error("Verify the batch access code before uploading a photo."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5_000_000) { toast.error("Use a JPG, PNG, or WebP image smaller than 5 MB."); event.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => upload.mutate({ accessToken, fileName: file.name, mimeType: file.type, dataBase64: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const submitForm = () => submit.mutate({ ...form, accessToken, fullName: form.fullName.trim(), email: form.email.trim(), districtId: form.districtId ? Number(form.districtId) : null });

  if (!enabledBatches.has(batchNumber)) return <aside className="batch-submission batch-submission--notice"><p className="eyebrow">ALUMNI INFORMATION</p><p>Information uploads are currently available for Batches 11–16. Existing alumni can use their profile’s Claim / Update option.</p></aside>;
  if (step === "complete") return <aside className="batch-submission batch-submission--complete"><CheckCircle2 size={25}/><div><p className="eyebrow">SUBMISSION RECEIVED</p><h2>Your information is pending review.</h2><p>An administrator must approve it before it appears in the public alumni directory.</p></div><button className="alumni-claim-button" onClick={() => setStep("closed")}>Close</button></aside>;
  if (step === "form") return <section className="batch-submission batch-submission--form"><div className="batch-submission__head"><div><p className="eyebrow">VERIFIED ALUMNI SUBMISSION</p><h2>Upload Your Information</h2><p>Batch {batchNumber} is locked to this submission. Your information remains private until an administrator approves it.</p></div><span className="batch-submission__badge"><CheckCircle2 size={14}/> Access verified</span></div><div className="batch-submission__department">Department of Electrical and Electronic Engineering · NITER</div><div className="batch-submission__grid"><Field label="Full name" required value={form.fullName} onChange={value => set("fullName", value)}/><Field label="Email address" type="email" required value={form.email} onChange={value => set("email", value)}/><Field label="Student ID" value={form.studentId} onChange={value => set("studentId", value)}/><Field label="Phone" value={form.phone} onChange={value => set("phone", value)}/><Field label="Session" value={form.session} onChange={value => set("session", value)}/><label><span>District / location</span><select value={form.districtId} onChange={event => set("districtId", event.target.value)}><option value="">Select district</option>{districts.data?.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label><Field label="Current organization" value={form.currentOrganization} onChange={value => set("currentOrganization", value)}/><Field label="Designation" value={form.currentDesignation} onChange={value => set("currentDesignation", value)}/><Field label="LinkedIn URL" value={form.linkedin} onChange={value => set("linkedin", value)}/><Field label="Facebook URL" value={form.facebook} onChange={value => set("facebook", value)}/><label><span>Profile photo <small>JPG, PNG, or WebP · max 5 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto}/></label>{form.photoUrl && <p className="batch-submission__photo-status"><CheckCircle2 size={15}/> Profile photo ready for review.</p>}</div><div className="batch-submission__actions"><button className="alumni-claim-button alumni-claim-button--quiet" disabled={submit.isPending || upload.isPending} onClick={() => { setStep("closed"); setAccessToken(""); }}>Cancel</button><button className="alumni-claim-button" disabled={submit.isPending || upload.isPending || !form.fullName.trim() || !form.email.trim()} onClick={submitForm}>{submit.isPending ? <Loader2 className="spin" size={16}/> : <Send size={16}/>} {submit.isPending ? "Submitting…" : "Submit for review"}</button></div></section>;
  if (step === "verify") return <aside className="batch-submission batch-submission--verify"><div><p className="eyebrow">ALUMNI INFORMATION</p><h2>Upload Your Information</h2><p>Batch: <strong>{batchNumber}</strong></p></div><label><span>Enter Access Code</span><input autoComplete="off" type="password" value={accessCode} onChange={event => setAccessCode(event.target.value)} placeholder="Enter access code"/></label><div className="batch-submission__actions"><button className="alumni-claim-button alumni-claim-button--quiet" onClick={() => setStep("closed")}>Cancel</button><button className="alumni-claim-button" disabled={verify.isPending || !accessCode.trim()} onClick={() => verify.mutate({ batchNumber, accessCode })}>{verify.isPending ? <Loader2 className="spin" size={16}/> : <KeyRound size={16}/>} {verify.isPending ? "Verifying…" : "Unlock Form"}</button></div></aside>;
  return <aside className="batch-submission batch-submission--start"><div><p className="eyebrow">ALUMNI INFORMATION</p><h2>Part of Batch {batchNumber}?</h2><p>Verify your batch access code to submit your information for administrator review.</p></div><button className="alumni-claim-button" onClick={() => setStep("verify")}><Upload size={16}/> Upload Your Information</button></aside>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label><span>{label}{required ? " *" : ""}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} required={required}/></label>; }
