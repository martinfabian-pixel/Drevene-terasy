import assert from 'node:assert/strict';
import {publications,stockFor,manualPath} from '../src/academy/library';
import {editorial} from '../src/academy/editorial';
import {boardRows} from '../src/academy/manual';
let passed=0;const ok=(value:boolean)=>{assert.ok(value);passed++};
ok(publications.length===5);ok(editorial.length===10);ok(new Set(editorial.map(a=>a.slug)).size===10);
for(const p of publications){ok(p.chapters.length>=4);ok(p.steps.length>=6);ok(p.checks.length>=4);ok(p.pending.length>0);ok(stockFor(p.categories).length>0);for(const c of p.chapters){ok(c.basic.length>=2);ok(c.pro.length>0);ok(c.evidence.length>0)}}
for(const a of editorial){ok(a.sections.length>=2);ok(a.sources.length>0);ok(!manualPath(a.manual).includes('undefined'));ok(stockFor(a.categories).length>0)}
ok(boardRows.length===51);ok(boardRows.filter(x=>x.rules.spacing.status==='verified').length===43);
console.log(JSON.stringify({suite:'academy-content-and-shared-rules',passed,failed:0}));
