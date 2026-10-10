/** Millimetres throughout. No rule is a universal recommendation for a terrace. */
export interface Point { x: number; y: number }
export type DeckShape = 'rectangle' | 'square' | 'l' | 'u' | 'custom';
export interface PlanInput {
  outline: Point[];
  holes: Point[][];
  orientation: 'x' | 'y';
  heightMm: number;
  gapMm: number;
  productId: string;
  variantId?: string;
  reservePercent: number;
  substrate?: 'concrete' | 'paving' | 'soil';
}
export interface ManufacturingRules {
  verification: 'demo' | 'verified';
  source: string;
  minGapMm: number;
  maxGapMm: number;
  perimeterGapMm: number;
  maxJoistSpacingMm: number;
  maxPedestalSpacingMm: number;
  maxBoardOverhangMm: number;
  minBoardWidthMm: number;
  minBoardCutLengthMm: number;
  joistWidthMm: number;
  joistHeightMm: number;
  pedestalMinHeightMm: number;
  pedestalMaxHeightMm: number;
  jointGapMm: number;
  sawKerfMm: number;
  minReusableOffcutMm: number;
  allowButtJoints: boolean;
  fixingsPerIntersection: number;
  joistStockLengthsMm: number[];
  accessoryProductIds?: { joist?: string; pedestal?: string; fixing?: string; edge?: string };
}
export interface EngineProduct {
  id: string;
  name: string;
  variantId: string;
  widthMm: number | null;
  thicknessMm: number | null;
  availableLengthsMm: number[];
  status: 'demo' | 'verified' | 'draft';
  installationRules: ManufacturingRules | null;
}
export interface BoardPiece {
  id: string;
  row: number;
  start: Point;
  end: Point;
  widthMm: number;
  lengthMm: number;
  /** Exact strip intersections. Multiple touching trapezoids form one physical board. */
  footprintParts: Point[][];
  jointBefore: boolean;
  jointAfter: boolean;
}
export interface JoistSegment {
  id: string;
  start: Point;
  end: Point;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  pairedAtJoint: boolean;
}
export interface PedestalPoint extends Point { id: string; joistId: string; heightMm: number }
export interface StockCut { boardId: string; lengthMm: number }
export interface StockBoard {
  id: string;
  lengthMm: number;
  cuts: StockCut[];
  kerfMm: number;
  offcutMm: number;
  reusable: boolean;
  reserve: boolean;
}
export interface MaterialItem {
  key: 'boards' | 'joists' | 'pedestals' | 'fixings' | 'edges';
  productId: string | null;
  variantId: string | null;
  name: string;
  quantity: number;
  unit: 'ks' | 'bm';
  stockLengthMm?: number;
  verified: boolean;
}
export interface PlanWarning { code: string; message: string }
export interface PlanResult {
  valid: boolean;
  technicalStatus: 'demo' | 'verified' | 'unavailable';
  warnings: PlanWarning[];
  outline: Point[];
  holes: Point[][];
  orientation: 'x' | 'y';
  heightMm: number;
  substrate: 'concrete' | 'paving' | 'soil';
  boardThicknessMm: number;
  areaM2: number;
  perimeterM: number;
  boardAreaM2: number;
  boards: BoardPiece[];
  joists: JoistSegment[];
  pedestals: PedestalPoint[];
  stock: StockBoard[];
  joistStock: StockBoard[];
  materials: MaterialItem[];
  totals: {
    boardPieces: number;
    boardLinearMetres: number;
    purchasedLinearMetres: number;
    joistLinearMetres: number;
    wasteMm: number;
    reusableOffcutMm: number;
    kerfMm: number;
    utilizationPercent: number | null;
    reserveBoards: number;
  };
}
