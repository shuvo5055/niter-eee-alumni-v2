import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setError("The email or password you entered is invalid.");
    }, 360);
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
          <input id="admin-email" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="admin@niter.edu.bd" autoComplete="email" aria-invalid={Boolean(error)} />
          <Mail aria-hidden="true" size={18} />
        </div>

        <label htmlFor="admin-password">Password</label>
        <div className="alumni-admin-login__field">
          <input id="admin-password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" aria-invalid={Boolean(error)} />
          <LockKeyhole aria-hidden="true" size={17} className="alumni-admin-login__lock" />
          <button type="button" className="alumni-admin-login__visibility" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>

        <div className="alumni-admin-login__options">
          <label className="alumni-admin-login__remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Remember Me</span></label>
          <a className="alumni-admin-login__forgot" href="#login-help">Forgot Password?</a>
        </div>

        <button className="alumni-admin-login__submit" type="submit" disabled={submitting}>{submitting ? "Checking…" : <>Login <ArrowRight size={18} /></>}</button>
      </form>

      {error && <p className="alumni-admin-login__error" aria-live="polite">{error}</p>}
      <footer id="login-help">Authorized NITER EEE Alumni administrators only.</footer>
    </section>
  </main>;
}
