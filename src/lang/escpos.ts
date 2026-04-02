/**
 * ESC/POS language module.
 * Receipt-style: line-by-line, no x/y positioning.
 * Preview renders as receipt (monospace text lines).
 */

import type { LabelBuilder } from "../builder";
import type { LabelElement, ResolvedLabel } from "../types";
import { compileToESCPOS } from "../languages/escpos";
import { parseESCPOS } from "../parsers/escpos";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** ESC/POS preview — receipt style (no absolute positioning) */
function renderReceiptSVG(resolved: ResolvedLabel): string {
  const w = resolved.widthDots > 0 ? resolved.widthDots : 576;
  const lineH = 24;
  let y = 10;
  let svg = "";

  for (const el of resolved.elements) {
    if (el.type === "text") {
      const fs = (el.options.size ?? 1) * 12;
      const align = el.options.align ?? "left";
      const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
      const tx = align === "center" ? w / 2 : align === "right" ? w - 5 : 5;
      const weight = el.options.bold ? "bold" : "normal";
      const decoration = el.options.underline ? ' text-decoration="underline"' : "";

      if (el.options.reverse) {
        svg += `<rect x="0" y="${y}" width="${w}" height="${fs + 4}" fill="#000"/>`;
        svg += `<text x="${tx}" y="${y + fs}" fill="#fff" font-size="${fs}" font-weight="${weight}" font-family="monospace" text-anchor="${anchor}"${decoration}>${escapeXml(el.content)}</text>`;
      } else {
        svg += `<text x="${tx}" y="${y + fs}" fill="#000" font-size="${fs}" font-weight="${weight}" font-family="monospace" text-anchor="${anchor}"${decoration}>${escapeXml(el.content)}</text>`;
      }
      y += fs + 4;
    }
  }

  const h = Math.max(y + 10, 200);
  const pad = 5;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + pad * 2} ${h + pad * 2}" width="${w + pad * 2}" height="${h + pad * 2}"><rect x="0" y="0" width="${w + pad * 2}" height="${h + pad * 2}" fill="#f5f5f0" rx="2"/><rect x="${pad}" y="${pad}" width="${w}" height="${h}" fill="#fff" stroke="#e5e5e5" stroke-width="1"/><g transform="translate(${pad},${pad})">${svg}</g><text x="${(w + pad * 2) / 2}" y="${h + pad * 2 - 1}" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="monospace">${w} dots — ESC/POS</text></svg>`;
}

export const escpos = {
  compile(builder: LabelBuilder): Uint8Array {
    return compileToESCPOS(builder.resolve());
  },
  parse(data: Uint8Array) {
    return parseESCPOS(data);
  },
  preview(builder: LabelBuilder): string {
    return renderReceiptSVG(builder.resolve());
  },
  previewResolved(resolved: ResolvedLabel): string {
    return renderReceiptSVG(resolved);
  },
};
