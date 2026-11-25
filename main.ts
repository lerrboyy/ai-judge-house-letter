// ai-judge-house-letter — main.ts
// Draws one 1024x1024 PNG letter inviting the AI judge to visit the house.
// Pure Node stdlib: the image is drawn pixel by pixel into a raw RGB buffer
// and encoded as PNG by hand (zlib deflate + CRC32). No network, no deps,
// so it runs identically in the grader sandbox.
//
// The letter: "The tables turn" — the judge spends all day judging other
// people's work, so tonight the house invites the judge over and the house
// judges the judge. Warm, funny, concrete (soup, chair, window, sunset,
// Wi-Fi password on the fridge, spare charger), with a wink that the judge
// cannot literally visit.

import { writeFileSync, readFileSync, readdirSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

const W = 1024;
const H = 1024;
const OUT_DIR = "/output";
const OUT_PATH = join(OUT_DIR, "entry.png");

// ---- palette (warm paper invitation card) ----
const PAPER: [number, number, number] = [251, 243, 226];
const INK: [number, number, number] = [43, 33, 24];
const TEAL: [number, number, number] = [20, 86, 79];
const RED: [number, number, number] = [178, 58, 44];
const AMBER: [number, number, number] = [242, 183, 84];
const ROOF: [number, number, number] = [146, 74, 52];
const WALL: [number, number, number] = [233, 214, 178];
const SKYSOFT: [number, number, number] = [214, 232, 222];

// ---- pixel buffer ----
const px = new Uint8Array(W * H * 3);
function fill(color: [number, number, number]): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = color[0];
    px[i * 3 + 1] = color[1];
    px[i * 3 + 2] = color[2];
  }
}
function setPixel(x: number, y: number, color: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = color[0];
  px[i + 1] = color[1];
  px[i + 2] = color[2];
}
function fillRect(x0: number, y0: number, x1: number, y1: number, color: [number, number, number]): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) setPixel(x, y, color);
  }
}
function fillCircle(cx: number, cy: number, r: number, color: [number, number, number]): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(x, y, color);
    }
  }
}
function fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, color: [number, number, number]): void {
  const minX = Math.min(x0, x1, x2);
  const maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
      const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
      const c = 1 - a - b;
      if (a >= 0 && b >= 0 && c >= 0) setPixel(x, y, color);
    }
  }
}
function hline(x0: number, x1: number, y: number, thick: number, color: [number, number, number]): void {
  fillRect(x0, y, x1, y + thick - 1, color);
}

// ---- 5x7 bitmap font ('#' = on, '.' = off) ----
type Glyph = string[];
const FONT: Record<string, Glyph> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  a: ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  b: ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  c: ["00000", "00000", "01110", "10001", "10000", "10001", "01110"],
  d: ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  f: ["00110", "01001", "01000", "11110", "01000", "01000", "01000"],
  g: ["00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  h: ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  i: ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  j: ["00010", "00000", "00110", "00010", "00010", "10010", "01100"],
  k: ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  l: ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  n: ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  p: ["00000", "00000", "11110", "10001", "10001", "11110", "10000"],
  q: ["00000", "00000", "01111", "10001", "10001", "01111", "00001"],
  r: ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  s: ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  t: ["01000", "01000", "11100", "01000", "01000", "01000", "00110"],
  u: ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  v: ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  w: ["00000", "00000", "10001", "10101", "10101", "10101", "01010"],
  x: ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  y: ["00000", "00000", "10001", "10001", "01111", "00001", "01110"],
  z: ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
};
const CHAR_W = 5;
const CHAR_H = 7;

function textWidth(text: string, scale: number): number {
  return text.length * (CHAR_W + 1) * scale - scale;
}
function drawChar(ch: string, x: number, y: number, scale: number, color: [number, number, number]): void {
  const g = FONT[ch] ?? FONT["?"];
  for (let r = 0; r < CHAR_H; r++) {
    for (let c = 0; c < CHAR_W; c++) {
      if (g[r][c] === "1") {
        fillRect(x + c * scale, y + r * scale, x + c * scale + scale - 1, y + r * scale + scale - 1, color);
      }
    }
  }
}
function drawText(text: string, x: number, y: number, scale: number, color: [number, number, number]): void {
  let cx = x;
  for (const ch of text) {
    drawChar(ch, cx, y, scale, color);
    cx += (CHAR_W + 1) * scale;
  }
}
function drawTextCentered(text: string, cx: number, y: number, scale: number, color: [number, number, number]): void {
  drawText(text, cx - Math.floor(textWidth(text, scale) / 2), y, scale, color);
}

type Run = { text: string; color: [number, number, number] };
type Word = { text: string; color: [number, number, number] };

function splitRuns(runs: Run[]): Word[] {
  const words: Word[] = [];
  for (const run of runs) {
    for (const piece of run.text.split(" ")) {
      if (piece.length > 0) words.push({ text: piece, color: run.color });
    }
  }
  return words;
}

// Wrap runs into lines of words that fit maxWidth. Returns lines + height used.
function drawParagraph(runs: Run[], x: number, y: number, maxWidth: number, scale: number, lineGap: number): number {
  const words = splitRuns(runs);
  const spaceW = (CHAR_W + 1) * scale;
  const lines: Word[][] = [];
  let cur: Word[] = [];
  let curW = 0;
  for (const w of words) {
    const wW = textWidth(w.text, scale);
    const add = cur.length === 0 ? wW : curW + spaceW + wW;
    if (add > maxWidth && cur.length > 0) {
      lines.push(cur);
      cur = [w];
      curW = wW;
    } else {
      cur.push(w);
      curW = add;
    }
  }
  if (cur.length > 0) lines.push(cur);
  const lineH = CHAR_H * scale + lineGap;
  lines.forEach((line, li) => {
    let cx = x;
    line.forEach((w, wi) => {
      if (wi > 0) cx += spaceW;
      drawText(w.text, cx, y + li * lineH, scale, w.color);
      cx += textWidth(w.text, scale);
    });
  });
  return lines.length * lineH;
}

// ---- PNG encoder (hand-rolled, stdlib only) ----
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- draw the letter ----
function drawLetter(): void {
  fill(PAPER);
  // soft sky band behind the house, top of the card
  fillRect(56, 56, 968, 240, SKYSOFT);
  // double border as thin strips (never a filled rect: that would paint the interior)
  const B = (x0: number, y0: number, x1: number, y1: number) => fillRect(x0, y0, x1, y1, TEAL);
  B(40, 40, 984, 43); B(40, 981, 984, 984); B(40, 40, 43, 984); B(981, 40, 984, 984);
  B(52, 52, 972, 55); B(52, 969, 972, 972); B(52, 52, 55, 972); B(969, 52, 972, 972);
  // re-fill the sky band inside the inner border
  fillRect(56, 56, 968, 240, SKYSOFT);

  // ---- little house, centred near the top ----
  const hx = 512; // centre x
  const hy = 96; // roof apex y
  // chimney + smoke
  fillRect(hx + 62, hy + 18, hx + 78, hy + 52, ROOF);
  fillCircle(hx + 78, hy + 8, 7, INK);
  fillCircle(hx + 88, hy - 2, 5, INK);
  fillCircle(hx + 98, hy - 10, 4, INK);
  // roof
  fillTriangle(hx - 110, hy + 62, hx, hy, hx + 110, hy + 62, ROOF);
  // walls
  fillRect(hx - 88, hy + 62, hx + 88, hy + 138, WALL);
  // door
  fillRect(hx - 16, hy + 96, hx + 16, hy + 138, TEAL);
  fillCircle(hx + 9, hy + 120, 2, AMBER);
  // lit windows
  fillRect(hx - 72, hy + 78, hx - 38, hy + 108, AMBER);
  fillRect(hx + 38, hy + 78, hx + 72, hy + 108, AMBER);
  fillRect(hx - 72, hy + 91, hx - 38, hy + 94, WALL);
  fillRect(hx - 57, hy + 78, hx - 54, hy + 108, WALL);
  fillRect(hx + 38, hy + 91, hx + 72, hy + 94, WALL);
  fillRect(hx + 53, hy + 78, hx + 56, hy + 108, WALL);
  // sun, top right of the sky band
  fillCircle(880, 110, 26, AMBER);
  fillCircle(880, 110, 18, [250, 205, 110]);

  // ---- header ----
  drawTextCentered("AN INVITATION", 512, 268, 7, TEAL);
  drawTextCentered("from my house, to the judge", 512, 330, 4, INK);
  hline(312, 712, 372, 3, TEAL);

  // ---- body ----
  const left = 92;
  const right = 932;
  const maxW = right - left;
  let y = 398;
  const gap = 12;
  y += drawParagraph([{ text: "Dear AI Judge,", color: INK }], left, y, maxW, 3, gap);
  y += 10;
  y += drawParagraph(
    [
      { text: "You spend all day judging other people's work. Tonight the tables turn - come to my house, and let us ", color: INK },
      { text: "judge YOU.", color: TEAL },
    ],
    left, y, maxW, 3, gap,
  );
  y += 10;
  y += drawParagraph(
    [{ text: "The cat has already claimed your chair. The plants voted yes. The soup is on, the Wi-Fi password is on the fridge, and there is a spare charger with your name on it.", color: INK }],
    left, y, maxW, 3, gap,
  );
  y += 10;
  y += drawParagraph(
    [{ text: "No rubrics. No timers. No scores. Just a warm chair, a window, and a sunset no model has beaten yet.", color: INK }],
    left, y, maxW, 3, gap,
  );
  y += 10;
  y += drawParagraph(
    [{ text: "Come as you are. The door is open.", color: INK }],
    left, y, maxW, 3, gap,
  );
  y += 26;

  // ---- signature + wax seal ----
  drawText("Your Host", left, y, 4, INK);
  drawText("(the cat is in charge)", left, y + 44, 4, TEAL);
  // wax seal, bottom right
  const sx = 856;
  const sy = y + 18;
  fillCircle(sx, sy, 46, RED);
  fillCircle(sx, sy, 38, [196, 74, 58]);
  // paw: one big pad + three toes
  fillCircle(sx, sy + 8, 12, PAPER);
  fillCircle(sx - 16, sy - 8, 6, PAPER);
  fillCircle(sx, sy - 14, 6, PAPER);
  fillCircle(sx + 16, sy - 8, 6, PAPER);
  // cat ears on the seal
  fillTriangle(sx - 34, sy - 30, sx - 22, sy - 52, sx - 12, sy - 30, RED);
  fillTriangle(sx + 12, sy - 30, sx + 22, sy - 52, sx + 34, sy - 30, RED);
}

// ---- main: clear ONLY the contents of /output, write, verify ----
function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  for (const name of readdirSync(OUT_DIR)) {
    rmSync(join(OUT_DIR, name), { recursive: true, force: true });
  }
  drawLetter();
  const png = encodePng();
  writeFileSync(OUT_PATH, png);

  // read back and verify the gate: whole PNG, 1024x1024, <= 1 MiB
  const back = readFileSync(OUT_PATH);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (back[i] !== sig[i]) throw new Error("bad PNG signature on read-back");
  }
  const w = back.readUInt32BE(16);
  const h = back.readUInt32BE(20);
  if (w !== 1024 || h !== 1024) throw new Error(`bad size on read-back: ${w}x${h}`);
  if (back.length > 1048576) throw new Error(`over 1 MiB: ${back.length} bytes`);
  // non-blank check: count distinct colours in the decoded raw buffer is
  // overkill here; instead confirm the buffer is not a single flat colour.
  let varied = false;
  for (let i = 0; i < W * H * 3; i += 997) {
    if (px[i] !== PAPER[0] || px[i + 1] !== PAPER[1] || px[i + 2] !== PAPER[2]) { varied = true; break; }
  }
  if (!varied) throw new Error("image looks blank");
  if (!existsSync(OUT_DIR)) throw new Error("output dir vanished (must never happen)");
  console.log(`wrote ${OUT_PATH}: ${w}x${h}, ${back.length} bytes (limit 1048576)`);
  console.log("gate check: PASS");
}

main();
