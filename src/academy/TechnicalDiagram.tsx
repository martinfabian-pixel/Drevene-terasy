import { useId, useState } from 'react';
import { lunaExample } from './manual';

const layers = ['Dosky','Dištančné prvky','Podkonštrukcia','Podpery','Podklad','Spojovací materiál'];
export default function TechnicalDiagram({kind='assembly',staticView=false}:{kind?:'assembly'|'joint'|'orientation';staticView?:boolean}) {
 const [risk,setRisk]=useState(false),[hidden,setHidden]=useState<string[]>([]);
 const [zoom,setZoom]=useState(false);
 const id=useId().replace(/:/g,''); const show=(n:number)=>!hidden.includes(layers[n]);
 const p=lunaExample?.rules;
 const value=(key:'jointGap'|'doubleJoistClearance'|'endFixingOffset'|'sideFixingOffset')=>p?.[key].status==='verified'?p[key].value:null;
 const title=kind==='joint'?'Čelný spoj — pozdĺžny rez':kind==='orientation'?'Orientácia prierezu — modelový príklad':'Vrstvy terasy — principiálny rez';
 return <figure className="academy-diagram" data-testid={staticView?undefined:'diagram-'+kind}>
  <figcaption><strong>{title}</strong><span>{kind==='joint'?'Rozmery len pre priradený systém Lunawood; nie statický návrh.':'Principiálna schéma; nie realizačný detail.'}</span></figcaption>
  {!staticView&&<><div className="academy-segment" role="group" aria-label={'Riešenie: '+title}><button aria-pressed={!risk} onClick={()=>setRisk(false)}>Odporúčaný princíp</button><button aria-pressed={risk} onClick={()=>setRisk(true)}>Rizikový detail</button></div>{kind!=='orientation'&&<fieldset className="academy-layers"><legend>Zobrazené vrstvy</legend>{layers.map(label=><label key={label}><input type="checkbox" checked={!hidden.includes(label)} onChange={()=>setHidden(v=>v.includes(label)?v.filter(x=>x!==label):[...v,label])}/>{label}</label>)}</fieldset>}</>}
  {!staticView&&<button className="academy-zoom" aria-pressed={zoom} onClick={()=>setZoom(!zoom)}>{zoom?'Zmenšiť detail':'Zväčšiť detail'}</button>}
  <div className={'academy-drawing'+(zoom?' is-zoomed':'')}>
  <svg viewBox="0 0 720 400" role="img" aria-labelledby={id+'title '+id+'desc'}>
   <title id={id+'title'}>{title}</title><desc id={id+'desc'}>{risk?'Riziko zadržiavania vody a nevhodného kontaktu.':'Oddelené kontakty, samostatné podopretie a voľná cesta vody.'} {kind==='orientation'?'Porovnanie hornej šírky 40 a 70 mm. Rozmery sú ilustračné.':''}</desc>
   <defs><pattern id={id+'wood'} width="16" height="12" patternUnits="userSpaceOnUse"><rect width="16" height="12" fill="#c5a578"/><path d="M0 4h16M4 8h9" stroke="#a88557" strokeWidth=".6"/></pattern><marker id={id+'arrow'} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse"><path d="M0 0 8 4 0 8" fill="none" stroke="#226779"/></marker></defs>
   {kind==='orientation'?<>
    <text x="80" y="40">NASTOJATO</text><text x="430" y="40">NALEŽATO</text>
    <rect x="130" y="130" width="100" height="175" fill={'url(#'+id+'wood)'} stroke="#242424"/><rect x="410" y="205" width="175" height="100" fill={'url(#'+id+'wood)'} stroke="#242424"/>
    <path d="M130 100h100m-100-8v16m100-16v16M410 175h175m-175-8v16m175-16v16" stroke="#242424"/><text x="155" y="86">40 mm</text><text x="467" y="161">70 mm</text>
    <path d="M130 129h100M410 204h175" stroke={risk?'#b34625':'#668400'} strokeWidth="9"/>
    <text x="65" y="347">Výška 70 mm</text><text x="420" y="347">Výška 40 mm</text><text x="65" y="378">Rovnaký prierez ≠ rovnaké statické správanie.</text>
    {risk&&<path d="M427 197q70-36 140 0" stroke="#226779" strokeWidth="7" fill="none"/>}
   </>:<>
    {show(4)&&<g data-layer="Podklad"><path d="M55 320 660 330v40H55Z" fill="#b7b9b3" stroke="#333"/><text x="70" y="354">PODKLAD / SPÁD PODĽA PROJEKTU</text></g>}
    {show(3)&&<g data-layer="Podpery" fill="#545952" stroke="#242424">{[205,465].map(x=><g key={x}><rect x={x} y="248" width="30" height="70"/><rect x={x-20} y="310" width="70" height="10"/></g>)}</g>}
    {show(2)&&<g data-layer="Podkonštrukcia" fill="#444b42" stroke="#101010">{risk?<rect x="190" y="177" width="330" height="70"/>:<><rect x="175" y="177" width="115" height="70"/><rect x="430" y="177" width="115" height="70"/></>}</g>}
    {show(1)&&<g data-layer="Dištančné prvky" fill="#a3c837"><rect x="190" y="159" width="90" height="12"/><rect x="440" y="159" width="90" height="12"/></g>}
    {show(0)&&<g data-layer="Dosky" fill={'url(#'+id+'wood)'} stroke="#242424"><rect x="55" y="120" width="296" height="30"/><rect x="369" y="120" width="296" height="30"/></g>}
    {show(5)&&<g data-layer="Spojovací materiál" stroke="#101010" strokeWidth="4">{(risk?[337,383]:[240,480]).map(x=><path key={x} d={'M'+(x-8)+' 124h16m-8 0v80m-5-18 10-5m-10-8 10-5'}/>)}</g>}
    <path d={risk?'M360 70v35m0 51q-45 30-85 7':'M360 70v225'} stroke="#226779" strokeWidth="3" fill="none" markerEnd={'url(#'+id+'arrow)'}/>
    {!risk&&kind==='assembly'&&<path d="M335 307 625 314" stroke="#226779" strokeWidth="3" markerEnd={'url(#'+id+'arrow)'}/>}
    <text x="395" y="77">{risk?'VODA OSTÁVA V KONTAKTE':'VOĽNÁ CESTA VODY'}</text>
    {kind==='joint'&&!risk&&<g fill="#101010"><path d="M290 269h140m-140-8v16m140-16v16M240 97h111m-111-6v12m111-12v12" stroke="#101010"/><text x="296" y="292">min. {value('doubleJoistClearance')??'?'} mm</text><text x="250" y="89">min. {value('endFixingOffset')??'?'} mm</text><text x="55" y="35">Čelná škára: {value('jointGap')??'?'} mm · bočný odstup skrutky: min. {value('sideFixingOffset')??'?'} mm</text></g>}
   </>}
  </svg></div>
  <p className={risk?'academy-warning':'academy-caption'} aria-live="polite">{risk?(kind==='orientation'?'Široký mokrý kontakt bez oddelenia je rizikový. Poloha naležato môže byť prípustná po overení konkrétnej skladby.':'Riziko: spoločná mokrá plocha a skrutky blízko čela. Červené/rizikové zobrazenie je princíp chyby, nie univerzálny zákaz každého overeného systému.'):(kind==='joint'?'Lunawood 2023, s. 23 a 28. Čistá medzera medzi nosníkmi; odstup skrutky od čela. Schéma nie je v mierke a nepreukazuje únosnosť.':kind==='orientation'?'JAF 2026, PDF s. 27. Modelový prierez 40 × 70 mm; skutočný profil a orientáciu lepených prvkov treba overiť.':'Oddelenie styčných plôch a odtok vody. Počet, rozmery a únosnosť podpier určuje projekt. JAF 2026, PDF s. 27; Lunawood 2023, s. 19.')}</p>
 </figure>;
}
