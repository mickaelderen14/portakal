/**
 * Cross-compiler — convert printer commands between any supported languages.
 * World's first thermal printer language translator.
 *
 * Flow: Source code → Parser → LabelElement[] → Target Compiler → Output
 */

import type { LabelElement, ResolvedLabel } from "./types";
import type { PrinterLanguage } from "./profiles";
import { parseTSC } from "./parsers/tsc";
import { parseZPL } from "./parsers/zpl";
import { parseEPL } from "./parsers/epl";
import { parseCPCL } from "./parsers/cpcl";
import { parseDPL } from "./parsers/dpl";
import { parseSBPL } from "./parsers/sbpl";
import { parseIPL } from "./parsers/ipl";
import { compileToTSC } from "./languages/tsc";
import { compileToZPL } from "./languages/zpl";
import { compileToEPL } from "./languages/epl";
import { compileToESCPOS } from "./languages/escpos";
import { compileToCPCL } from "./languages/cpcl";
import { compileToDPL } from "./languages/dpl";
import { compileToSBPL } from "./languages/sbpl";
import { compileToStarPRNT } from "./languages/starprnt";
import { compileToIPL } from "./languages/ipl";

/** Source languages that can be parsed */
export type SourceLanguage = "tsc" | "zpl" | "epl" | "cpcl" | "dpl" | "sbpl" | "ipl";

/** Target languages that can be compiled to */
export type TargetLanguage = PrinterLanguage;

/** Conversion result */
export interface ConvertResult {
  /** Converted output (string for text-based, Uint8Array for binary) */
  output: string | Uint8Array;
  /** Elements extracted from source */
  elements: LabelElement[];
  /** Label dimensions from source */
  widthDots: number;
  heightDots: number;
  /** Warnings during conversion */
  warnings: string[];
}

/**
 * Parse source code into elements.
 */
function parseSource(
  code: string,
  from: SourceLanguage,
): { elements: LabelElement[]; widthDots: number; heightDots: number; warnings: string[] } {
  switch (from) {
    case "tsc": {
      const r = parseTSC(code);
      return {
        elements: r.elements,
        widthDots: r.widthDots,
        heightDots: r.heightDots,
        warnings: [],
      };
    }
    case "zpl": {
      const r = parseZPL(code);
      return {
        elements: r.elements,
        widthDots: r.widthDots,
        heightDots: r.heightDots,
        warnings: r.warnings,
      };
    }
    case "epl": {
      const r = parseEPL(code);
      return {
        elements: r.elements,
        widthDots: r.widthDots,
        heightDots: r.heightDots || 240,
        warnings: r.warnings,
      };
    }
    case "cpcl": {
      const r = parseCPCL(code);
      return {
        elements: r.elements,
        widthDots: r.widthDots,
        heightDots: r.heightDots,
        warnings: r.warnings,
      };
    }
    case "dpl": {
      const r = parseDPL(code);
      return {
        elements: r.elements,
        widthDots: r.widthDots,
        heightDots: 240,
        warnings: r.warnings,
      };
    }
    case "sbpl": {
      const r = parseSBPL(code);
      return { elements: r.elements, widthDots: 320, heightDots: 240, warnings: r.warnings };
    }
    case "ipl": {
      const r = parseIPL(code);
      return {
        elements: r.elements,
        widthDots: r.widthDots,
        heightDots: r.heightDots,
        warnings: r.warnings,
      };
    }
  }
}

/**
 * Compile elements to target language.
 */
function compileTarget(resolved: ResolvedLabel, to: TargetLanguage): string | Uint8Array {
  switch (to) {
    case "tsc":
      return compileToTSC(resolved);
    case "zpl":
      return compileToZPL(resolved);
    case "epl":
      return compileToEPL(resolved);
    case "escpos":
      return compileToESCPOS(resolved);
    case "cpcl":
      return compileToCPCL(resolved);
    case "dpl":
      return compileToDPL(resolved);
    case "sbpl":
      return compileToSBPL(resolved);
    case "starprnt":
      return compileToStarPRNT(resolved);
    case "ipl":
      return compileToIPL(resolved);
  }
}

/**
 * Convert printer commands from one language to another.
 *
 * @example
 * ```ts
 * // Convert TSC label to ZPL
 * const result = convert(tscCode, "tsc", "zpl");
 * console.log(result.output); // ZPL string
 *
 * // Convert ZPL to ESC/POS
 * const result = convert(zplCode, "zpl", "escpos");
 * console.log(result.output); // Uint8Array
 * ```
 */
export function convert(
  code: string,
  from: SourceLanguage,
  to: TargetLanguage,
  options: { dpi?: number; speed?: number; density?: number; copies?: number } = {},
): ConvertResult {
  const parsed = parseSource(code, from);

  const resolved: ResolvedLabel = {
    widthDots: parsed.widthDots,
    heightDots: parsed.heightDots,
    dpi: options.dpi ?? 203,
    gapDots: 24,
    speed: options.speed ?? 4,
    density: options.density ?? 8,
    direction: 0,
    copies: options.copies ?? 1,
    elements: parsed.elements,
  };

  const output = compileTarget(resolved, to);

  return {
    output,
    elements: parsed.elements,
    widthDots: parsed.widthDots,
    heightDots: parsed.heightDots,
    warnings: parsed.warnings,
  };
}

/** List all supported conversion paths */
export const SUPPORTED_SOURCES: SourceLanguage[] = [
  "tsc",
  "zpl",
  "epl",
  "cpcl",
  "dpl",
  "sbpl",
  "ipl",
];
export const SUPPORTED_TARGETS: TargetLanguage[] = [
  "tsc",
  "zpl",
  "epl",
  "escpos",
  "cpcl",
  "dpl",
  "sbpl",
  "starprnt",
  "ipl",
];
