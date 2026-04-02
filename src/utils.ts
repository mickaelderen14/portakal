import type { Unit } from "./types";

/** Convert a measurement to dots based on unit and DPI */
export function toDots(value: number, unit: Unit, dpi: number): number {
  switch (unit) {
    case "dot":
      return Math.round(value);
    case "mm":
      return Math.round(value * (dpi / 25.4));
    case "inch":
      return Math.round(value * dpi);
  }
}
