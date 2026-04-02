/**
 * EPL2 language module — compile, parse, preview, validate.
 * Font table from EPL2 Programmer's Manual (Zebra P/N 980371-001).
 * GW image polarity: INVERTED (0=black, 1=white).
 */

import type { LabelBuilder } from "../builder";
import type { LabelElement, ResolvedLabel } from "../types";
import { compileToEPL } from "../languages/epl";
import { parseEPL } from "../parsers/epl";

const EPL_FONTS: Record<string, { w: number; h: number }> = {
  "1": { w: 8, h: 12 },
  "2": { w: 10, h: 16 },
  "3": { w: 12, h: 20 },
  "4": { w: 14, h: 24 },
  "5": { w: 32, h: 48 },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function eplFontSize(font: string | undefined, size: number | undefined): number {
  const f = EPL_FONTS[font ?? "2"];
  return f ? f.h * (size ?? 1) : (size ?? 1) * 16;
}

function eplCharWidth(font: string | undefined, size: number | undefined): number {
  const f = EPL_FONTS[font ?? "2"];
  return f ? f.w * (size ?? 1) : (size ?? 1) * 10;
}

function renderElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const fs = eplFontSize(o.font, o.size);
      const cw = eplCharWidth(o.font, o.size);
      const rotation = o.rotation ? ` transform="rotate(${o.rotation} ${x} ${y})"` : "";
      if (o.reverse) {
        const tw = el.content.length * cw;
        return `<rect x="${x - 1}" y="${y - 1}" width="${tw + 2}" height="${fs + 2}" fill="#000"/><text x="${x}" y="${y + fs * 0.85}" fill="#fff" font-size="${fs}" font-family="monospace"${rotation}>${escapeXml(el.content)}</text>`;
      }
      return `<text x="${x}" y="${y + fs * 0.85}" fill="#000" font-size="${fs}" font-family="monospace"${rotation}>${escapeXml(el.content)}</text>`;
    }
    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (t >= Math.min(o.width, o.height))
        return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#000"/>`;
      return `<rect x="${o.x + t / 2}" y="${o.y + t / 2}" width="${o.width - t}" height="${o.height - t}" fill="none" stroke="#000" stroke-width="${t}"/>`;
    }
    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2)
        return `<rect x="${Math.min(o.x1, o.x2)}" y="${o.y1}" width="${Math.abs(o.x2 - o.x1)}" height="${t}" fill="#000"/>`;
      if (o.x1 === o.x2)
        return `<rect x="${o.x1}" y="${Math.min(o.y1, o.y2)}" width="${t}" height="${Math.abs(o.y2 - o.y1)}" fill="#000"/>`;
      return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="#000" stroke-width="${t}"/>`;
    }
    case "circle":
    case "ellipse":
    case "reverse":
    case "erase":
    case "image":
    case "raw":
      return "";
  }
}

function renderPreviewSVG(resolved: ResolvedLabel): string {
  const w = resolved.widthDots;
  const h = resolved.heightDots > 0 ? resolved.heightDots : 400;
  const pad = 10;
  let els = "";
  for (const el of resolved.elements) els += renderElement(el);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + pad * 2} ${h + pad * 2}" width="${w + pad * 2}" height="${h + pad * 2}"><rect x="0" y="0" width="${w + pad * 2}" height="${h + pad * 2}" fill="#f5f5f4" rx="4"/><rect x="${pad}" y="${pad}" width="${w}" height="${h}" fill="#fff" stroke="#e5e5e5" stroke-width="1" rx="2"/><g transform="translate(${pad},${pad})">${els}</g><text x="${(w + pad * 2) / 2}" y="${h + pad * 2 - 1}" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="monospace">${w}×${h} dots — EPL</text></svg>`;
}

export const epl = {
  compile(builder: LabelBuilder): string {
    return compileToEPL(builder.resolve());
  },
  parse(code: string) {
    return parseEPL(code);
  },
  preview(builder: LabelBuilder): string {
    return renderPreviewSVG(builder.resolve());
  },
  previewResolved(resolved: ResolvedLabel): string {
    return renderPreviewSVG(resolved);
  },
};
