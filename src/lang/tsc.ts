/**
 * TSC/TSPL2 language module — compile, parse, preview, validate.
 * Each function uses TSC-specific font tables and rendering rules.
 *
 * @example
 * ```ts
 * import { label } from "portakal/core";
 * import { tsc } from "portakal/lang/tsc";
 *
 * const myLabel = label({ width: 40, height: 30 }).text("Hello", { x: 10, y: 10 });
 * const code = tsc.compile(myLabel);
 * const svg = tsc.preview(myLabel);
 * ```
 */

import type { LabelBuilder } from "../builder";
import type { LabelElement, ResolvedLabel } from "../types";
import { compileToTSC } from "../languages/tsc";
import { parseTSC, parseTSPL } from "../parsers/tsc";
import { validate } from "../validate";

/** TSC font pixel dimensions: { width, height } */
const TSC_FONTS: Record<string, { w: number; h: number }> = {
  "1": { w: 8, h: 12 },
  "2": { w: 12, h: 20 },
  "3": { w: 16, h: 24 },
  "4": { w: 24, h: 32 },
  "5": { w: 32, h: 48 },
  "6": { w: 14, h: 19 },
  "7": { w: 21, h: 27 },
  "8": { w: 14, h: 25 },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tscFontSize(font: string | undefined, size: number | undefined, yScale?: number): number {
  if (yScale && yScale > 1) {
    const base = TSC_FONTS[font ?? "2"];
    if (base) return base.h * yScale;
  }
  const f = TSC_FONTS[font ?? "2"];
  if (f) return f.h * (size ?? 1);
  // Font "0" or TTF: size is in points, 1pt ≈ 2.82 dots at 203 DPI
  return (size ?? 12) * 2.82;
}

function tscCharWidth(font: string | undefined, size: number | undefined, xScale?: number): number {
  const f = TSC_FONTS[font ?? "2"];
  if (f) return f.w * (xScale ?? size ?? 1);
  return (size ?? 12) * 1.7; // approximate for TTF
}

function renderElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const fs = tscFontSize(o.font, o.size, o.yScale);
      const cw = tscCharWidth(o.font, o.size, o.xScale);
      const weight = o.bold ? "bold" : "normal";
      const transform = o.rotation ? ` transform="rotate(${o.rotation} ${x} ${y})"` : "";

      if (o.reverse) {
        const tw = el.content.length * cw;
        return (
          `<rect x="${x - 1}" y="${y - 1}" width="${tw + 2}" height="${fs + 2}" fill="#000"/>` +
          `<text x="${x}" y="${y + fs * 0.85}" fill="#fff" font-size="${fs}" font-weight="${weight}" font-family="monospace"${transform}>${escapeXml(el.content)}</text>`
        );
      }

      return `<text x="${x}" y="${y + fs * 0.85}" fill="#000" font-size="${fs}" font-weight="${weight}" font-family="monospace"${transform}>${escapeXml(el.content)}</text>`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      const w = o.width ?? bmp.width;
      const h = o.height ?? bmp.height;
      const step = Math.max(1, Math.floor(Math.max(bmp.width, bmp.height) / 100));
      const sx = w / bmp.width;
      const sy = h / bmp.height;
      let svg = "";
      for (let py = 0; py < bmp.height; py += step) {
        for (let px = 0; px < bmp.width; px += step) {
          const byteIdx = py * bmp.bytesPerRow + Math.floor(px / 8);
          const bitIdx = 7 - (px % 8);
          if ((bmp.data[byteIdx] >> bitIdx) & 1) {
            svg += `<rect x="${x + px * sx}" y="${y + py * sy}" width="${step * sx}" height="${step * sy}" fill="#000"/>`;
          }
        }
      }
      return svg;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const rx = o.radius ?? 0;
      // TSC BOX: coordinates are outer boundary, border draws inward
      if (t >= Math.min(o.width, o.height)) {
        return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#000" rx="${rx}"/>`;
      }
      return `<rect x="${o.x + t / 2}" y="${o.y + t / 2}" width="${o.width - t}" height="${o.height - t}" fill="none" stroke="#000" stroke-width="${t}" rx="${rx}"/>`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      // TSC BAR: filled rectangle
      if (o.y1 === o.y2) {
        return `<rect x="${Math.min(o.x1, o.x2)}" y="${o.y1}" width="${Math.abs(o.x2 - o.x1)}" height="${t}" fill="#000"/>`;
      }
      if (o.x1 === o.x2) {
        return `<rect x="${o.x1}" y="${Math.min(o.y1, o.y2)}" width="${t}" height="${Math.abs(o.y2 - o.y1)}" fill="#000"/>`;
      }
      return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="#000" stroke-width="${t}"/>`;
    }

    case "circle": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const r = o.diameter / 2;
      if (t >= r) return `<circle cx="${o.x + r}" cy="${o.y + r}" r="${r}" fill="#000"/>`;
      return `<circle cx="${o.x + r}" cy="${o.y + r}" r="${r - t / 2}" fill="none" stroke="#000" stroke-width="${t}"/>`;
    }

    case "ellipse": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `<ellipse cx="${o.x + o.width / 2}" cy="${o.y + o.height / 2}" rx="${o.width / 2}" ry="${o.height / 2}" fill="none" stroke="#000" stroke-width="${t}"/>`;
    }

    case "reverse": {
      const o = el.options;
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#000"/>`;
    }

    case "erase": {
      const o = el.options;
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#fff"/>`;
    }

    case "raw":
      return "";
  }
}

function renderPreviewSVG(resolved: ResolvedLabel): string {
  const w = resolved.widthDots;
  const h = resolved.heightDots > 0 ? resolved.heightDots : 400;
  const pad = 10;
  const svgW = w + pad * 2;
  const svgH = h + pad * 2;

  let els = "";
  for (const el of resolved.elements) els += renderElement(el);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">`,
    `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#f5f5f4" rx="4"/>`,
    `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" fill="#fff" stroke="#e5e5e5" stroke-width="1" rx="2"/>`,
    `<g transform="translate(${pad},${pad})">`,
    els,
    "</g>",
    `<text x="${svgW / 2}" y="${svgH - 1}" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="monospace">${w}×${h} dots (${resolved.dpi} DPI) — TSC</text>`,
    "</svg>",
  ].join("\n");
}

/** TSC language module */
export const tsc = {
  /** Compile label to TSC/TSPL2 commands */
  compile(builder: LabelBuilder): string {
    return compileToTSC(builder.resolve());
  },

  /** Parse TSC commands to structured data */
  parse(code: string) {
    return parseTSPL(code);
  },

  /** Parse TSC commands to simple elements (for preview) */
  parseSimple(code: string) {
    return parseTSC(code);
  },

  /** Render label preview with TSC-specific font metrics */
  preview(builder: LabelBuilder): string {
    return renderPreviewSVG(builder.resolve());
  },

  /** Render from resolved label */
  previewResolved(resolved: ResolvedLabel): string {
    return renderPreviewSVG(resolved);
  },

  /** Validate TSC commands */
  validate(code: string) {
    return validate(code, "tsc");
  },
};
