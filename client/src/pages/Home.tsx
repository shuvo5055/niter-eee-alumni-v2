/** Circuit Archive design system: an asymmetric academic hero joins editorial confidence with direct alumni discovery. */
import {useMemo,useState} from "react";
import {Link,useLocation} from "wouter";
import {ArrowRight,Search,Users,MapPinned,BriefcaseBusiness,Layers3,GraduationCap,Network} from "lucide-react";
import AlumniCard from "@/components/AlumniCard";
import {alumni} from "@/data/alumni";

const stats=[{value:"500+",label:"Total Alumni",icon:Users},{value:"9",label:"Active Batches",icon:Layers3},{value:"64",label:"Districts Covered",icon:MapPinned},{value:"200+",label:"Organizations",icon:BriefcaseBusiness}];

export default function Home(){
  const[,setLocation]=useLocation();
  const[query,setQuery]=useState("");
  const results=useMemo(()=>alumni.filter(person=>`${person.name} ${person.batch} ${person.district} ${person.position} ${person.organization}`.toLowerCase().includes(query.toLowerCase())).slice(0,3),[query]);
  const submit=(event:React.FormEvent)=>{event.preventDefault();setLocation(query.trim()?`/alumni?q=${encodeURIComponent(query.trim())}`:"/alumni")};
  return <>
    <section className="hero">
      <div className="hero__image" aria-hidden="true"/>
      <div className="hero__grid" aria-hidden="true"/>
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--light"><Network size={15}/> NITER EEE / ALUMNI NETWORK</p>
          <p className="hero__lede">A platform for connecting NITER EEE alumni, exploring professional paths, and preserving the memories that built our department.</p>
          <div className="hero__buttons">
            <Link href="/alumni" className="button button--signal" style={{backgroundColor:"#21b6d7",color:"#000000"}}>Explore alumni<ArrowRight size={18}/></Link>
            <Link href="/batches" className="button button--ghost">Find your batch<ArrowRight size={18}/></Link>
          </div>
        </div>
        <div className="hero__stat-mark"><span>EEE</span><small>EST. 2026<br/>ALUMNI ARCHIVE</small></div>
      </div>
    </section>
    <section className="stats-section"><div className="container stats-grid">{stats.map(({value,label,icon:Icon},index)=><div className="stat-card" key={label}><span className="stat-card__index">0{index+1}</span><Icon size={21}/><strong>{value}</strong><p>{label}</p></div>)}</div></section>
    <section className="find-section"><div className="container find-layout">
      <div className="find-copy"><p className="eyebrow">THE DIRECTORY</p><p>Search the NITER EEE community by name, batch, district, field, or organization. Every profile is a point of connection.</p><div className="find-copy__detail"><GraduationCap size={23}/><span>Designed as a living directory that can grow with every graduate.</span></div></div>
      <div className="find-panel"><p className="find-panel__label">SEARCH THE NETWORK</p><form onSubmit={submit}><div className="find-search"><Search size={21}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search by name, batch, district, job or organization..."/><button aria-label="Submit alumni search"><ArrowRight size={21}/></button></div></form><div className="quick-search"><span>Try:</span>{["Batch 12","Dhaka","Power & Energy","NITER"].map(item=><button key={item} onClick={()=>setQuery(item)}>{item}</button>)}</div>{query&&<div className="quick-results"><p>{results.length?"Matching alumni in the directory":"No exact match — explore all alumni"}</p>{results.map(person=><Link href={`/alumni/${person.slug}`} key={person.id}>{person.name}<span>Batch {person.batch}</span></Link>)}</div>}</div>
    </div></section>
    <section className="featured-section"><div className="container"><div className="section-head"><Link href="/alumni" className="text-link text-link--large" aria-label="Open full directory"><ArrowRight size={17}/></Link></div><div className="alumni-grid alumni-grid--home">{alumni.filter(person=>person.featured).map(person=><AlumniCard person={person} key={person.id}/>)}</div></div></section>
    <section className="network-banner"><div className="container network-banner__inner"><Link href="/about" className="button button--ivory" aria-label="How the network works"><ArrowRight size={18}/></Link></div></section>
  </>
}
