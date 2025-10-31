"use client";

import { useRef, useCallback } from "react";
import { Move } from "lucide-react";
import type { Field } from "@/types/certificate";
import { pxToMm } from "@/lib/utils";

interface DraggableFieldProps {
  field: Field;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  canvasRect: DOMRect | null;
}

export function DraggableField({ field, onMove, onSelect, isSelected, canvasRect }: DraggableFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const animationFrame = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startFieldX = useRef(0);
  const startFieldY = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(field.id);
      isDragging.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      startFieldX.current = field.x;
      startFieldY.current = field.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !canvasRect) return;

        const now = Date.now();
        if (now - lastUpdate.current < 16) return;
        lastUpdate.current = now;

        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);

        animationFrame.current = requestAnimationFrame(() => {
          const deltaX_px = moveEvent.clientX - startX.current;
          const deltaY_px = moveEvent.clientY - startY.current;
          const deltaX_mm = pxToMm(deltaX_px);
          const deltaY_mm = pxToMm(deltaY_px);
          const newX = startFieldX.current + deltaX_mm;
          const newY = startFieldY.current + deltaY_mm;
          onMove(field.id, Math.max(0, newX), Math.max(0, newY));
        });
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [field.id, field.x, field.y, onMove, onSelect, canvasRect]
  );

  const displayText = field.column ? field.label : field.value || "نص";

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      className={`absolute flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-xs font-medium transition-all select-none ${
        isSelected
          ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
          : "border-dashed border-foreground/30 bg-background/90 hover:border-primary/50 hover:bg-primary/5"
      } ${isDragging.current ? "cursor-grabbing scale-105 opacity-80" : "cursor-grab"}`}
      style={{
        left: `${field.x * 3.779527559}px`,
        top: `${field.y * 3.779527559}px`,
        fontSize: `${field.fontSize}pt`,
        color: field.color,
        minWidth: "60px",
        textAlign: field.align ?? "center",
      }}
      aria-label={`حقل قابل للسحب: ${displayText}`}
      role="button"
      tabIndex={0}
    >
      <Move className="h-3 w-3 opacity-50" />
      <span className="whitespace-nowrap">{displayText}</span>
    </div>
  );
}