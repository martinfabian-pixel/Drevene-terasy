import {useEffect,useId,useRef,useState} from 'react';
import {Link,Navigate,useParams,useSearchParams} from 'react-router-dom';
import {journeys,getStepData,guidePath,type GuideStep,type Journey} from './journeys';
import {boardRows} from './manual';
import {manualPath} from './library';
import Detail from './Detail';
import DiagramZoom from './DiagramZoom';
import SourceText from './SourceText';
import {RuleInspector} from './TechnicalCatalog';
import './academy-guide.css';

const entries=[
  {topic:'drevo',title:'Vybrať správne drevo',description:'Materiál, povrch a rozdiely medzi doskami.',kind:'grain' as const},
  {topic:'terasa',title:'Postaviť terasu',description:'Od zamerania po poslednú kontrolu spoja.',kind:'assembly' as const},
  {topic:'chyby',title:'Vyhnúť sa chybám',description:'Spoznajte riziko skôr, než sa detail zakryje.',kind:'head' as const},
  {topic:'kniznica',title:'Technické podklady pre profesionálov',description:'Úplné manuály, presné artikle, zdroje a PDF.',kind:'joint' as const}
];

export function GuideHome(){return <main className="au ag-home" data-testid="guide-home">
  <header className="ag-home-heading"><p className="au-eyebrow">DREVENÉ TERASY / ODBORNÝ SPRIEVODCA</p><h1>POD <span>POVRCHOM.</span></h1><p>Rozumieme drevu. Od prvého návrhu až po posledný detail montáže.</p></header>
  <section className="ag-entries" aria-label="Čo chcete vyriešiť?">{entries.map((entry,i)=><Link key={entry.topic} data-testid="guide-entry" className="ag-entry" to={entry.topic==='kniznica'?'/pod-povrchom/kniznica?level=pro':guidePath(entry.topic)}>
    <div className="ag-entry-visual" aria-hidden="true"><Detail kind={entry.kind} print/></div><div className="ag-entry-copy"><span>0{i+1}</span><h2>{entry.title}</h2><p>{entry.description}</p><b>{entry.topic==='kniznica'?'Otvoriť knižnicu':'Začať sprievodcu'} <span>↗</span></b></div>
  </Link>)}</section>
</main>}

function MaterialComparison(){
  const rows=[boardRows.find(r=>r.variant.articleNumber?.startsWith('55954/'))!,boardRows.find(r=>r.variant.articleNumber==='55973/7275')!];
  const [index,setIndex]=useState(0);const row=rows[index];const id=useId().replace(/:/g,'');
  return <div className="ag-material-comparison" data-testid="guide-comparison">
    <figure><svg className="technical-svg" viewBox="0 0 720 390" role="img" aria-label="Cumaru a Ipé — principiálne dosky, rozmery vybraných skladových variantov"><defs><pattern id={id+'grain'} width="80" height="18" patternUnits="userSpaceOnUse"><rect width="80" height="18" fill="#c1a27b"/><path d="M0 4Q30 12 80 5M0 12Q35 4 80 14" stroke="#8c704f" strokeWidth="1" fill="none"/></pattern></defs>{rows.map((r,i)=><g key={r.variant.id} opacity={i===index?1:.35}><path d={'M'+(45+i*350)+' 100l250 -35 15 175 -250 35z'} fill={'url(#'+id+'grain)'} stroke="#403b32" strokeWidth="1.5"/><path d={'M'+(60+i*350)+' 275l250 -35v15l-250 35z'} fill="#806749"/><text x={55+i*350} y="40">{i===0?'CUMARU':'IPÉ'}</text><text x={55+i*350} y="335">{r.variant.thicknessMm} × {r.variant.widthMm} mm</text></g>)}</svg><DiagramZoom/><figcaption>Principiálna ilustrácia; nie fotografia ani vzorka farby.</figcaption></figure>
    <div className="academy-segment" role="group" aria-label="Porovnať Cumaru a Ipé">{rows.map((r,i)=><button key={r.variant.id} aria-pressed={index===i} onClick={()=>setIndex(i)}>{i===0?'Cumaru':'Ipé'}</button>)}</div>
    <p className="ag-selected-material" aria-live="polite">{row.product.name} · {row.variant.articleNumber}<br/>{row.variant.thicknessMm} × {row.variant.widthMm} × {row.variant.lengthMm} mm</p>
    <details className="ag-comparison-rules"><summary>Údaje vybraného artikla</summary><RuleInspector row={row}/></details>
  </div>
}

function MovementVisual({interactive=true,wpc=false}:{interactive?:boolean;wpc?:boolean}){
  const [blocked,setBlocked]=useState(false);const id=useId().replace(/:/g,'');
  return <figure className="ag-movement" data-testid="guide-movement"><svg className="technical-svg" viewBox="0 0 720 360" role="img" aria-labelledby={id+'title '+id+'desc'}><title id={id+'title'}>Priestor pre pohyb materiálu</title><desc id={id+'desc'}>{blocked?'Pevná prekážka bráni pohybu dosky.':'Voľný okraj ponecháva priestor na pohyb.'} Principiálna schéma bez číselnej škáry.</desc><defs><marker id={id+'arrow'} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4 0 8" fill="none" stroke="#245d71"/></marker></defs><path d="M110 130h440l35 70H145Z" fill={wpc?'#a0a6a3':'#ba9970'} stroke="#343a35"/><path d="M145 200h440v25H145Z" fill={wpc?'#737b77':'#8b714f'}/>{[0,1,2,3].map(i=><path key={i} d={'M'+(180+i*85)+' 135l33 65'} stroke={wpc?'#737b77':'#8b714f'}/>) }<path d={'M'+(blocked?578:660)+' 80v190h28V80Z'} fill={blocked?'#914b37':'#b6bbb1'}/><path d="M215 98H545" stroke="#245d71" strokeWidth="3" markerEnd={'url(#'+id+'arrow)'}/>{blocked&&<path d="M558 161l22 26m0-26-22 26" stroke="#914b37" strokeWidth="5"/>}<text x="105" y="45">{blocked?'POHYB BLOKUJE PREKÁŽKA':'MATERIÁL MÁ PRIESTOR NA POHYB'}</text><text x="110" y="304">Škáru určuje konkrétny výrobok a podmienky montáže.</text></svg>{interactive&&<div className="academy-segment" role="group" aria-label="Priestor pre pohyb"><button aria-pressed={!blocked} onClick={()=>setBlocked(false)}>Voľný priestor</button><button aria-pressed={blocked} onClick={()=>setBlocked(true)}>Blokovaný okraj</button></div>}<DiagramZoom/><figcaption>Principiálna ilustrácia bez návrhu dilatácie.</figcaption></figure>
}

function GuideVisual({step,topic}:{step:GuideStep;topic:Journey}){
  return <div className={'ag-visual'+(topic.id==='wpc'?' ag-wpc':'')} data-testid="guide-visual">
    {step.diagram==='comparison'?<MaterialComparison/>:step.diagram==='movement'?<MovementVisual interactive={step.interaction==='compare'} wpc={topic.id==='wpc'}/>:<Detail kind={step.diagram} guide={step.interaction}/>}
    {['joint','end'].includes(step.diagram)&&<p className="ag-scope">Kótovaný príklad: Lunawood 55987/0230, viditeľné kotvenie. Nepreberajte rozmery pre iný systém.</p>}
    {topic.id==='wpc'&&step.diagram!=='movement'&&<p className="ag-scope">Principiálna skladba. Nezobrazuje schválený montážny systém Gardin.</p>}
  </div>
}

export function Guide(){
  const {topic:topicId}=useParams();const [params,setParams]=useSearchParams();
  const topic=journeys.find(t=>t.id===topicId);const focus=useRef<HTMLElement>(null);const contents=useRef<HTMLDetailsElement>(null);
  const index=topic?Math.max(0,topic.steps.findIndex(s=>s.id===params.get('step'))):0;
  const item=topic?.steps[index];
  useEffect(()=>{
    if(!topic||!item)return;
    if(contents.current)contents.current.open=false;
    const frame=requestAnimationFrame(()=>{focus.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});document.title=item.title+' | Pod povrchom | Drevené terasy'});
    return()=>cancelAnimationFrame(frame);
  },[topic?.id,item?.id]);
  if(!topic||!item)return <Navigate to="/pod-povrchom" replace/>;
  const data=getStepData(topic.id,item.id);
  const go=(i:number)=>setParams(p=>{p.set('step',topic.steps[i].id);return p});
  return <main className="au ag-guide" data-testid="guide-screen" data-topic={topic.id}>
    <header className="ag-context"><div><Link to="/pod-povrchom">← POD POVRCHOM</Link><span data-testid="guide-topic">{topic.title}</span></div><details ref={contents} className="ag-contents"><summary>Obsah <span>+</span></summary><nav aria-label="Kroky sprievodcu">{topic.steps.map((s,i)=><Link key={s.id} to={guidePath(topic.id,s.id)} aria-current={s.id===item.id?'step':undefined}><span>{String(i+1).padStart(2,'0')}</span>{s.title}</Link>)}{topic.id==='terasa'&&<Link to={guidePath('podkonstrukcia','celne-spoje')}>Čelné spoje — dve podpory ↗</Link>}<Link to="/pod-povrchom/kniznica">Úplná technická knižnica ↗</Link></nav></details></header>
    <div className="ag-progress" data-testid="guide-progress" data-current={index+1} data-total={topic.steps.length} role="progressbar" aria-label="Postup sprievodcom" aria-valuemin={1} aria-valuemax={topic.steps.length} aria-valuenow={index+1}><span style={{width:((index+1)/topic.steps.length*100)+'%'}}/></div>
    <article ref={focus} tabIndex={-1} className="ag-step" data-testid="guide-step" data-step={item.id} key={topic.id+'/'+item.id}>
      <div className="ag-step-title"><p className="au-eyebrow">KROK {String(index+1).padStart(2,'0')} / {String(topic.steps.length).padStart(2,'0')}</p><h1>{data.title}</h1></div>
      <GuideVisual step={item} topic={topic}/>
      <div className="ag-explanation"><p className="ag-summary">{data.summary}</p>{data.notices.length>0&&<aside className="ag-notice" aria-label="Dôležité obmedzenie">{data.notices.map((n,i)=><p key={i}>{n}</p>)}</aside>}
        <details className="ag-technical" data-testid="guide-technical"><summary>Zobraziť technický detail <span>+</span></summary><div><p className="ag-detail-context">Úplné vysvetlenie zo spoločnej dokumentácie. Konkrétne neoverené údaje zostávajú na odborné potvrdenie.</p>{data.details.map((p,i)=><p key={i}>{p}</p>)}<h2>Zdroje a rozsah použitia</h2>{data.evidence.map((s,i)=><p key={i}><SourceText text={s}/></p>)}<div className="ag-document-links"><Link to={manualPath(data.manualId)}>Celý manuál {data.manualId} ↗</Link><a download href={import.meta.env.BASE_URL+'manuals/pod-povrchom-'+data.manualId+'.pdf'}>Stiahnuť PDF ↓</a><Link to="/pod-povrchom/technicky-katalog">Presné pravidlá podľa artikla ↗</Link><Link to="/planovac">Otvoriť plánovač terasy ↗</Link><a href={import.meta.env.BASE_URL+'academy-guides/'+topic.id+'/'+item.id+'/index.html'}>Čitateľná verzia bez interakcií ↗</a></div></div></details>
        {item.nextTopics&&<div className="ag-next-topic"><p>Pokračujte témou, ktorú potrebujete vyriešiť.</p>{item.nextTopics.slice(0,1).map(id=>{const next=journeys.find(j=>j.id===id)!;return <Link key={id} to={guidePath(id)}>{next.title}<span>→</span></Link>})}</div>}
      </div>
    </article>
    <nav className="ag-step-nav" aria-label="Postup sprievodcom"><button data-testid="guide-back" disabled={index===0} onClick={()=>go(index-1)}>← Späť</button><span aria-hidden="true">{String(index+1).padStart(2,'0')} / {String(topic.steps.length).padStart(2,'0')}</span><button data-testid="guide-next" disabled={index===topic.steps.length-1} onClick={()=>go(index+1)}>{index===topic.steps.length-1?'Dokončené ✓':'Pokračovať →'}</button></nav>
  </main>
}
