/**
 * CPCL language module — compile, parse, preview, validate.
 * Font table from Zebra CPCL Font Manual (ZQ210/ZQ220).
 * EG image polarity: NORMAL (1=black, 0=white).
 */

import type { LabelBuilder } from "../builder";
import type { LabelElement, ResolvedLabel } from "../types";
import { compileToCPCL } from "../languages/cpcl";
import { parseCPCL } from "../parsers/cpcl";

const CPCL_FONTS: Record<string, { w: number; h: number }> = {
  "0": { w: 8, h: 9 },
  "1": { w: 16, h: 48 },
  "2": { w: 20, h: 12 },
  "4": { w: 25, h: 47 },
  "5": { w: 16, h: 24 },
  "6": { w: 28, h: 27 },
  "7": { w: 12, h: 24 },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cpclFontSize(font: string | undefined, size: number | undefined): number {
  const f = CPCL_FONTS[font ?? "2"];
  return f ? f.h * Math.max(1, size ?? 1) : (size ?? 1) * 12;
}

function renderElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const fs = cpclFontSize(o.font, o.size);
      return `<text x="${x}" y="${y + fs * 0.85}" fill="#000" font-size="${fs}" font-family="monospace">${escapeXml(el.content)}</text>`;
    }
    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `<rect x="${o.x + t / 2}" y="${o.y + t / 2}" width="${o.width - t}" height="${o.height - t}" fill="none" stroke="#000" stroke-width="${t}"/>`;
    }
    case "line": {
      const o = el.options;
      return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="#000" stroke-width="${o.thickness ?? 1}"/>`;
    }
    default:
      return "";
  }
}

function renderPreviewSVG(resolved: ResolvedLabel): string {
  const w = resolved.widthDots;
  const h = resolved.heightDots > 0 ? resolved.heightDots : 400;
  const pad = 10;
  let els = "";
  for (const el of resolved.elements) els += renderElement(el);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + pad * 2} ${h + pad * 2}" width="${w + pad * 2}" height="${h + pad * 2}"><rect x="0" y="0" width="${w + pad * 2}" height="${h + pad * 2}" fill="#f5f5f4" rx="4"/><rect x="${pad}" y="${pad}" width="${w}" height="${h}" fill="#fff" stroke="#e5e5e5" stroke-width="1" rx="2"/><g transform="translate(${pad},${pad})">${els}</g><text x="${(w + pad * 2) / 2}" y="${h + pad * 2 - 1}" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="monospace">${w}×${h} dots — CPCL</text></svg>`;
}

export const cpcl = {
  compile(builder: LabelBuilder): string {
    return compileToCPCL(builder.resolve());
  },
  parse(code: string) {
    return parseCPCL(code);
  },
  preview(builder: LabelBuilder): string {
    return renderPreviewSVG(builder.resolve());
  },
  previewResolved(resolved: ResolvedLabel): string {
    return renderPreviewSVG(resolved);
  },
};
