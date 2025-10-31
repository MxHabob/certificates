export interface Field {
  id: string;
  label: string;
  column: string;
  value?: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  enabled?: boolean;
  align?: "left" | "center" | "right";
}