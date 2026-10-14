import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type SecurityProps = { params?: { token?: string } };

function SecurityShell({ children }: { children: React.ReactNode }) {
  return <main className="account-security"><div className="account-security__card"><div className="account-security__mark"><ShieldCheck size={22}/></div>{children}</div></main>;
}

export function ClaimAccount({ params }: SecurityProps) {
  const token = params?.token;
  const request = trpc.alumniClaim.requestClaim.useMutation({ onSuccess: () => toast.success("If the account is eligible, a secure claim link has been sent.") });
  const complete = trpc.alumniClaim.completeClaim.useMutation({ onSuccess: () => setComplete(true), onError: error => toast.error(error.message) });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [completeState, setComplete] = useState(false);
  if (completeState) return <SecurityShell><p className="eyebrow">CLAIM COMPLETE</p><h1>Your profile is secured.</h1><p className="account-security__copy">You can now sign in from any alumni profile using the password you created.</p><Link href="/alumni" className="account-security__link">Return to alumni directory <ArrowRight size={16}/></Link></SecurityShell>;
  if (token) return <SecurityShell><p className="eyebrow">ACCOUNT CLAIM</p><h1>Create your password.</h1><p className="account-security__copy">Choose a password of at least 8 characters. This secure link can only be used once.</p><label><span>New password</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password"/></label><label><span>Confirm password</span><input type="password" value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="new-password"/></label><button className="alumni-claim-button" disabled={complete.isPending || password.length < 8 || password !== confirm} onClick={() => complete.mutate({ token, password })}><KeyRound size={16}/> {complete.isPending ? "Saving…" : "Create password"}</button></SecurityShell>;
  return <SecurityShell><p className="eyebrow">ACCOUNT CLAIM</p><h1>Claim your alumni profile.</h1><p className="account-security__copy">Enter the email registered with your alumni record. If eligible, we’ll send a single-use claim link without revealing account status.</p><label><span>Registered email</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="alumni@example.com"/></label><button className="alumni-claim-button" disabled={request.isPending || !email.trim()} onClick={() => request.mutate({ email })}><Mail size={16}/> {request.isPending ? "Sending…" : "Send secure claim link"}</button><Link href="/forgot-password" className="account-security__link">Forgot your password? <ArrowRight size={16}/></Link></SecurityShell>;
}

export function PasswordRecovery({ params }: SecurityProps) {
  const token = params?.token;
  const request = trpc.alumniClaim.requestPasswordReset.useMutation({ onSuccess: () => toast.success("If the account exists, a reset link has been sent.") });
  const complete = trpc.alumniClaim.completePasswordReset.useMutation({ onSuccess: () => setComplete(true), onError: error => toast.error(error.message) });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [completeState, setComplete] = useState(false);
  if (completeState) return <SecurityShell><p className="eyebrow">PASSWORD RESET COMPLETE</p><h1>Your password was updated.</h1><p className="account-security__copy">Return to an alumni profile to sign in with your new password.</p><Link href="/alumni" className="account-security__link">Return to alumni directory <ArrowRight size={16}/></Link></SecurityShell>;
  if (token) return <SecurityShell><p className="eyebrow">PASSWORD RECOVERY</p><h1>Set a new password.</h1><p className="account-security__copy">Choose a password of at least 8 characters. This reset link expires after one hour and can only be used once.</p><label><span>New password</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password"/></label><label><span>Confirm password</span><input type="password" value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="new-password"/></label><button className="alumni-claim-button" disabled={complete.isPending || password.length < 8 || password !== confirm} onClick={() => complete.mutate({ token, password })}><KeyRound size={16}/> {complete.isPending ? "Saving…" : "Reset password"}</button></SecurityShell>;
  return <SecurityShell><p className="eyebrow">PASSWORD RECOVERY</p><h1>Reset your password.</h1><p className="account-security__copy">Enter your registered email. If the account exists, we’ll send a single-use reset link without revealing account status.</p><label><span>Registered email</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="alumni@example.com"/></label><button className="alumni-claim-button" disabled={request.isPending || !email.trim()} onClick={() => request.mutate({ email })}><Mail size={16}/> {request.isPending ? "Sending…" : "Send reset link"}</button><Link href="/claim-account" className="account-security__link">Need to claim your profile? <ArrowRight size={16}/></Link></SecurityShell>;
}
