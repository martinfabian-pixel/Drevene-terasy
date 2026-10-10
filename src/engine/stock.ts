import { EPSILON, roundMm } from './geometry';
import type { StockBoard, StockCut } from './types';

export interface StockOptimization {
  stock: StockBoard[];
  unassigned: StockCut[];
  method: 'deterministic-best-fit';
}
/**
 * Deterministic best-fit packing, comparing three insertion orders. This is a
 * heuristic, not a proof of the global minimum. Every physical stock piece has
 * an auditable length = cuts + saw loss + remaining offcut ledger.
 */
export function optimizeStock(cuts: StockCut[], stockLengthsMm: number[], kerfMm: number,
  minReusableOffcutMm: number, reservePercent = 0): StockOptimization {
  const lengths = [...new Set(stockLengthsMm.filter(n=>Number.isFinite(n)&&n>0).map(roundMm).filter(n=>n>0))].sort((a,b)=>a-b);
  if (!lengths.length || !Number.isFinite(kerfMm) || kerfMm < 0 || !Number.isFinite(minReusableOffcutMm) || minReusableOffcutMm < 0 ||
    !Number.isFinite(reservePercent) || reservePercent < 0 || reservePercent > 50 || cuts.some(c=>!Number.isFinite(c.lengthMm)||c.lengthMm<=0))
    return {stock:[],unassigned:[...cuts],method:'deterministic-best-fit'};
  cuts=cuts.map(c=>({...c,lengthMm:roundMm(c.lengthMm)}));
  if(cuts.some(c=>c.lengthMm<=0))return {stock:[],unassigned:[...cuts],method:'deterministic-best-fit'};
  kerfMm=roundMm(kerfMm);
  const orders = [
    [...cuts].sort((a,b)=>b.lengthMm-a.lengthMm||a.boardId.localeCompare(b.boardId,'en')),
    [...cuts].sort((a,b)=>a.lengthMm-b.lengthMm||a.boardId.localeCompare(b.boardId,'en')),
    [...cuts].sort((a,b)=>a.boardId.localeCompare(b.boardId,'en')),
  ];
  function pack(order: StockCut[]) {
    const stock: StockBoard[] = [], unassigned:StockCut[]=[];
    for (const cut of order) {
      let candidate:StockBoard|undefined;
      for(const piece of stock) {
        if(piece.offcutMm+EPSILON<cut.lengthMm)continue;
        if(!candidate||piece.offcutMm<candidate.offcutMm-EPSILON||
          (Math.abs(piece.offcutMm-candidate.offcutMm)<EPSILON&&piece.id.localeCompare(candidate.id,'en')<0))candidate=piece;
      }
      if (!candidate) {
        const length = lengths.find(l=>l+EPSILON>=cut.lengthMm);
        if (!length) {unassigned.push(cut);continue;}
        candidate={id:`stock-${stock.length+1}`,lengthMm:length,cuts:[],kerfMm:0,offcutMm:length,reusable:true,reserve:false};
        stock.push(candidate);
      }
      const tail = Math.max(0,candidate.offcutMm-cut.lengthMm);
      const sawLoss = Math.min(kerfMm,tail);
      candidate.cuts.push({...cut,lengthMm:roundMm(cut.lengthMm)});
      candidate.kerfMm=roundMm(candidate.kerfMm+sawLoss);
      candidate.offcutMm=roundMm(tail-sawLoss);
      candidate.reusable=candidate.offcutMm+EPSILON>=minReusableOffcutMm;
    }
    return {stock,unassigned};
  }
  const candidates=orders.map(pack);
  candidates.sort((a,b)=>a.unassigned.length-b.unassigned.length||
    a.stock.reduce((s,p)=>s+p.lengthMm,0)-b.stock.reduce((s,p)=>s+p.lengthMm,0)||
    a.stock.length-b.stock.length||JSON.stringify(a.stock).localeCompare(JSON.stringify(b.stock),'en'));
  const best=candidates[0];
  const extra = Math.ceil(best.stock.length*reservePercent/100);
  if (extra && best.stock.length) {
    const frequency = new Map<number,number>();
    best.stock.forEach(s=>frequency.set(s.lengthMm,(frequency.get(s.lengthMm)||0)+1));
    const reserveLengths=[...frequency].sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
    for(let i=0;i<extra;i++) {
      const length=reserveLengths[i%reserveLengths.length][0];
      best.stock.push({id:`reserve-${i+1}`,lengthMm:length,cuts:[],kerfMm:0,offcutMm:length,reusable:true,reserve:true});
    }
  }
  return {...best,method:'deterministic-best-fit'};
}
