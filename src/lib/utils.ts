import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MM_TO_PX = 3.779527559;
export const MM_TO_PT = 2.83464567;

export const mmToPx = (mm: number) => mm * MM_TO_PX;
export const pxToMm = (px: number) => px / MM_TO_PX;
export const mmToPt = (mm: number) => mm * MM_TO_PT;