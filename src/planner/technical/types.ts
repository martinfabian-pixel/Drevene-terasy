import type { Point } from '../../engine/types';
export type Verification = 'verified' | 'requiresReview' | 'unknown';
export interface Evidence { document: string; pages: number[]; year: number | null; note?: string }
export interface Rule<T> { value: T | null; status: Verification; sources: Evidence[] }
export type FixingSystem = 'visible' | 'profix-x' | 'profix-x2' | 'dila' | 'juan' | 'ligo-s47' | 'ligo-s34' | 'upm';
export interface TechnicalOptions {
 fixing?: FixingSystem; joistArticle?: string; joistFlat?: boolean;
 perimeterGapMm?: number; jointGapMm?: number; sawKerfMm?: number; trimEachEndMm?: number;
 spacerMm?: number; moisturePercent?: number; pool?: boolean; drainageConfirmed?: boolean;
}
export interface TechnicalProfile {
 version: string; article: string; productId: string; variantId: string;
 material: string; profile: string; widthMm: number; thicknessMm: number; lengthMm: number;
 spacing: Rule<number>; sideGap: Rule<number>; jointGap: Rule<number>; wallGap: Rule<number>;
 endFixingOffset: Rule<number>; sideFixingOffset: Rule<number>; maxOverhang: Rule<number>;
 doubleJoistClearance: Rule<number>; minVentilationConcrete: Rule<number>; minVentilationSoil: Rule<number>;
 predilling: Rule<string>; screwDepth: Rule<string>; movement: Rule<string>;
 systems: Rule<FixingSystem[]>; joistArticles: Rule<string[]>; minSupports: Rule<number>;
 structuralSpan: Rule<number>; verification: Verification; notes: string[];
}
export interface TechnicalStock { productId: string; variantId: string; article: string; lengthMm: number; widthMm: number; thicknessMm: number; priceGross: number | null; unit: string; profile: string }
export interface TechnicalContext { profile: TechnicalProfile; boardStock: TechnicalStock[]; accessories: TechnicalStock[] }
export interface Connection { boardId: string; joistId: string; position: Point; kind: 'visible' | 'hidden'; count: number }
export interface TechnicalReport {
 version: string; structuralVerification: 'requiresReview'; profile: TechnicalProfile;
 options: Required<Omit<TechnicalOptions,'moisturePercent'>> & {moisturePercent: number | null};
 assumptions: string[]; sources: Evidence[]; connections: Connection[];
 missingItems: string[]; incomplete: boolean; joistArticle: string | null; cutoutWasteM2: number;
}
