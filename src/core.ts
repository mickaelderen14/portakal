/**
 * Core module — label builder without any language compilers.
 * Import this for tree-shaking: only the languages you import will be bundled.
 *
 * @example
 * ```ts
 * import { label } from "portakal/core";
 * import { tsc } from "portakal/tsc";
 *
 * const myLabel = label({ width: 40, height: 30 })
 *   .text("Hello", { x: 10, y: 10 });
 *
 * const code = tsc.compile(myLabel);
 * ```
 */

export { LabelBuilder, label } from "./builder";
export type {
  Alignment,
  BoxOptions,
  CircleOptions,
  DitherAlgorithm,
  EllipseOptions,
  EraseOptions,
  ImageOptions,
  LabelConfig,
  LabelElement,
  LineOptions,
  MonochromeBitmap,
  ResolvedLabel,
  ReverseOptions,
  Rotation,
  TextOptions,
  Unit,
} from "./types";
