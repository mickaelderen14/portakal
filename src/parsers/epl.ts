import type { LabelElement } from "../types";

/**
 * EPL2 Parser — converts EPL commands back to structured data.
 * Based on EPL2 Programmer's Manual (Zebra P/N 980371-001).
 * Line-based language: each command is one line terminated by LF.
 */

export interface EPLParseResult {
  commands: { cmd: string; raw: string }[];
  widthDots: number;
  heightDots: number;
  elements: LabelElement[];
  warnings: string[];
}

export function parseEPL(code: string): EPLParseResult {
  const commands: { cmd: string; raw: string }[] = [];
  const elements: LabelElement[] = [];
  const warnings: string[] = [];
  let widthDots = 832;
  let heightDots = 0;

  for (const rawLine of code.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const cmdChar = line[0];
    const rest = line.slice(1).trim();
    commands.push({ cmd: cmdChar, raw: rest });

    switch (cmdChar) {
      case "N":
        break;

      case "q":
        widthDots = Number(rest) || widthDots;
        break;

      case "Q": {
        const parts = rest.split(",");
        heightDots = Number(parts[0]) || heightDots;
        break;
      }

      case "A": {
        // A x,y,rotation,font,h_mul,v_mul,N|R,"data"
        const match = line.match(/^A(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),([NR]),"([^"]*)"/);
        if (match) {
          elements.push({
            type: "text",
            content: match[8],
            options: {
              x: Number(match[1]),
              y: Number(match[2]),
              rotation: (Number(match[3]) * 90) as any,
              font: match[4],
              size: Number(match[5]),
              reverse: match[7] === "R" || undefined,
            },
          });
        }
        break;
      }

      case "X": {
        // X x1,y1,x2,y2,thickness
        const parts = rest.split(",").map(Number);
        if (parts.length >= 5) {
          elements.push({
            type: "box",
            options: {
              x: parts[0],
              y: parts[1],
              width: parts[2] - parts[0],
              height: parts[3] - parts[1],
              thickness: parts[4],
            },
          });
        }
        break;
      }

      case "L": {
        // LO x,y,width,height (black line)
        if (rest.startsWith("O")) {
          const parts = rest.slice(1).split(",").map(Number);
          if (parts.length >= 4) {
            elements.push({
              type: "line",
              options: {
                x1: parts[0],
                y1: parts[1],
                x2: parts[0] + parts[2],
                y2: parts[1] + (parts[3] > parts[2] ? parts[3] : 0),
                thickness: Math.min(parts[2], parts[3]),
              },
            });
          }
        }
        break;
      }

      case "P": {
        // Print
        break;
      }

      case "B":
      case "b":
      case "G": // GW graphics
      case "S": // Speed
      case "D": // Density
      case "R": // Reference
      case "Z": // ZT/ZB orientation
      case "O": // Options
      case "J": // JF/JB feed
      case "f": // Form feed
      case "r": // Black mark mode
      case "I": // Info
      case "U": // Status
      case "W": // Windows mode
      case "e": // Error reporting
      case "E": // Font operations
      case "F": // Format operations
      case "K": // Kill file
      case "M": // Memory allocation
      case "V": // Variable
      case "C": // Counter
        break;
    }
  }

  return { commands, widthDots, heightDots, elements, warnings };
}
