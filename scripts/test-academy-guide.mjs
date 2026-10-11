import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = join(root, 'qa/ci-academy-guide-static');
const working = join(fixture, '.work');
const esbuild = process.env.ENGINE_ESBUILD_PATH
  ? await import(pathToFileURL(process.env.ENGINE_ESBUILD_PATH).href)
  : await import('esbuild');
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks++; };
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
const escaped = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const safe = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const publicRoot = 'https://martinfabian-pixel.github.io/Drevene-terasy/academy-guides/';

await mkdir(working, { recursive: true });
const sourceDirectory = join(root, 'src/academy');
const compiled = await esbuild.build({
  absWorkingDir: root,
  stdin: {
    contents: "export { journeys, getStepData } from './journeys'; export { chapters } from './manual'; export { publications } from './library'; export { editorial } from './editorial';",
    sourcefile: join(sourceDirectory, 'guide-test-data.ts'), resolveDir: sourceDirectory, loader: 'ts',
  },
  bundle: true, write: false, tsconfigRaw: { compilerOptions: {} }, format: 'cjs', platform: 'node', target: 'node22', logLevel: 'warning',
  plugins: [{ name: 'academy-guide-test-files', setup(build) {
    build.onResolve({ filter: /^\./ }, async args => {
      const target = resolve(args.resolveDir, args.path);
      for (const candidate of [target, `${target}.ts`, `${target}.tsx`, join(target, 'index.ts')]) {
        try { if ((await stat(candidate)).isFile()) return { path: candidate, namespace: 'academy-guide-test-files' }; } catch {}
      }
      return { errors: [{ text: `Missing academy guide source: ${target}` }] };
    });
    build.onLoad({ filter: /.*/, namespace: 'academy-guide-test-files' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: args.path.endsWith('.json') ? 'json' : args.path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) }));
  } }],
});
const compiledPath = join(working, 'guide-data.cjs');
await writeFile(compiledPath, compiled.outputFiles[0].contents);
const imported = await import(pathToFileURL(compiledPath).href);
const { journeys, getStepData, chapters, publications, editorial } = imported.default ?? imported;

// URL identifiers are a public contract. This snapshot contains no technical values.
const stableSteps = {
  drevo: ['vyber', 'drevo-wpc', 'cumaru-ipe', 'rez', 'povrch', 'dalsi-krok'],
  terasa: ['zameranie', 'material', 'podklad', 'skladba', 'rost', 'kotvenie', 'dilatacie', 'kontrola'],
  podkonstrukcia: ['vrstvy', 'drevo-hlinik', 'orientacia', 'celne-spoje', 'voda-vzduch', 'zhrnutie'],
  kotvenie: ['ocel', 'rozmer', 'drevo-alu', 'poloha', 'hlava', 'skryte'],
  wpc: ['system', 'pohyb', 'nosnost', 'voda'],
  chyby: Array.from({ length: 9 }, (_, index) => 'chyba-' + index),
};
equal(journeys.map(topic => topic.id), Object.keys(stableSteps), 'Stable topic URLs');
ok(new Set(journeys.map(topic => topic.id)).size === journeys.length, 'Unique topic identifiers');

function readReference(reference) {
  if ('article' in reference) {
    equal(Object.keys(reference).sort(), ['article', 'section'], 'Article references contain no copied technical values');
    const article = editorial.find(item => item.slug === reference.article);
    ok(article, 'Existing article: ' + reference.article);
    const section = article.sections[reference.section];
    ok(section, 'Existing article section: ' + reference.article + '/' + reference.section);
    return { lead: article.lead, basic: section.text, pro: [], evidence: article.sources, manualId: article.manual };
  }
  equal(Object.keys(reference).sort(), ['chapter', 'manual'], 'Manual references contain no copied technical values');
  const publication = reference.manual === '04' ? { chapters } : publications.find(item => item.id === reference.manual);
  ok(publication, 'Existing manual: ' + reference.manual);
  const chapter = publication.chapters.find(item => item.id === reference.chapter);
  ok(chapter, 'Existing chapter: ' + reference.manual + '/' + reference.chapter);
  return { ...chapter, manualId: reference.manual };
}

let steps = 0;
for (const topic of journeys) {
  ok(safe(topic.id), 'Safe topic URL');
  ok(topic.steps.length > 0, 'Nonempty guide');
  equal(topic.steps.map(step => step.id), stableSteps[topic.id], 'Stable step URLs: ' + topic.id);
  ok(new Set(topic.steps.map(step => step.id)).size === topic.steps.length, 'Unique step identifiers');
  for (const step of topic.steps) {
    steps++;
    const label = topic.id + '/' + step.id;
    ok(safe(step.id), 'Safe step URL: ' + label);
    const content = readReference(step.source);
    ok(typeof content.basic[step.excerpt ?? 0] === 'string', 'Existing excerpt: ' + label);
    const resolvedNotices = [];
    const noticeEvidence = [];
    for (const notice of step.notices ?? []) {
      const noticeSource = readReference(notice.source);
      const noticeText = noticeSource[notice.field][notice.index];
      ok(typeof noticeText === 'string', 'Existing notice: ' + label + ' ' + notice.field + '[' + notice.index + ']');
      resolvedNotices.push(noticeText);
      noticeEvidence.push(...noticeSource.evidence);
    }
    const data = getStepData(topic.id, step.id);
    for (const key of ['title', 'lead', 'summary', 'manualId']) ok(typeof data[key] === 'string' && data[key].trim().length > 0 && !data[key].includes('undefined'), 'Resolved ' + key + ': ' + label);
    for (const key of ['details', 'notices', 'evidence']) ok(Array.isArray(data[key]) && data[key].every(text => typeof text === 'string' && text.trim().length > 0 && !text.includes('undefined')), 'Resolved ' + key + ': ' + label);
    ok(data.evidence.length > 0, 'Technical evidence: ' + label);
    ok(data.summary.length <= data.details.join(' ').length, 'Summary remains an excerpt: ' + label);
    equal(data.title, step.title, 'Shared title: ' + label);
    equal(data.lead, content.lead, 'Unchanged source introduction: ' + label);
    equal(data.details, [...content.basic, ...content.pro], 'Unchanged complete technical prose: ' + label);
    equal(data.notices, resolvedNotices, 'Unchanged safety notices: ' + label);
    equal(data.evidence, [...new Set([...content.evidence, ...noticeEvidence])], 'Exact source records: ' + label);
    equal(data.manualId, content.manualId, 'Source manual PDF identity: ' + label);
  }
}
equal(steps, 39, 'Complete current guide coverage');

for (const directory of ['scripts', 'src/academy', 'dist']) await mkdir(join(fixture, directory), { recursive: true });
await copyFile(join(root, 'scripts/prerender-academy-guides.mjs'), join(fixture, 'scripts/prerender-academy-guides.mjs'));
const sourceLink = relative(join(fixture, 'src/academy'), join(sourceDirectory, 'journeys.ts')).replace(/\\/g, '/');
await writeFile(join(fixture, 'src/academy/journeys.ts'), "export { journeys, getStepData } from '" + (sourceLink.startsWith('.') ? '' : './') + sourceLink + "';\n", 'utf8');
await writeFile(join(fixture, 'dist/index.html'), '<!doctype html><html lang="sk"><body><div id="root"></div></body></html>', 'utf8');
for (let run = 0; run < 2; run++) {
  const result = spawnSync(process.execPath, [join(fixture, 'scripts/prerender-academy-guides.mjs')], { encoding: 'utf8', env: { ...process.env, ACADEMY_TEMP_ROOT: working } });
  ok(result.status === 0, 'Real static prerender execution: ' + result.stderr);
  console.log(result.stdout.trim());
}
const app = await readFile(join(fixture, 'dist/index.html'), 'utf8');
equal((app.match(/id="academy-static-fallback"/g) ?? []).length, 1, 'Idempotent noscript fallback');
ok(app.includes('<noscript') && app.includes('/Drevene-terasy/academy-guides/'), 'Readable no-JavaScript entry');
const sitemap = await readFile(join(fixture, 'dist/academy-guides/sitemap.xml'), 'utf8');
equal((sitemap.match(/<loc>/g) ?? []).length, 46, 'Complete canonical sitemap');
const index = await readFile(join(fixture, 'dist/academy-guides/index.html'), 'utf8');
for (const topic of journeys) {
  const topicHTML = await readFile(join(fixture, 'dist/academy-guides', topic.id, 'index.html'), 'utf8');
  ok(topicHTML.includes(escaped(topic.title)), 'Static topic index title');
  ok(index.includes(publicRoot + topic.id + '/'), 'Topic index discovery');
  for (let stepIndex = 0; stepIndex < topic.steps.length; stepIndex++) {
    const step = topic.steps[stepIndex];
    const html = await readFile(join(fixture, 'dist/academy-guides', topic.id, step.id, 'index.html'), 'utf8');
    const data = getStepData(topic.id, step.id);
    const canonical = publicRoot + topic.id + '/' + step.id + '/';
    ok(html.includes('<html lang="sk">') && html.includes('rel="canonical" href="' + canonical + '"'), 'Canonical Slovak page');
    ok(html.includes('<h1>' + escaped(data.title) + '</h1>') && html.includes('<main id="main">'), 'Semantic accessible step heading');
    ok(!html.includes('undefined'), 'No unresolved output');
    ok(html.includes(escaped(data.summary)), 'Static summary from shared content');
    for (const text of data.details) ok(html.includes(escaped(text)), 'Full technical explanation available without JavaScript');
    for (const text of data.notices) ok(html.includes(escaped(text)), 'Visible safety notices');
    for (const text of data.evidence) ok(html.includes(escaped(text)), 'Exact technical evidence rendered');
    ok(html.includes('Zdroje tohto kroku') && html.includes('aria-label="Postup sprievodcom"'), 'Evidence and step navigation');
    ok(html.includes('/manuals/pod-povrchom-' + data.manualId + '.pdf'), 'Original manual PDF link');
    ok(html.includes('/pod-povrchom/sprievodca/' + topic.id + '?step=' + step.id), 'Exact interactive deep link');
    ok(topicHTML.includes(canonical), 'Topic links every step');
    ok(sitemap.includes('<loc>' + canonical + '</loc>'), 'Step discoverable in sitemap');
    ok(!/<script(?! type="application\/ld\+json")/.test(html), 'No executable JavaScript');
    const previous = topic.steps[stepIndex - 1], next = topic.steps[stepIndex + 1];
    if (previous) ok(html.includes(publicRoot + topic.id + '/' + previous.id + '/" rel="prev"'), 'Correct previous step');
    if (next) ok(html.includes(publicRoot + topic.id + '/' + next.id + '/" rel="next"'), 'Correct next step');
  }
}
console.log(JSON.stringify({ suite: 'academy-guide-data-and-static-html', topics: journeys.length, steps, passed: checks, failed: 0 }));
