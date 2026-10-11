import { copyFile, mkdtemp, readFile, rm, stat, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Static, no-JavaScript entry points read the same content as the interactive guide.
// No product records or mounting-rule values are copied into this script.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const outputRoot = join(dist, 'academy-guides');
const base = '/Drevene-terasy/';
const origin = 'https://martinfabian-pixel.github.io';
const publicRoot = origin + base + 'academy-guides/';
const library = base + '#/pod-povrchom/kniznica';
const esbuild = process.env.ENGINE_ESBUILD_PATH
  ? await import(pathToFileURL(process.env.ENGINE_ESBUILD_PATH).href)
  : await import('esbuild');
const temporary = await mkdtemp(join(process.env.ACADEMY_TEMP_ROOT ?? tmpdir(), 'drevene-terasy-guides-'));

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const slug = value => {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw Error(`Invalid guide URL segment: ${value}`);
  return value;
};
const interactive = (topic, step) => base + '#/pod-povrchom/sprievodca/' + slug(topic) + '?step=' + encodeURIComponent(slug(step));
const staticStep = (topic, step) => publicRoot + slug(topic) + '/' + slug(step) + '/';
const paragraphs = values => values.map(value => '<p>' + escape(value) + '</p>').join('');
const css = `
  @media screen {
    :root{color-scheme:light;font-family:var(--ds-font);color:var(--ds-ink);background:var(--ds-paper);font-synthesis:none}
    *{box-sizing:border-box}body{margin:0;font:var(--ds-body)/1.5 var(--ds-font)}a{color:inherit;text-underline-offset:.2em}a:focus-visible,summary:focus-visible{outline:2px solid var(--ds-ink);outline-offset:5px}
    .bar{padding:var(--ds-space-5) max(var(--ds-gutter,16px),calc((100vw - var(--ds-container))/2));border-bottom:1px solid var(--ds-line);display:flex;flex-wrap:wrap;justify-content:space-between;gap:var(--ds-space-4);font-size:var(--ds-small)}
    .bar a{text-decoration:none;min-height:44px;display:inline-flex;align-items:center}.brand{font-weight:700}.crumbs{display:flex;flex-wrap:wrap;gap:var(--ds-space-4)}
    main{width:min(calc(100% - 2 * var(--ds-gutter,16px)),var(--ds-container));margin:var(--ds-space-8) auto var(--ds-space-9)}.eyebrow{font-size:var(--ds-small);letter-spacing:.025em;text-transform:uppercase;color:var(--ds-muted)}
    h1{font-family:var(--ds-display);font-size:var(--ds-h1);font-weight:700;line-height:1.3;letter-spacing:0;margin:var(--ds-space-5) 0 var(--ds-space-6);overflow-wrap:anywhere;max-width:950px}
    h2{font-size:var(--ds-h2);font-weight:700;line-height:1.5;letter-spacing:0;margin:var(--ds-space-7) 0 var(--ds-space-4)}p,li{font-size:var(--ds-body);line-height:1.5;max-width:760px;overflow-wrap:anywhere}.lead{font-size:var(--ds-body);line-height:1.5;max-width:760px}
    .button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:var(--ds-space-3) var(--ds-space-5);background:var(--ds-ink);color:var(--ds-paper);text-decoration:none;font-size:var(--ds-small);font-weight:700}.button:hover{background:var(--ds-muted)}
    .actions{display:flex;flex-wrap:wrap;gap:var(--ds-space-4);margin:var(--ds-space-6) 0 var(--ds-space-7);align-items:center}.actions>a:not(.button){min-height:44px;display:inline-flex;align-items:center}
    .summary{margin:var(--ds-space-6) 0;padding:var(--ds-space-5) 0 var(--ds-space-5) var(--ds-space-5);border-left:2px solid var(--ds-ink)}.summary p{margin:0}.notice{padding:var(--ds-space-4) var(--ds-space-5);background:var(--ds-soft);border-left:2px solid var(--ds-ink);margin:var(--ds-space-5) 0}.notice p,.notice strong{font-size:var(--ds-small)}
    .contents{list-style:none;padding:0;margin:var(--ds-space-6) 0}.contents li{margin:0;border-top:1px solid var(--ds-line);max-width:none}.contents a{display:block;padding:var(--ds-space-5) 0;text-decoration:none}.contents a:hover{text-decoration:underline}.contents span{display:block;font-size:var(--ds-small);color:var(--ds-muted);margin-bottom:var(--ds-space-2)}.contents strong{font-size:var(--ds-h3);line-height:1.5;letter-spacing:0}.contents p{margin:var(--ds-space-2) 0 0;font-size:var(--ds-body)}
    .technical{border-top:1px solid var(--ds-line);border-bottom:1px solid var(--ds-line);margin:var(--ds-space-6) 0;padding:var(--ds-space-5) 0}.technical summary{font-size:var(--ds-body);font-weight:700;cursor:pointer;min-height:44px;padding:var(--ds-space-3) 0}.technical p{font-size:var(--ds-body)}
    .sources p{font-size:var(--ds-small);color:var(--ds-muted)}.stepnav{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--ds-space-4);border-top:1px solid var(--ds-line);padding-top:var(--ds-space-5);margin-top:var(--ds-space-7)}.stepnav a{padding:var(--ds-space-3) 0;min-height:44px}.stepnav .button{padding:var(--ds-space-3) var(--ds-space-5)}.stepnav span{font-size:var(--ds-small)}.scope{font-size:var(--ds-small);color:var(--ds-muted)}.footer{border-top:1px solid var(--ds-line);padding:var(--ds-space-5) max(var(--ds-gutter,16px),calc((100vw - var(--ds-container))/2));font-size:var(--ds-small);line-height:1.5}
    @media(max-width:480px){.bar{padding:var(--ds-space-4)}.crumbs{gap:var(--ds-space-3)}main{margin-top:var(--ds-space-6)}.actions{display:block}.actions>a{margin:0 0 var(--ds-space-3)}.stepnav{gap:var(--ds-space-2)}.stepnav .button{padding:var(--ds-space-3)}.summary{padding-left:var(--ds-space-4)}}
  }
  @media print{.bar,.actions,.stepnav,.footer{display:none}body{background:white}main{width:100%;margin:0}.technical{break-inside:avoid}h1{font-size:36px}a{color:black}}
`;
let fontStyleLinks = '';

function page({ title, description, canonical, body, topic }) {
  const metadata = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonical, inLanguage: 'sk', isPartOf: { '@type': 'WebSite', name: 'Drevené terasy — Pod povrchom', url: publicRoot } };
  return '<!doctype html>\n<html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + escape(title) + ' | Pod povrchom — Drevené terasy</title><meta name="description" content="' + escape(description) + '"><meta name="robots" content="index,follow"><link rel="canonical" href="' + escape(canonical) + '"><meta property="og:type" content="article"><meta property="og:title" content="' + escape(title) + '"><meta property="og:description" content="' + escape(description) + '"><meta property="og:url" content="' + escape(canonical) + '"><link rel="stylesheet" href="' + base + 'design-system.css">' + fontStyleLinks + '<style>' + css + '</style><script type="application/ld+json">' + JSON.stringify(metadata).replace(/</g, '\\u003c') + '</script></head><body><header class="bar"><a class="brand" href="' + base + '#/pod-povrchom">DREVENÉ TERASY / POD POVRCHOM</a><nav class="crumbs" aria-label="Navigácia dokumentácie"><a href="' + publicRoot + '">Sprievodcovia</a>' + (topic ? '<a href="' + publicRoot + slug(topic.id) + '/">' + escape(topic.title) + '</a>' : '') + '<a href="' + library + '">Technická knižnica ↗</a></nav></header><main id="main">' + body + '</main><footer class="footer">POD POVRCHOM / Textová verzia spoločných odborných podkladov. Technické hodnoty platia len pre príslušný výrobok a montážny systém. Výstup nenahrádza staticky overenú realizačnú dokumentáciu.</footer></body></html>\n';
}

try {
  await mkdir(dist, { recursive: true });
  await copyFile(join(root, 'src/styles/design-system.css'), join(dist, 'design-system.css'));
  // Copy licensed font assets without depending on Vite's hashed CSS bundle.
  // The isolated data-test fixture intentionally has no node_modules directory.
  const fontSource = join(root, 'node_modules/@fontsource/open-sans');
  let hasLocalFont = false;
  try { hasLocalFont = (await stat(fontSource)).isDirectory(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (hasLocalFont) {
    const fontTarget = join(dist, 'fonts/open-sans');
    await mkdir(join(fontTarget, 'files'), { recursive: true });
    for (const subset of ['latin', 'latin-ext']) for (const weight of [400, 600, 700]) {
      const name = subset + '-' + weight + '.css';
      const stylesheet = await readFile(join(fontSource, name), 'utf8');
      await copyFile(join(fontSource, name), join(fontTarget, name));
      for (const match of stylesheet.matchAll(/url\(['"]?(\.\/files\/[^'"\)]+)['"]?\)/g)) {
        const relativeFont = match[1];
        if (!/^\.\/files\/[a-z0-9.-]+\.(?:woff2?|ttf)$/.test(relativeFont)) throw Error('Unexpected Open Sans font path: ' + relativeFont);
        await copyFile(join(fontSource, relativeFont), join(fontTarget, relativeFont));
      }
      fontStyleLinks += '<link rel="stylesheet" href="' + base + 'fonts/open-sans/' + name + '">';
    }
    await copyFile(join(fontSource, 'LICENSE'), join(fontTarget, 'LICENSE'));
  }
  const entry = join(root, 'src/academy/journeys.ts');
  const bundle = await esbuild.build({
    stdin: { contents: await readFile(entry, 'utf8'), sourcefile: entry, resolveDir: dirname(entry), loader: 'ts' },
    absWorkingDir: root, tsconfigRaw: { compilerOptions: {} }, write: false, bundle: true, platform: 'node', format: 'cjs', target: 'node22', logLevel: 'warning',
    plugins: [{ name: 'academy-guide-data', setup(build) {
      build.onResolve({ filter: /^\./ }, async args => {
        const target = resolve(args.resolveDir, args.path);
        for (const candidate of [target, `${target}.ts`, `${target}.json`, join(target, 'index.ts')]) {
          try { if ((await stat(candidate)).isFile()) return { path: candidate, namespace: 'academy-data-files' }; } catch {}
        }
        return { errors: [{ text: `Missing academy guide source: ${target}` }] };
      });
      build.onLoad({ filter: /.*/, namespace: 'academy-data-files' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: args.path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path) }));
    } }],
  });
  const compiled = join(temporary, 'guides.cjs');
  await writeFile(compiled, bundle.outputFiles[0].contents);
  const imported = await import(pathToFileURL(compiled).href);
  const { journeys, getStepData } = imported.default ?? imported;
  if (!Array.isArray(journeys) || !journeys.length || typeof getStepData !== 'function') throw Error('Missing journeys/getStepData shared-data contract.');
  const urls = [publicRoot];
  const topics = new Set();
  let renderedSteps = 0;
  await mkdir(outputRoot, { recursive: true });
  const indexBody = '<p class="eyebrow">POD POVRCHOM / SPRIEVODCOVIA BEZ JAVASCRIPTU</p><h1>POD POVRCHOM.</h1><p class="lead">Rozumieme drevu. Od prvého návrhu až po posledný detail montáže.</p><p>Vyberte si tému. Každý odkaz otvorí jednu myšlienku, jej vysvetlenie a príslušné technické zdroje. Túto dokumentáciu môžete čítať bez JavaScriptu.</p><ol class="contents">' + journeys.map((topic, i) => {
    slug(topic.id);
    if (!topic.steps?.length || topics.has(topic.id)) throw Error(`Empty or duplicate guide: ${topic.id}`);
    topics.add(topic.id);
    return '<li><a href="' + publicRoot + topic.id + '/"><span>' + String(i + 1).padStart(2, '0') + ' / ' + topic.steps.length + ' KROKOV</span><strong>' + escape(topic.title) + '</strong><p>' + escape(topic.description) + '</p></a><a href="' + staticStep(topic.id, topic.steps[0].id) + '">Začať: ' + escape(topic.steps[0].title) + ' →</a></li>';
  }).join('') + '</ol><p class="scope">Všetky texty sa pri nasadení skladajú z rovnakej dátovej vrstvy ako interaktívny sprievodca.</p>';
  await writeFile(join(outputRoot, 'index.html'), page({ title: 'Pod povrchom — odborní sprievodcovia', description: 'Rozumieme drevu. Od prvého návrhu až po posledný detail montáže.', canonical: publicRoot, body: indexBody }), 'utf8');

  for (const topic of journeys) {
    const topicUrl = publicRoot + topic.id + '/';
    const topicDirectory = join(outputRoot, topic.id);
    await mkdir(topicDirectory, { recursive: true });
    urls.push(topicUrl);
    const topicBody = '<p class="eyebrow">POD POVRCHOM / ' + topic.steps.length + ' KROKOV</p><h1>' + escape(topic.title) + '</h1><p class="lead">' + escape(topic.description) + '</p><div class="actions"><a class="button accent" href="' + staticStep(topic.id, topic.steps[0].id) + '">Začať sprievodcu →</a><a href="' + interactive(topic.id, topic.steps[0].id) + '">Otvoriť interaktívnu verziu ↗</a></div><nav aria-label="Kroky sprievodcu"><ol class="contents">' + topic.steps.map((step, i) => '<li><a href="' + staticStep(topic.id, step.id) + '"><span>KROK ' + (i + 1) + ' / ' + topic.steps.length + '</span><strong>' + escape(step.title) + '</strong></a></li>').join('') + '</ol></nav>';
    await writeFile(join(topicDirectory, 'index.html'), page({ title: topic.title, description: topic.description, canonical: topicUrl, body: topicBody, topic }), 'utf8');
    const seenSteps = new Set();
    for (let index = 0; index < topic.steps.length; index++) {
      const step = topic.steps[index];
      slug(step.id);
      if (seenSteps.has(step.id)) throw Error(`Duplicate guide step: ${topic.id}/${step.id}`);
      seenSteps.add(step.id);
      const data = getStepData(topic.id, step.id);
      if (!data || typeof data.title !== 'string' || typeof data.lead !== 'string' || typeof data.summary !== 'string' || !['details', 'notices', 'evidence'].every(key => Array.isArray(data[key]) && data[key].every(value => typeof value === 'string')) || !/^0[1-6]$/.test(data.manualId)) throw Error(`Invalid resolved guide step: ${topic.id}/${step.id}`);
      const canonical = staticStep(topic.id, step.id);
      urls.push(canonical);
      const previous = topic.steps[index - 1];
      const next = topic.steps[index + 1];
      const body = '<p class="eyebrow">' + escape(topic.title) + ' / KROK ' + (index + 1) + ' Z ' + topic.steps.length + '</p><h1>' + escape(data.title) + '</h1><p class="lead">' + escape(data.lead) + '</p><section class="summary" aria-label="Textové vysvetlenie technického princípu"><p>' + escape(data.summary) + '</p></section>' + (data.notices.length ? '<aside class="notice" aria-label="Dôležité montážne obmedzenia"><strong>PODMIENKY, KTORÉ TREBA REŠPEKTOVAŤ</strong>' + paragraphs(data.notices) + '</aside>' : '') + '<div class="actions"><a class="button accent" href="' + interactive(topic.id, step.id) + '">Zobraziť interaktívny detail ↗</a><a href="' + base + 'manuals/pod-povrchom-' + data.manualId + '.pdf" download>Úplný manuál ' + data.manualId + ' / PDF ↓</a></div>' + (data.details.length ? '<details class="technical" open><summary>Technické vysvetlenie</summary>' + paragraphs(data.details) + '</details>' : '') + (data.evidence.length ? '<section class="sources"><h2>Zdroje tohto kroku</h2>' + paragraphs(data.evidence) + '</section>' : '') + '<nav class="stepnav" aria-label="Postup sprievodcom">' + (previous ? '<a href="' + staticStep(topic.id, previous.id) + '" rel="prev">← Späť</a>' : '<a href="' + topicUrl + '">← Obsah témy</a>') + '<span aria-label="Aktuálny krok">' + (index + 1) + ' / ' + topic.steps.length + '</span>' + (next ? '<a class="button" href="' + staticStep(topic.id, next.id) + '" rel="next">Pokračovať →</a>' : '<a class="button" href="' + publicRoot + '">Vybrať ďalšiu tému →</a>') + '</nav>';
      const stepDirectory = join(topicDirectory, step.id);
      await mkdir(stepDirectory, { recursive: true });
      await writeFile(join(stepDirectory, 'index.html'), page({ title: data.title, description: data.lead, canonical, body, topic }), 'utf8');
      renderedSteps++;
    }
  }

  await writeFile(join(outputRoot, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => '<url><loc>' + escape(url) + '</loc></url>').join('\n') + '\n</urlset>\n', 'utf8');
  const appIndexPath = join(dist, 'index.html');
  let appIndex = await readFile(appIndexPath, 'utf8');
  const marker = 'id="academy-static-fallback"';
  if (!appIndex.includes(marker)) {
    const fallback = '<noscript ' + marker + '><div style="max-width:760px;margin:var(--ds-space-6) auto;padding:var(--ds-space-5);font:var(--ds-body)/1.5 var(--ds-font);color:var(--ds-ink);background:var(--ds-paper)"><h1>POD POVRCHOM</h1><p>Rozumieme drevu. Od prvého návrhu až po posledný detail montáže.</p><a href="' + base + 'academy-guides/">Otvoriť odborných sprievodcov bez JavaScriptu →</a></div></noscript>';
    if (!/<\/body>/i.test(appIndex)) throw Error('Built index.html has no closing body.');
    appIndex = appIndex.replace(/<\/body>/i, fallback + '</body>');
    await writeFile(appIndexPath, appIndex, 'utf8');
  }
  console.log(`Academy static guides: ${journeys.length} topics, ${renderedSteps} steps, ${urls.length} sitemap URLs.`);
} finally {
  // The only recursive removal is the directory explicitly created above.
  await rm(temporary, { recursive: true, force: true });
}
