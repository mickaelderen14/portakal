/**
 * SBPL (SATO) language module.
 * Uses ESC prefix, K9B text output.
 */

import type { LabelBuilder } from "../builder";
import type { ResolvedLabel } from "../types";
import { compileToSBPL } from "../languages/sbpl";
import { parseSBPL } from "../parsers/sbpl";
import { renderPreview } from "../preview";

export const sbpl = {
  compile(builder: LabelBuilder): string {
    return compileToSBPL(builder.resolve());
  },
  parse(code: string) {
    return parseSBPL(code);
  },
  preview(builder: LabelBuilder): string {
    return renderPreview(builder.resolve());
  },
  previewResolved(resolved: ResolvedLabel): string {
    return renderPreview(resolved);
  },
};
