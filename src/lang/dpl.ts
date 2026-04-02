/**
 * DPL (Datamax/Honeywell) language module.
 * Fonts: 0-8 bitmap (5x7 to 24x32) + 9 scalable.
 */

import type { LabelBuilder } from "../builder";
import type { ResolvedLabel } from "../types";
import { compileToDPL } from "../languages/dpl";
import { parseDPL } from "../parsers/dpl";
import { renderPreview } from "../preview";

export const dpl = {
  compile(builder: LabelBuilder): string {
    return compileToDPL(builder.resolve());
  },
  parse(code: string) {
    return parseDPL(code);
  },
  preview(builder: LabelBuilder): string {
    return renderPreview(builder.resolve());
  },
  previewResolved(resolved: ResolvedLabel): string {
    return renderPreview(resolved);
  },
};
