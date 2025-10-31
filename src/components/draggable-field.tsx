"use client";

import { useRef, useCallback, useEffect } from "react";
import { Move } from "lucide-react";
import { pxToMm } from "@/lib/utils";
import type { Field } from "@/types/certificate";

interface Props {
  field: Field;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  canvasRect: DOMRect | null;
}

export function DraggableField({ field, onMove, onSelect, isSelected, canvasRect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const raf = useRef<number | null>(null);
  const start = useRef({ x: 0, y: 0, fx: 0, fy: 0 });

  const mouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(field.id);
      dragging.current = true;
      start.current = {
        x: e.clientX,
        y: e.clientY,
        fx: field.x,
        fy: field.y,
      };
    },
    [field.id, field.x, field.y, onSelect]
  );

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current || !canvasRect) return;
      if (raf.current) cancelAnimationFrame(raf.current);

      raf.current = requestAnimationFrame(() => {
        const dx = pxToMm(e.clientX - start.current.x);
        const dy = pxToMm(e.clientY - start.current.y);
        const nx = Math.max(0, start.current.fx + dx);
        const ny = Math.max(0, start.current.fy + dy);
        onMove(field.id, nx, ny);
      });
    },
    [canvasRect, onMove, field.id]
  );

  const mouseUp = useCallback(() => {
    dragging.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);
  }, [mouseMove]);

  // attach listeners
  useEffect(() => {
    if (dragging.current) {
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
      return () => {
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("mouseup", mouseUp);
      };
    }
  }, [dragging.current, mouseMove, mouseUp]);

  const display = field.column ? field.label : field.value || "نص";

  return (
    <div
      ref={el}
      onMouseDown={mouseDown}
      className={`absolute flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-xs font-medium transition-all select-none ${
        isSelected
          ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
          : "border-dashed border-foreground/30 bg-background/90 hover:border-primary/50 hover:bg-primary/5"
      } ${dragging.current ? "cursor-grabbing opacity-80" : "cursor-grab"}`}
      style={{
        left: `${field.x * 3.779527559}px`,
        top: `${field.y * 3.779527559}px`,
        fontSize: `${field.fontSize}pt`,
        color: field.color,
        textAlign: field.align ?? "center",
      }}
    >
      <Move className="h-3 w-3 opacity-50" />
      <span className="whitespace-nowrap">{display}</span>
    </div>
  );
}