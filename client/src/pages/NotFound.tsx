/** Circuit Archive design system: restrained fallback keeps visitors in the alumni archive. */
import {Link} from "wouter";
export default function NotFound(){return <section className="not-found-page"><div><p className="eyebrow">404 / LOST SIGNAL</p><h1>That page is outside the alumni archive.</h1><p>Return to the directory or continue exploring the NITER EEE network.</p><Link href="/" className="button button--navy">Return home</Link></div></section>}
