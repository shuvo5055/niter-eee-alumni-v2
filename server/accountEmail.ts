const htmlEscape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);

function appUrl() {
  return (process.env.PUBLIC_APP_URL || process.env.VITE_PUBLIC_APP_URL || "https://nitalumni-bpznsmzc.manus.space").replace(/\/$/, "");
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL || process.env.MAIL_FROM || "NITER EEE Alumni <onboarding@resend.dev>";
}

async function sendEmail(input: { to: string; subject: string; text: string; html: string; idempotencyKey: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Transactional email is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from: fromAddress(), to: [input.to], subject: input.subject, text: input.text, html: input.html }),
  });
  if (!response.ok) throw new Error(`Transactional email failed with status ${response.status}.`);
}

const emailShell = (eyebrow: string, title: string, body: string, buttonLabel: string, link: string) => `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"></head><body style="margin:0;background:#eef4f4;font-family:Arial,sans-serif;color:#18384d"><main style="max-width:560px;margin:30px auto;padding:28px;background:#fffdf8;border:1px solid #d5e1df"><p style="font-size:11px;letter-spacing:.12em;font-weight:800;color:#168d55">${eyebrow}</p><h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.15;margin:8px 0 16px;color:#123d58">${title}</h1><p style="font-size:15px;line-height:1.7;color:#58727b">${body}</p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#168d55;color:#fff;text-decoration:none;padding:13px 18px;font-weight:800">${buttonLabel}</a></p><p style="font-size:12px;line-height:1.6;color:#71858c">This link is single-use and expires automatically. If you did not request this, you can safely ignore this email.</p></main></body></html>`;

export async function sendClaimEmail(to: string, token: string, alumniName: string) {
  const link = `${appUrl()}/claim/${encodeURIComponent(token)}`;
  const safeName = htmlEscape(alumniName);
  await sendEmail({
    to,
    subject: "Claim your NITER EEE Alumni profile",
    text: `Hello ${alumniName},\n\nUse this one-time link to claim your NITER EEE Alumni profile and create your password:\n${link}\n\nThe link expires in 24 hours.`,
    html: emailShell("NITER EEE ALUMNI", "Claim your alumni profile.", `Hello ${safeName}, use this secure one-time link to claim your existing alumni record and create a password of your own.`, "Claim profile", link),
    idempotencyKey: `claim-${hashForIdempotency(to, token)}`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string, alumniName: string) {
  const link = `${appUrl()}/reset-password/${encodeURIComponent(token)}`;
  const safeName = htmlEscape(alumniName);
  await sendEmail({
    to,
    subject: "Reset your NITER EEE Alumni password",
    text: `Hello ${alumniName},\n\nUse this one-time link to reset your NITER EEE Alumni password:\n${link}\n\nThe link expires in 1 hour.`,
    html: emailShell("NITER EEE ALUMNI", "Reset your password.", `Hello ${safeName}, use this secure one-time link to set a new password for your alumni account.`, "Reset password", link),
    idempotencyKey: `reset-${hashForIdempotency(to, token)}`,
  });
}

function hashForIdempotency(to: string, token: string) {
  return `${to.toLowerCase().trim()}-${token.slice(0, 16)}`;
}
