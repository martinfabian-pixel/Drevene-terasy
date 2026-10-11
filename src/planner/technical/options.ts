import type { TechnicalOptions, TechnicalProfile, TechnicalReport } from './types';
export function parseTechnicalOptions(value:unknown):TechnicalOptions|undefined|null {
 if(value===undefined)return undefined;
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const raw=value as Record<string,unknown>;const out:TechnicalOptions={};
 for(const [key,min,max] of [['perimeterGapMm',0,200],['jointGapMm',0,50],['sawKerfMm',0,10],['trimEachEndMm',0,200],['spacerMm',0,20],['moisturePercent',0,50]] as const){
  const n=raw[key];if(n!==undefined){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)return null;out[key]=n;}
 }
 for(const key of ['pool','drainageConfirmed','joistFlat','increasedLoad'] as const)if(raw[key]!==undefined){if(typeof raw[key]!=='boolean')return null;out[key]=raw[key];}
 if(raw.joistArticle!==undefined){if(typeof raw.joistArticle!=='string'||!/^\d{5}\/\d{4}$/.test(raw.joistArticle))return null;out.joistArticle=raw.joistArticle;}
 if(raw.fixing!==undefined){if(typeof raw.fixing!=='string'||!['visible','profix-x','profix-x2','dila','juan','ligo-s47','ligo-s34','upm'].includes(raw.fixing))return null;out.fixing=raw.fixing as TechnicalOptions['fixing'];}
 for(const [key,values] of [['exposure',['normal','salt','condensation','aggressive','chlorine','unknown']],['fastenerReference',['none','teraso','plus','eko','top','alu','wings','bimetal','fasad','twin-a4']]] as const){if(raw[key]!==undefined){if(typeof raw[key]!=='string'||!(values as readonly string[]).includes(raw[key] as string))return null;Object.assign(out,{[key]:raw[key]});}}
 if(raw.screwArticle!==undefined){if(typeof raw.screwArticle!=='string'||! /^(auto|[0-9]{5}\/[0-9]{4})$/.test(raw.screwArticle))return null;out.screwArticle=raw.screwArticle;}
 return out;
}
export function resolveOptions(input:TechnicalOptions|undefined,profile:TechnicalProfile):TechnicalReport['options'] {
 return {screwArticle:input?.screwArticle??'auto',exposure:input?.exposure??'normal',fastenerReference:input?.fastenerReference??'none',increasedLoad:input?.increasedLoad??false,fixing:input?.fixing??profile.systems.value?.[0]??'visible',joistArticle:input?.joistArticle??profile.joistArticles.value?.[0]??'',
 joistFlat:input?.joistFlat??false,perimeterGapMm:input?.perimeterGapMm??profile.wallGap.value??20,
 jointGapMm:input?.jointGapMm??profile.jointGap.value??6,sawKerfMm:input?.sawKerfMm??3,trimEachEndMm:input?.trimEachEndMm??0,
 spacerMm:input?.spacerMm??7,moisturePercent:input?.moisturePercent??null,pool:input?.pool??false,drainageConfirmed:input?.drainageConfirmed??false};
}
