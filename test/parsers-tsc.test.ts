import { describe, expect, it } from "vitest";
import { parseTSC, parseTSPL, type TSPLCommand } from "../src/parsers/tsc";

function cmd(code: string): TSPLCommand {
  return parseTSPL(code).commands[0];
}

describe("parseTSPL — Setup Commands", () => {
  it("parses SIZE with mm", () => {
    const c = cmd("SIZE 40 mm,30 mm");
    expect(c).toMatchObject({ cmd: "SIZE", widthMM: 40, heightMM: 30, unit: "mm" });
  });

  it("parses SIZE with inches", () => {
    const c = cmd("SIZE 4,3");
    expect(c).toMatchObject({ cmd: "SIZE", widthMM: 4, heightMM: 3, unit: "inch" });
  });

  it("parses SIZE with dots", () => {
    const c = cmd("SIZE 320 dot,240 dot");
    expect(c).toMatchObject({ cmd: "SIZE", widthMM: 320, heightMM: 240, unit: "dot" });
  });

  it("parses GAP", () => {
    const c = cmd("GAP 3 mm,0 mm");
    expect(c).toMatchObject({ cmd: "GAP", distanceMM: 3, offsetMM: 0 });
  });

  it("parses GAPDETECT without params", () => {
    expect(cmd("GAPDETECT")).toMatchObject({ cmd: "GAPDETECT" });
  });

  it("parses GAPDETECT with params", () => {
    expect(cmd("GAPDETECT 200,30")).toMatchObject({ cmd: "GAPDETECT", paperLen: 200, gapLen: 30 });
  });

  it("parses BLINEDETECT", () => {
    expect(cmd("BLINEDETECT")).toMatchObject({ cmd: "BLINEDETECT" });
  });

  it("parses AUTODETECT", () => {
    expect(cmd("AUTODETECT 400,20")).toMatchObject({
      cmd: "AUTODETECT",
      paperLen: 400,
      gapLen: 20,
    });
  });

  it("parses BLINE", () => {
    expect(cmd("BLINE 2 mm,0 mm")).toMatchObject({ cmd: "BLINE", height: 2, offset: 0 });
  });

  it("parses OFFSET", () => {
    expect(cmd("OFFSET 0.5 mm")).toMatchObject({ cmd: "OFFSET", distance: 0.5, unit: "mm" });
  });

  it("parses SPEED", () => {
    expect(cmd("SPEED 4")).toMatchObject({ cmd: "SPEED", value: 4 });
  });

  it("parses SPEED decimal", () => {
    expect(cmd("SPEED 2.5")).toMatchObject({ cmd: "SPEED", value: 2.5 });
  });

  it("parses DENSITY", () => {
    expect(cmd("DENSITY 8")).toMatchObject({ cmd: "DENSITY", value: 8 });
  });

  it("parses DIRECTION without mirror", () => {
    expect(cmd("DIRECTION 0")).toMatchObject({ cmd: "DIRECTION", direction: 0 });
  });

  it("parses DIRECTION with mirror", () => {
    expect(cmd("DIRECTION 1,1")).toMatchObject({ cmd: "DIRECTION", direction: 1, mirror: 1 });
  });

  it("parses REFERENCE", () => {
    expect(cmd("REFERENCE 10,20")).toMatchObject({ cmd: "REFERENCE", x: 10, y: 20 });
  });

  it("parses SHIFT with y only", () => {
    expect(cmd("SHIFT 5")).toMatchObject({ cmd: "SHIFT", y: 5 });
  });

  it("parses SHIFT with x,y", () => {
    expect(cmd("SHIFT 10,20")).toMatchObject({ cmd: "SHIFT", x: 10, y: 20 });
  });

  it("parses COUNTRY", () => {
    expect(cmd("COUNTRY 001")).toMatchObject({ cmd: "COUNTRY", code: "001" });
  });

  it("parses CODEPAGE", () => {
    expect(cmd("CODEPAGE 437")).toMatchObject({ cmd: "CODEPAGE", codepage: "437" });
  });

  it("parses CODEPAGE UTF-8", () => {
    expect(cmd("CODEPAGE UTF-8")).toMatchObject({ cmd: "CODEPAGE", codepage: "UTF-8" });
  });

  it("parses CLS", () => {
    expect(cmd("CLS")).toMatchObject({ cmd: "CLS" });
  });

  it("parses FEED", () => {
    expect(cmd("FEED 100")).toMatchObject({ cmd: "FEED", dots: 100 });
  });

  it("parses BACKFEED", () => {
    expect(cmd("BACKFEED 50")).toMatchObject({ cmd: "BACKFEED", dots: 50 });
  });

  it("parses BACKUP (TSPL alias)", () => {
    expect(cmd("BACKUP 50")).toMatchObject({ cmd: "BACKUP", dots: 50 });
  });

  it("parses FORMFEED", () => {
    expect(cmd("FORMFEED")).toMatchObject({ cmd: "FORMFEED" });
  });

  it("parses HOME", () => {
    expect(cmd("HOME")).toMatchObject({ cmd: "HOME" });
  });

  it("parses PRINT with sets only", () => {
    expect(cmd("PRINT 1")).toMatchObject({ cmd: "PRINT", sets: 1 });
  });

  it("parses PRINT with sets and copies", () => {
    expect(cmd("PRINT 3,2")).toMatchObject({ cmd: "PRINT", sets: 3, copies: 2 });
  });

  it("parses SOUND", () => {
    expect(cmd("SOUND 5,100")).toMatchObject({ cmd: "SOUND", level: 5, interval: 100 });
  });

  it("parses CUT", () => {
    expect(cmd("CUT")).toMatchObject({ cmd: "CUT" });
  });

  it("parses LIMITFEED", () => {
    expect(cmd("LIMITFEED 10")).toMatchObject({ cmd: "LIMITFEED", maxLen: 10 });
  });

  it("parses SELFTEST", () => {
    expect(cmd("SELFTEST")).toMatchObject({ cmd: "SELFTEST" });
  });

  it("parses SELFTEST with page", () => {
    expect(cmd("SELFTEST PATTERN")).toMatchObject({ cmd: "SELFTEST", page: "PATTERN" });
  });

  it("parses EOJ", () => {
    expect(cmd("EOJ")).toMatchObject({ cmd: "EOJ" });
  });

  it("parses DELAY", () => {
    expect(cmd("DELAY 500")).toMatchObject({ cmd: "DELAY", ms: 500 });
  });

  it("parses INITIALPRINTER", () => {
    expect(cmd("INITIALPRINTER")).toMatchObject({ cmd: "INITIALPRINTER" });
  });
});

describe("parseTSPL — Label Formatting Commands", () => {
  it("parses TEXT", () => {
    const c = cmd('TEXT 10,20,"3",0,2,2,"Hello World"');
    expect(c).toMatchObject({
      cmd: "TEXT",
      x: 10,
      y: 20,
      font: "3",
      rotation: 0,
      xMul: 2,
      yMul: 2,
      content: "Hello World",
    });
  });

  it("parses TEXT with alignment", () => {
    const c = cmd('TEXT 10,20,"2",0,1,1,2,"Centered"');
    expect(c).toMatchObject({ cmd: "TEXT", alignment: 2, content: "Centered" });
  });

  it("parses TEXT with TTF font", () => {
    const c = cmd('TEXT 10,20,"ROMAN.TTF",0,24,24,"TTF Text"');
    expect(c).toMatchObject({ cmd: "TEXT", font: "ROMAN.TTF" });
  });

  it("parses BLOCK", () => {
    const c = cmd('BLOCK 10,20,200,100,"2",0,1,1,0,1,"Wrapped text"');
    expect(c).toMatchObject({
      cmd: "BLOCK",
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      content: "Wrapped text",
    });
  });

  it("parses BARCODE Code 128", () => {
    const c = cmd('BARCODE 10,50,"128",80,1,0,2,4,"123456789"');
    expect(c).toMatchObject({
      cmd: "BARCODE",
      x: 10,
      y: 50,
      type: "128",
      height: 80,
      readable: 1,
      rotation: 0,
      narrow: 2,
      wide: 4,
      content: "123456789",
    });
  });

  it("parses BARCODE EAN13", () => {
    const c = cmd('BARCODE 10,50,"EAN13",80,2,0,2,4,"4006381333931"');
    expect(c).toMatchObject({ cmd: "BARCODE", type: "EAN13", content: "4006381333931" });
  });

  it("parses BARCODE with alignment", () => {
    const c = cmd('BARCODE 10,50,"128",80,1,0,2,4,2,"centered"');
    expect(c).toMatchObject({ cmd: "BARCODE", alignment: 2, content: "centered" });
  });

  it("parses BAR", () => {
    const c = cmd("BAR 10,50,290,2");
    expect(c).toMatchObject({ cmd: "BAR", x: 10, y: 50, width: 290, height: 2 });
  });

  it("parses BOX", () => {
    const c = cmd("BOX 5,5,305,205,2");
    expect(c).toMatchObject({ cmd: "BOX", x: 5, y: 5, xEnd: 305, yEnd: 205, thickness: 2 });
  });

  it("parses BOX with radius", () => {
    const c = cmd("BOX 5,5,105,105,1,5");
    expect(c).toMatchObject({ cmd: "BOX", radius: 5 });
  });

  it("parses CIRCLE", () => {
    const c = cmd("CIRCLE 100,100,50,2");
    expect(c).toMatchObject({ cmd: "CIRCLE", x: 100, y: 100, diameter: 50, thickness: 2 });
  });

  it("parses ELLIPSE", () => {
    const c = cmd("ELLIPSE 100,100,80,50,2");
    expect(c).toMatchObject({
      cmd: "ELLIPSE",
      x: 100,
      y: 100,
      width: 80,
      height: 50,
      thickness: 2,
    });
  });

  it("parses DIAGONAL", () => {
    const c = cmd("DIAGONAL 10,20,100,200,2");
    expect(c).toMatchObject({ cmd: "DIAGONAL", x1: 10, y1: 20, x2: 100, y2: 200, thickness: 2 });
  });

  it("parses REVERSE", () => {
    const c = cmd("REVERSE 10,10,100,50");
    expect(c).toMatchObject({ cmd: "REVERSE", x: 10, y: 10, width: 100, height: 50 });
  });

  it("parses ERASE", () => {
    const c = cmd("ERASE 10,10,100,50");
    expect(c).toMatchObject({ cmd: "ERASE", x: 10, y: 10, width: 100, height: 50 });
  });

  it("parses BITMAP header", () => {
    const c = cmd("BITMAP 10,20,25,80,0,");
    expect(c).toMatchObject({ cmd: "BITMAP", x: 10, y: 20, widthBytes: 25, height: 80, mode: 0 });
  });

  it("parses QRCODE", () => {
    const c = cmd('QRCODE 10,100,M,6,A,0,M2,S7,"https://example.com"');
    expect(c).toMatchObject({
      cmd: "QRCODE",
      x: 10,
      y: 100,
      ecc: "M",
      cellWidth: 6,
      mode: "A",
      rotation: 0,
      model: "M2",
      mask: "S7",
      content: "https://example.com",
    });
  });

  it("parses QRCODE without model/mask", () => {
    const c = cmd('QRCODE 10,100,H,4,A,0,"data"');
    expect(c).toMatchObject({ cmd: "QRCODE", ecc: "H", cellWidth: 4, content: "data" });
  });

  it("parses DMATRIX", () => {
    const c = cmd('DMATRIX 10,10,200,200,"Hello DataMatrix"');
    expect(c).toMatchObject({
      cmd: "DMATRIX",
      x: 10,
      y: 10,
      width: 200,
      height: 200,
      content: "Hello DataMatrix",
    });
  });

  it("parses PDF417", () => {
    const c = cmd('PDF417 10,10,300,100,0,E2,W3,"Hello PDF417"');
    expect(c).toMatchObject({
      cmd: "PDF417",
      x: 10,
      y: 10,
      width: 300,
      height: 100,
      rotation: 0,
      content: "Hello PDF417",
    });
  });

  it("parses AZTEC", () => {
    const c = cmd('AZTEC 10,10,0,6,0,0,0,1,0,"Hello Aztec"');
    expect(c).toMatchObject({ cmd: "AZTEC", x: 10, y: 10, rotation: 0, content: "Hello Aztec" });
  });

  it("parses MAXICODE", () => {
    const c = cmd('MAXICODE 10,10,2,840,001,12345,"content"');
    expect(c).toMatchObject({ cmd: "MAXICODE", x: 10, y: 10, mode: 2, content: "content" });
  });

  it("parses MPDF417", () => {
    const c = cmd('MPDF417 10,10,0,W2,H8,C3,"data"');
    expect(c).toMatchObject({ cmd: "MPDF417", x: 10, y: 10, rotation: 0, content: "data" });
  });

  it("parses RSS", () => {
    const c = cmd('RSS 10,10,"RSS14",0,2,1,"01234567890"');
    expect(c).toMatchObject({ cmd: "RSS", sym: "RSS14", pixMult: 2, content: "01234567890" });
  });

  it("parses CODABLOCK", () => {
    const c = cmd('CODABLOCK 10,10,0,8,2,"data"');
    expect(c).toMatchObject({ cmd: "CODABLOCK", x: 10, y: 10, rotation: 0, content: "data" });
  });

  it("parses TLC39", () => {
    const c = cmd('TLC39 10,10,0,"123456,ABCDEF"');
    expect(c).toMatchObject({ cmd: "TLC39", x: 10, y: 10, rotation: 0, content: "123456,ABCDEF" });
  });

  it("parses PUTBMP", () => {
    const c = cmd('PUTBMP 10,10,"LOGO.BMP"');
    expect(c).toMatchObject({ cmd: "PUTBMP", x: 10, y: 10, filename: "LOGO.BMP" });
  });

  it("parses PUTBMP with bpp and contrast", () => {
    const c = cmd('PUTBMP 10,10,"LOGO.BMP",8,90');
    expect(c).toMatchObject({ cmd: "PUTBMP", bpp: 8, contrast: 90 });
  });

  it("parses PUTPCX", () => {
    const c = cmd('PUTPCX 10,10,"LOGO.PCX"');
    expect(c).toMatchObject({ cmd: "PUTPCX", filename: "LOGO.PCX" });
  });
});

describe("parseTSPL — SET/File/Status Commands", () => {
  it("parses SET CUTTER", () => {
    const c = cmd("SET CUTTER BATCH");
    expect(c).toMatchObject({ cmd: "SET", key: "CUTTER", value: "BATCH" });
  });

  it("parses SET PEEL", () => {
    expect(cmd("SET PEEL ON")).toMatchObject({ cmd: "SET", key: "PEEL", value: "ON" });
  });

  it("parses SET TEAR", () => {
    expect(cmd("SET TEAR OFF")).toMatchObject({ cmd: "SET", key: "TEAR", value: "OFF" });
  });

  it("parses SET COUNTER", () => {
    expect(cmd("SET COUNTER @1 1")).toMatchObject({ cmd: "SET", key: "COUNTER", value: "@1 1" });
  });

  it("parses SET COM1", () => {
    expect(cmd("SET COM1 96,N,8,1")).toMatchObject({ cmd: "SET", key: "COM1", value: "96,N,8,1" });
  });

  it("parses SET RIBBON", () => {
    expect(cmd("SET RIBBON ON")).toMatchObject({ cmd: "SET", key: "RIBBON", value: "ON" });
  });

  it("parses SET HEAD", () => {
    expect(cmd("SET HEAD ON")).toMatchObject({ cmd: "SET", key: "HEAD", value: "ON" });
  });

  it("parses SET PRINTKEY", () => {
    expect(cmd("SET PRINTKEY ON")).toMatchObject({ cmd: "SET", key: "PRINTKEY", value: "ON" });
  });

  it("parses SET REPRINT", () => {
    expect(cmd("SET REPRINT ON")).toMatchObject({ cmd: "SET", key: "REPRINT", value: "ON" });
  });

  it("parses SET GAP", () => {
    expect(cmd("SET GAP AUTO")).toMatchObject({ cmd: "SET", key: "GAP", value: "AUTO" });
  });

  it("parses DOWNLOAD", () => {
    expect(cmd('DOWNLOAD "TEST.BAS"')).toMatchObject({ cmd: "DOWNLOAD", filename: "TEST.BAS" });
  });

  it("parses EOP", () => {
    expect(cmd("EOP")).toMatchObject({ cmd: "EOP" });
  });

  it("parses FILES", () => {
    expect(cmd("FILES")).toMatchObject({ cmd: "FILES" });
  });

  it("parses KILL", () => {
    expect(cmd('KILL "TEST.BAS"')).toMatchObject({ cmd: "KILL", filename: "TEST.BAS" });
  });

  it("parses MOVE", () => {
    expect(cmd("MOVE")).toMatchObject({ cmd: "MOVE" });
  });

  it("parses RUN", () => {
    expect(cmd('RUN "AUTORUN.BAS"')).toMatchObject({ cmd: "RUN", filename: "AUTORUN.BAS" });
  });
});

describe("parseTSPL — Full label parsing", () => {
  it("parses complete label with all elements", () => {
    const code = `SIZE 40 mm,30 mm
GAP 3 mm,0 mm
SPEED 4
DENSITY 8
DIRECTION 0
CODEPAGE UTF-8
CLS
TEXT 10,10,"2",0,2,2,"ACME Corp"
TEXT 10,35,"2",0,1,1,"SKU: PRD-00123"
BARCODE 10,60,"128",50,1,0,2,4,"123456789"
QRCODE 220,60,M,6,A,0,M2,S7,"https://example.com"
BOX 5,5,315,235,2
BAR 5,55,310,1
CIRCLE 250,180,40,1
DIAGONAL 5,200,315,200,1
REVERSE 10,10,200,30
ERASE 300,5,10,10
PRINT 1`;

    const result = parseTSPL(code);
    expect(result.widthDots).toBe(320);
    expect(result.heightDots).toBe(240);
    expect(result.commands).toHaveLength(18);

    // Verify command types
    const types = result.commands.map((c) => c.cmd);
    expect(types).toEqual([
      "SIZE",
      "GAP",
      "SPEED",
      "DENSITY",
      "DIRECTION",
      "CODEPAGE",
      "CLS",
      "TEXT",
      "TEXT",
      "BARCODE",
      "QRCODE",
      "BOX",
      "BAR",
      "CIRCLE",
      "DIAGONAL",
      "REVERSE",
      "ERASE",
      "PRINT",
    ]);

    // Verify elements for preview
    expect(result.elements.length).toBeGreaterThanOrEqual(6);
  });

  it("handles unknown commands gracefully", () => {
    const result = parseTSPL("FOOBAR 1,2,3\nCLS");
    expect(result.commands).toHaveLength(2);
    expect(result.commands[0]).toMatchObject({ cmd: "UNKNOWN", raw: "FOOBAR 1,2,3" });
    expect(result.commands[1]).toMatchObject({ cmd: "CLS" });
    expect(result.warnings).toHaveLength(0);
  });

  it("handles empty input", () => {
    const result = parseTSPL("");
    expect(result.commands).toHaveLength(0);
    expect(result.elements).toHaveLength(0);
  });
});

describe("parseTSC (simple API for web)", () => {
  it("returns widthDots, heightDots, elements", () => {
    const result = parseTSC('SIZE 40 mm,30 mm\nCLS\nTEXT 10,10,"2",0,2,2,"Hello"');
    expect(result.widthDots).toBe(320);
    expect(result.heightDots).toBe(240);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe("text");
  });
});
