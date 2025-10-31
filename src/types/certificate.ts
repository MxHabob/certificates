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
}