/**
 * Thesis Library institutional header: an unchanged official NITER logo anchors the left institute lockup; the Alumni Association title anchors the right.
 */
import {useEffect,useState} from "react";
import {Link,useLocation} from "wouter";
import {Menu,Search,X,ArrowUpRight,MapPin,Mail,Linkedin,Facebook} from "lucide-react";
import {Input} from "@/components/ui/input";

const officialLogo="/manus-storage/niter-official-logo_b5db41d0.jpg";
const navLinks=[["Home","/"],["Alumni","/alumni"],["Batch","/batches"],["District","/districts"],["Job","/jobs"],["About","/about"],["Contact","/contact"]];

export function Header(){
  const[location,setLocation]=useLocation(); const[open,setOpen]=useState(false); const[searchOpen,setSearchOpen]=useState(false); const[query,setQuery]=useState(""); const[scrolled,setScrolled]=useState(false);
  useEffect(()=>{const handle=()=>setScrolled(window.scrollY>14);handle();window.addEventListener("scroll",handle);return()=>window.removeEventListener("scroll",handle)},[]);
  const submit=(event:React.FormEvent)=>{event.preventDefault();const term=query.trim();setSearchOpen(false);setOpen(false);setLocation(term?`/alumni?q=${encodeURIComponent(term)}`:"/alumni")};
  return <header className={`site-header thesis-header ${scrolled?"site-header--scrolled":""}`}>
    <div className="thesis-header__diagonal" aria-hidden="true"/>
    <div className="container thesis-header__mast">
      <Link href="/" className="thesis-institute-lockup" aria-label="NITER EEE Alumni home">
        <img className="official-niter-logo thesis-institute-lockup__logo" src={officialLogo} alt="Official NITER logo"/>
        <span className="thesis-institute-lockup__name"><strong>NATIONAL INSTITUTE OF</strong><strong>TEXTILE ENGINEERING &amp;</strong><strong>RESEARCH</strong></span>
      </Link>
      <div className="thesis-header__right">
        <div className="thesis-alumni-lockup"><strong>NITER Alumni Association</strong><span>Department of EEE</span></div>
        <div className="thesis-header__utility"><button className="thesis-icon-button" onClick={()=>setSearchOpen(value=>!value)} aria-label="Search alumni"><Search size={19}/></button></div>
      </div>
    </div>
    <div className="thesis-header__navrow"><div className="container thesis-header__navwrap"><div className="thesis-header__navcontrols"><button className="thesis-menu-button thesis-menu-bar__button" onClick={()=>setOpen(value=>!value)} aria-label="Toggle navigation menu">{open?<X size={22}/>:<Menu size={22}/>}<span>Menu</span></button><nav className="desktop-nav thesis-nav" aria-label="Primary navigation">{navLinks.map(([label,href])=><Link key={href} href={href} className={location===href||(href!=="/"&&location.startsWith(href))?"is-active":""}>{label}</Link>)}</nav></div></div></div>
    {searchOpen&&<form className="header-search thesis-header__search" onSubmit={submit}><Search size={17}/><Input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search alumni, batch, district or organization"/><button>Search <ArrowUpRight size={15}/></button></form>}
    {open&&<nav className="mobile-nav thesis-mobile-nav" aria-label="Mobile navigation">{navLinks.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}<ArrowUpRight size={16}/></Link>)}</nav>}
  </header>
}

export function Footer(){return <footer className="site-footer official-footer">
  <div className="official-footer__texture" aria-hidden="true"><i/><i/><i/><i/></div>
  <div className="container official-footer__grid">
    <section className="official-footer__brand">
      <div className="official-footer__identity"><img className="official-niter-logo official-footer__logo" src={officialLogo} alt="Official NITER logo"/><div><strong>NITER EEE Alumni</strong><span>Department of Electrical and<br/>Electronic Engineering</span></div></div>
      <p>Connecting NITER EEE alumni, building professional networks, and strengthening our alumni community.</p>
      <div className="footer-social official-footer__social"><a href="#contact" aria-label="Email NITER EEE Alumni"><Mail size={17}/></a><a href="#contact" aria-label="LinkedIn"><Linkedin size={17}/></a><a href="#contact" aria-label="Facebook"><Facebook size={17}/></a></div>
    </section>
    <section className="official-footer__links"><p className="footer-label">QUICK LINKS</p><div>{navLinks.slice(0,4).map(([label,href])=><Link href={href} key={href}>{label}</Link>)}</div></section>
    <section className="official-footer__links"><p className="footer-label">ALUMNI NETWORK</p><div>{navLinks.slice(4).map(([label,href])=><Link href={href} key={href}>{label}</Link>)}<Link href="/gallery">Gallery</Link></div></section>
    <section className="official-footer__contact"><p className="footer-label">NITER EEE</p><p><MapPin size={16}/>Nayarhat, Savar<br/>Dhaka 1350, Bangladesh</p><a href="mailto:eee@niter.edu.bd">eee@niter.edu.bd</a><a href="tel:+880000000000">+880 0000 000000</a></section>
  </div>
  <div className="container official-footer__bottom"><span>© 2026 NITER EEE Alumni. All Rights Reserved.</span><span>NITER · Electrical and Electronic Engineering</span></div>
</footer>}

function resolveHeroVariant(eyebrow:string){if(eyebrow.includes("COHORT"))return "cohort";if(eyebrow.includes("GEOGRAPHIC")||eyebrow.includes("DISTRICT"))return "geography";if(eyebrow.includes("MEMORY"))return "memory";if(eyebrow.includes("CAREER"))return "career";if(eyebrow.includes("ALUMNI"))return "signal";if(eyebrow.includes("COMMUNITY"))return "archive";return "archive"}
export function PageHero({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:React.ReactNode}){const variant=resolveHeroVariant(eyebrow);return <section className={`page-hero page-hero--${variant}`}><div className="page-hero__circuit" aria-hidden="true"><span/><span/><span/><i/><i/><i/></div><div className="container"><p className="eyebrow eyebrow--light">{eyebrow}</p><div className="page-hero__content"><h1>{title}</h1><p>{description}</p>{action}</div></div></section>}
export default function SiteShell({children}:{children:React.ReactNode}){return <><Header/><main id="top">{children}</main><Footer/></>}
