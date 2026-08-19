import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setNotice("Sign-in is ready for the authentication backend. No credentials have been submitted yet.");
    }, 520);
  };

  return <main className="alumni-admin-login" aria-labelledby="admin-login-heading">
    <section className="alumni-admin-login__card">
      <header className="alumni-admin-login__brand">
        <img src="/manus-storage/niter-official-logo_b5db41d0.jpg" alt="National Institute of Textile Engineering and Research logo" />
        <div><p>NITER EEE ALUMNI ASSOCIATION</p><span>Alumni Association Administration</span></div>
      </header>

      <div className="alumni-admin-login__divider" />

      <div className="alumni-admin-login__intro">
        <span className="alumni-admin-login__shield"><ShieldCheck size={19} /></span>
        <div><h1 id="admin-login-heading">Admin Login</h1><p>Sign in to manage the NITER EEE Alumni Association.</p></div>
      </div>

      <form className="alumni-admin-login__form" onSubmit={submit}>
        <label htmlFor="admin-email">Email</label>
        <div className="alumni-admin-login__field">
          <input id="admin-email" name="email" type="email" placeholder="admin@niter.edu.bd" autoComplete="email" required />
          <Mail aria-hidden="true" size={18} />
        </div>

        <label htmlFor="admin-password">Password</label>
        <div className="alumni-admin-login__field">
          <input id="admin-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" required />
          <LockKeyhole aria-hidden="true" size={17} className="alumni-admin-login__lock" />
          <button type="button" className="alumni-admin-login__visibility" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>

        <div className="alumni-admin-login__options">
          <label className="alumni-admin-login__remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Remember Me</span></label>
          <button type="button" className="alumni-admin-login__forgot" onClick={() => setNotice("Password recovery will be enabled when the authentication backend is connected.")}>Forgot Password?</button>
        </div>

        <button className="alumni-admin-login__submit" type="submit" disabled={submitting}>{submitting ? "Opening dashboard…" : <>Login <ArrowRight size={18} /></>}</button>
      </form>

      <p className="alumni-admin-login__notice" aria-live="polite">{notice}</p>
      <footer>Authorized NITER EEE Alumni administrators only.</footer>
    </section>
  </main>;
}
