import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Header2027 } from './Homepage2027';
import { useCart } from './commerce/cart';
import { articles } from './commerce/articles';
import './platform-shell.css';

export default function PlatformShell() {
  const location = useLocation();
  const { catalog } = useCart();
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const pages: Record<string, string> = { 'terasove-dosky': 'Terasové dosky', prislusenstvo: 'Príslušenstvo', planovac: 'Plánovač terás', realizacie: 'Realizácie', 'realizacia-na-kluc': 'Realizácia na kľúč', poradna: 'Poradňa', 'o-nas': 'O nás', kontakt: 'Kontakt', kosik: 'Košík', pokladna: 'Cenová ponuka', admin: 'Lokálna administrácia' };
    const section = location.pathname.split('/')[1];
    const product = section === 'produkt' ? catalog.find(p => p.id === location.pathname.split('/')[2]) : null;
    const article = section === 'poradna' ? articles.find(a => a.id === location.pathname.split('/')[2]) : null;
    document.title = product ? product.name + ' | Drevené terasy' : article ? article.title + ' | Drevené terasy' : pages[section] ? pages[section] + ' | Drevené terasy' : 'Drevené terasy | Priestor. Tvoj.';
    const description = document.querySelector<HTMLMetaElement>('meta[name=description]');
    if (description) description.content = article?.lead || product?.description || (section === 'planovac' ? 'Navrhni pôdorys terasy v 2D a 3D. Produktové varianty, orientačné množstvá, nárezy a materiálový zoznam na jednom mieste.' : 'Drevené terasy: materiály, interaktívny návrh terasy a realizácia. Navrhni, nakúp, zrealizuj. Katalóg v tomto náhľade používa označené demo údaje.');
  }, [location.pathname, catalog]);
  return <div className="arch2027 platform-shell"><a className="arch2027-skip" href="#platform-content" onClick={e => { e.preventDefault(); const main = body.current?.querySelector<HTMLElement>('main'); if (main) { main.tabIndex = -1; main.focus(); } }}>Preskočiť na obsah</a><Header2027 /><div id="platform-content" ref={body}><Outlet /></div><footer className="platform-footer"><div><Link to="/" className="platform-footer-title">PRIESTOR.<br /><span>TVOJ.</span></Link><p>NAVRHNI → NAKÚP → ZREALIZUJ</p></div><nav aria-label="Materiály"><span>01 / MATERIÁLY</span><Link to="/terasove-dosky?category=massive">Masívne drevo</Link><Link to="/terasove-dosky?category=thermo">Thermowood</Link><Link to="/terasove-dosky?category=wpc">WPC terasy</Link><Link to="/prislusenstvo">Príslušenstvo</Link></nav><nav aria-label="Návrh a realizácia"><span>02 / TVOJ PROJEKT</span><Link to="/planovac">Plánovač terasy</Link><Link to="/realizacia-na-kluc">Realizácia na kľúč</Link><Link to="/poradna">Technická poradňa</Link><Link to="/kontakt">Kontakt</Link></nav><div className="platform-footer-social"><span>03 / DREVENÉ TERASY</span><a href="https://www.instagram.com/dreveneterasy" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://www.facebook.com/share/17q1RTU6bu/" target="_blank" rel="noreferrer">Facebook ↗</a><p>Ukážkový katalóg. Ceny na vyžiadanie.<br />Reálne objednávky zatiaľ nie sú aktívne.</p></div><div className="platform-footer-bottom"><span>© {new Date().getFullYear()} DREVENÉ TERASY</span><Link to="/o-nas">Náš prístup →</Link><Link to="/pravne-informacie">Ochrana údajov a obchodné informácie</Link></div></footer></div>;
}

export function LegalPreview() {
  return <main className="platform-legal" tabIndex={-1}><p>PRÁVNE INFORMÁCIE / NÁHĽAD</p><h1>JASNE.<br />ZROZUMITEĽNE.</h1><section><h2>Stav služby</h2><p>Tento náhľad používa demonštračné produkty. Výsledky plánovača sú orientačné, montážne hodnoty DEMO sa nesmú použiť ako montážny návod. Reálne objednávky, platby ani odosielanie formulárov nie sú aktivované.</p><h2>Údaje v prehliadači</h2><p>Košík a výslovne uložený návrh zostávajú v miestnom úložisku tvojho prehliadača. Kontaktné údaje z formulárov sa automaticky neukladajú. Na tomto náhľade nepoužívame reklamné ani analytické cookies.</p><h2>Pred spustením predaja</h2><p>Prevádzkovateľ musí doplniť overené firemné údaje, kontakt, ceny a dostupnosť, dopravu, spôsob uzatvorenia objednávky, platby, reklamačný poriadok, práva spotrebiteľa a informácie o spracúvaní osobných údajov. Obchodné a právne texty vyžadujú odborné schválenie. Tento text nie je náhradou kompletných obchodných podmienok.</p></section></main>;
}
