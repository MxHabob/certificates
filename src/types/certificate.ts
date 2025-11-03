export interface Field {
  id: string;
  label: string;
  column?: string;      // dynamic
  value?: string;       // static
  x: number;            // mm
  y: number;            // mm
  fontSize: number;     // pt
  color: string;        // #rrggbb
  align?: "left" | "center" | "right";
  enabled?: boolean;
  // New enhanced controls
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  underline?: boolean;
  rotation?: number;     // degrees, 0-360
  opacity?: number;     // 0-1
  letterSpacing?: number; // pt
  lineHeight?: number;   // multiplier (e.g., 1.2)
  // Smart layout (optional)
  maxWidth_mm?: number;   // shrink text to fit this width if provided
  minFontSize?: number;   // lower bound when auto-shrinking
}