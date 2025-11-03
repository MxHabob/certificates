import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MM_TO_PX, MM_TO_PT } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const mmToPx = (mm: number) => mm * MM_TO_PX;
export const pxToMm = (px: number) => px / MM_TO_PX;
export const mmToPt = (mm: number) => mm * MM_TO_PT;

// Snap a value (in mm) to a grid step, optionally with offset
export function snapMm(valueMm: number, stepMm: number, offsetMm = 0): number {
  if (stepMm <= 0) return valueMm;
  const v = (valueMm - offsetMm) / stepMm;
  const snapped = Math.round(v) * stepMm + offsetMm;
  return snapped;
}

// Produce alignment guide positions given a moving rect and a set of static rects
export interface RectMm { x: number; y: number; w: number; h: number }
export interface GuidesMm { v?: number; h?: number }

export function computeAlignmentGuides(moving: RectMm, others: RectMm[], toleranceMm = 1): GuidesMm {
  const edges = (r: RectMm) => ({
    left: r.x,
    right: r.x + r.w,
    top: r.y,
    bottom: r.y + r.h,
    cx: r.x + r.w / 2,
    cy: r.y + r.h / 2,
  });
  const m = edges(moving);
  let vGuide: number | undefined;
  let hGuide: number | undefined;
  for (const o of others) {
    const e = edges(o);
    const vCandidates = [e.left, e.cx, e.right];
    const hCandidates = [e.top, e.cy, e.bottom];
    for (const v of vCandidates) if (Math.abs(m.cx - v) <= toleranceMm) vGuide = v;
    for (const h of hCandidates) if (Math.abs(m.cy - h) <= toleranceMm) hGuide = h;
  }
  return { v: vGuide, h: hGuide };
}

// Read PNG pHYs chunk (pixels per unit). Returns pixelsPerMm if available
export function parsePngPixelsPerMm(buf: ArrayBuffer): number | null {
  try {
    const view = new DataView(buf);
    let pos = 8; // skip signature
    while (pos + 8 <= view.byteLength) {
      const length = view.getUint32(pos, false); pos += 4;
      const type = String.fromCharCode(
        view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2), view.getUint8(pos + 3)
      );
      pos += 4;
      if (type === 'pHYs') {
        const ppux = view.getUint32(pos, false);
        const ppuy = view.getUint32(pos + 4, false);
        const unit = view.getUint8(pos + 8); // 1 = meter
        if (unit === 1 && ppux > 0 && ppuy > 0) {
          const pixelsPerMeter = (ppux + ppuy) / 2;
          return pixelsPerMeter / 1000; // mm in a meter
        }
        return null;
      }
      pos += length + 4; // skip data + CRC
      if (type === 'IEND') break;
    }
  } catch {
    // ignore
  }
  return null;
}