import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MM_TO_PX, MM_TO_PT } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const mmToPx = (mm: number) => mm * MM_TO_PX;
export const pxToMm = (px: number) => px / MM_TO_PX;
export const mmToPt = (mm: number) => mm * MM_TO_PT;
