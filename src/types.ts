/** Unit of measurement for label dimensions */
export type Unit = "mm" | "inch" | "dot";

/** Print orientation / rotation */
export type Rotation = 0 | 90 | 180 | 270;

/** Text alignment */
export type Alignment = "left" | "center" | "right";

/** Barcode symbology types supported across printer languages */
export type BarcodeType =
  | "code128"
  | "code128a"
  | "code128b"
  | "code128c"
  | "code39"
  | "code93"
  | "ean13"
  | "ean8"
  | "upca"
  | "upce"
  | "itf"
  | "itf14"
  | "codabar"
  | "msi"
  | "plessey"
  | "code11"
  | "postnet"
  | "planet"
  | "gs1_128"
  | "gs1_databar";

/** QR Code error correction level */
export type QREcc = "L" | "M" | "Q" | "H";

/** QR Code model */
export type QRModel = 1 | 2;

/** Dithering algorithm for image processing */
export type DitherAlgorithm = "threshold" | "floyd-steinberg" | "atkinson" | "ordered";

/** Label configuration */
export interface LabelConfig {
  /** Label width */
  width: number;
  /** Label height (optional for receipt/continuous mode) */
  height?: number;
  /** Unit of measurement (default: "mm") */
  unit?: Unit;
  /** Printer DPI (default: 203) */
  dpi?: number;
  /** Gap between labels in mm (label printers only) */
  gap?: number;
  /** Print speed (1-10, printer-dependent) */
  speed?: number;
  /** Print darkness/density (0-15) */
  density?: number;
  /** Print direction */
  direction?: 0 | 1;
  /** Number of copies */
  copies?: number;
}

/** Text element options */
export interface TextOptions {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Font name or ID */
  font?: string;
  /** Font size or magnification */
  size?: number;
  /** Horizontal magnification (1-10) */
  xScale?: number;
  /** Vertical magnification (1-10) */
  yScale?: number;
  /** Rotation */
  rotation?: Rotation;
  /** Bold */
  bold?: boolean;
  /** Underline */
  underline?: boolean;
  /** Reverse (white on black) */
  reverse?: boolean;
  /** Alignment */
  align?: Alignment;
  /** Max width for word-wrap (in dots) */
  maxWidth?: number;
  /** Line spacing (in dots) */
  lineSpacing?: number;
}

/** Barcode element options */
export interface BarcodeOptions {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Barcode symbology type */
  type: BarcodeType;
  /** Barcode height in dots */
  height?: number;
  /** Narrow bar width in dots */
  narrowWidth?: number;
  /** Wide bar width in dots */
  wideWidth?: number;
  /** Show human-readable interpretation */
  readable?: boolean;
  /** HRI position */
  readablePosition?: "none" | "above" | "below" | "both";
  /** Rotation */
  rotation?: Rotation;
}

/** QR code element options */
export interface QROptions {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Error correction level (default: "M") */
  ecc?: QREcc;
  /** Module/cell size in dots (1-10) */
  size?: number;
  /** QR model (default: 2) */
  model?: QRModel;
  /** Rotation */
  rotation?: Rotation;
}

/** Image element options */
export interface ImageOptions {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Target width in dots (auto-scale if set) */
  width?: number;
  /** Target height in dots (auto-scale if set) */
  height?: number;
  /** Dithering algorithm (default: "threshold") */
  dither?: DitherAlgorithm;
  /** Threshold for monochrome conversion (0-255, default: 128) */
  threshold?: number;
}

/** Box/rectangle element options */
export interface BoxOptions {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Border thickness in dots (default: 1) */
  thickness?: number;
  /** Corner radius in dots */
  radius?: number;
}

/** Line element options */
export interface LineOptions {
  /** Start X */
  x1: number;
  /** Start Y */
  y1: number;
  /** End X */
  x2: number;
  /** End Y */
  y2: number;
  /** Line thickness in dots (default: 1) */
  thickness?: number;
}

/** Circle element options */
export interface CircleOptions {
  /** Center X */
  x: number;
  /** Center Y */
  y: number;
  /** Diameter in dots */
  diameter: number;
  /** Border thickness in dots (default: 1) */
  thickness?: number;
}

/** 1-bit monochrome bitmap (universal intermediate format for images) */
export interface MonochromeBitmap {
  /** Packed 1-bit pixel data, row-major, MSB-first */
  data: Uint8Array;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Bytes per row = ceil(width / 8) */
  bytesPerRow: number;
}

/** Internal label element union type */
export type LabelElement =
  | { type: "text"; content: string; options: TextOptions }
  | { type: "barcode"; data: string; options: BarcodeOptions }
  | { type: "qrcode"; data: string; options: QROptions }
  | { type: "image"; bitmap: MonochromeBitmap; options: ImageOptions }
  | { type: "box"; options: BoxOptions }
  | { type: "line"; options: LineOptions }
  | { type: "circle"; options: CircleOptions }
  | { type: "raw"; content: string | Uint8Array };

/** Resolved label configuration with computed values */
export interface ResolvedLabel {
  /** Width in dots */
  widthDots: number;
  /** Height in dots (0 for continuous/receipt) */
  heightDots: number;
  /** DPI */
  dpi: number;
  /** Gap in dots */
  gapDots: number;
  /** Speed */
  speed: number;
  /** Density */
  density: number;
  /** Direction */
  direction: 0 | 1;
  /** Copies */
  copies: number;
  /** All elements to render */
  elements: LabelElement[];
}
