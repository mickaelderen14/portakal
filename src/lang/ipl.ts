/**
 * IPL (Intermec/Honeywell) language module.
 * STX/ETX framing, H/B/L/W/G field types.
 */

import type { LabelBuilder } from "../builder";
import type { ResolvedLabel } from "../types";
import { compileToIPL } from "../languages/ipl";
import { parseIPL } from "../parsers/ipl";
import { renderPreview } from "../preview";

export const ipl = {
  compile(builder: LabelBuilder): string {
    return compileToIPL(builder.resolve());
  },
  parse(code: string) {
    return parseIPL(code);
  },
  preview(builder: LabelBuilder): string {
    return renderPreview(builder.resolve());
  },
  previewResolved(resolved: ResolvedLabel): string {
    return renderPreview(resolved);
  },
};
