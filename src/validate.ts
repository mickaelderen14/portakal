/**
 * Printer command validator — checks parameter ranges, command order, data validity.
 */

import { parseTSPL } from "./parsers/tsc";
import { parseZPL } from "./parsers/zpl";
import type { SourceLanguage } from "./convert";

export interface ValidationIssue {
  /** Severity */
  level: "error" | "warning" | "info";
  /** Line number (1-based, if applicable) */
  line?: number;
  /** Command that caused the issue */
  command?: string;
  /** Issue description */
  message: string;
}

export interface ValidationResult {
  /** Is the input valid (no errors)? */
  valid: boolean;
  /** All issues found */
  issues: ValidationIssue[];
  /** Summary counts */
  errors: number;
  warnings: number;
  infos: number;
}

/**
 * Validate printer commands.
 */
export function validate(code: string, language: SourceLanguage): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!code.trim()) {
    issues.push({ level: "error", message: "Empty input" });
    return { valid: false, issues, errors: 1, warnings: 0, infos: 0 };
  }

  switch (language) {
    case "tsc":
      validateTSC(code, issues);
      break;
    case "zpl":
      validateZPL(code, issues);
      break;
    default:
      issues.push({
        level: "info",
        message: `Validation for ${language.toUpperCase()} is basic — only structure checks`,
      });
      break;
  }

  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  const infos = issues.filter((i) => i.level === "info").length;

  return { valid: errors === 0, issues, errors, warnings, infos };
}

function validateTSC(code: string, issues: ValidationIssue[]): void {
  const result = parseTSPL(code);
  const cmds = result.commands;

  // Check: SIZE should be first non-comment command
  const firstCmd = cmds.find((c) => c.cmd !== "UNKNOWN" && c.cmd !== "REM");
  if (firstCmd && firstCmd.cmd !== "SIZE") {
    issues.push({ level: "warning", command: "SIZE", message: "SIZE should be the first command" });
  }

  // Check: CLS before label elements
  const clsIdx = cmds.findIndex((c) => c.cmd === "CLS");
  const firstElement = cmds.findIndex((c) =>
    [
      "TEXT",
      "BLOCK",
      "BAR",
      "BOX",
      "CIRCLE",
      "ELLIPSE",
      "BITMAP",
      "BARCODE",
      "QRCODE",
      "DMATRIX",
      "PDF417",
      "AZTEC",
      "MAXICODE",
      "RSS",
    ].includes(c.cmd),
  );
  if (firstElement >= 0 && (clsIdx < 0 || clsIdx > firstElement)) {
    issues.push({
      level: "error",
      command: "CLS",
      message: "CLS must appear before label elements (TEXT, BOX, etc.)",
    });
  }

  // Check: PRINT at end
  const printIdx = cmds.findIndex((c) => c.cmd === "PRINT");
  if (printIdx < 0) {
    issues.push({
      level: "warning",
      command: "PRINT",
      message: "No PRINT command found — label will not print",
    });
  }

  // Check: DENSITY range
  for (const c of cmds) {
    if (c.cmd === "DENSITY") {
      const v = (c as any).value;
      if (v < 0 || v > 15) {
        issues.push({
          level: "error",
          command: "DENSITY",
          message: `DENSITY value ${v} out of range (0-15)`,
        });
      }
    }
    if (c.cmd === "SPEED") {
      const v = (c as any).value;
      if (v < 1 || v > 18) {
        issues.push({
          level: "warning",
          command: "SPEED",
          message: `SPEED value ${v} may be out of range (1-18, model-dependent)`,
        });
      }
    }
    if (c.cmd === "UNKNOWN") {
      issues.push({
        level: "warning",
        command: (c as any).raw?.slice(0, 20),
        message: `Unrecognized command: ${(c as any).raw?.slice(0, 40)}`,
      });
    }
  }
}

function validateZPL(code: string, issues: ValidationIssue[]): void {
  const result = parseZPL(code);
  const cmds = result.commands;

  // Check: ^XA at start
  if (cmds.length === 0 || cmds[0].code !== "^XA") {
    issues.push({ level: "error", command: "^XA", message: "Label must start with ^XA" });
  }

  // Check: ^XZ at end
  if (cmds.length === 0 || cmds[cmds.length - 1].code !== "^XZ") {
    issues.push({ level: "error", command: "^XZ", message: "Label must end with ^XZ" });
  }

  // Check: ^FD without preceding ^FO
  let hasFieldOrigin = false;
  for (const c of cmds) {
    if (c.code === "^FO" || c.code === "^FT") hasFieldOrigin = true;
    if (c.code === "^FD" && !hasFieldOrigin) {
      issues.push({
        level: "warning",
        command: "^FD",
        message: "^FD without preceding ^FO — field position undefined",
      });
    }
    if (c.code === "^FS") hasFieldOrigin = false;
  }

  // Check: ^PW range
  const pw = cmds.find((c) => c.code === "^PW");
  if (pw && pw.params[0]) {
    const w = Number(pw.params[0]);
    if (w < 2 || w > 65535) {
      issues.push({
        level: "error",
        command: "^PW",
        message: `^PW value ${w} out of range (2-65535)`,
      });
    }
  }

  // Warnings
  for (const w of result.warnings) {
    issues.push({ level: "warning", message: w });
  }
}
