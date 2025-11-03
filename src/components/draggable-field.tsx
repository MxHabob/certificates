"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { pxToMm, snapMm, type RectMm } from "@/lib/utils";
import type { Field } from "@/types/certificate";

interface Props {
  field: Field;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  canvasRect: DOMRect | null;
  zoom: number;
  gridStepMm?: number;
  showGuides?: boolean;
  allRects?: RectMm[];
}

export function DraggableField({ field, onMove, onSelect, isSelected, canvasRect, zoom, gridStepMm = 0, showGuides = true }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ clientX: 0, clientY: 0, fieldX: 0, fieldY: 0 });

  // Use refs to store latest callbacks to avoid recreating handlers
  const onMoveRef = useRef(onMove);
  const fieldIdRef = useRef(field.id);
  const canvasRectRef = useRef(canvasRect);
  const zoomRef = useRef(zoom);
  
  useEffect(() => {
    onMoveRef.current = onMove;
    fieldIdRef.current = field.id;
    canvasRectRef.current = canvasRect;
    zoomRef.current = zoom;
  }, [onMove, field.id, canvasRect, zoom]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      const rect = canvasRectRef.current;
      if (!rect) return;
      
      onSelect(field.id);
      
      // Get current mouse position relative to canvas
      const initialX = e.clientX - rect.left;
      const initialY = e.clientY - rect.top;
      
      startPos.current = {
        clientX: initialX,
        clientY: initialY,
        fieldX: field.x,
        fieldY: field.y,
      };
      
      setIsDragging(true);
    },
    [field.id, field.x, field.y, onSelect]
  );

  // Mouse move handler - attached to document when dragging
  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      // Capture mouse coordinates immediately
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Cancel any pending animation frame to use the latest mouse position
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        
        const rect = canvasRectRef.current;
        if (!rect) return;

        // Get current mouse position relative to canvas
        const currentX = mouseX - rect.left;
        const currentY = mouseY - rect.top;

        // Calculate delta in pixels
        const deltaXPx = currentX - startPos.current.clientX;
        const deltaYPx = currentY - startPos.current.clientY;

        // Convert pixel delta to mm (accounting for zoom)
        const currentZoom = zoomRef.current;
        const deltaXmm = pxToMm(deltaXPx / currentZoom);
        const deltaYmm = pxToMm(deltaYPx / currentZoom);

        // Calculate new position
        let newX = Math.max(0, startPos.current.fieldX + deltaXmm);
        let newY = Math.max(0, startPos.current.fieldY + deltaYmm);
        if (gridStepMm > 0) {
          newX = snapMm(newX, gridStepMm);
          newY = snapMm(newY, gridStepMm);
        }

        // Update field position
        onMoveRef.current(fieldIdRef.current, newX, newY);
      });
    };

    const handleMouseUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setIsDragging(false);
    };

    // Attach listeners to document for global mouse tracking
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  // Reset dragging state if field changes
  useEffect(() => {
    return () => {
      setIsDragging(false);
    };
  }, [field.id]);

  const display = field.column ? field.label : field.value || "نص";

  return (
    <div
      ref={el}
      onMouseDown={handleMouseDown}
      className={`absolute flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-xs font-medium transition-all select-none ${
        isSelected
          ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
          : "border-dashed border-foreground/30 bg-background/90 hover:border-primary/50 hover:bg-primary/5"
      } ${isDragging ? "cursor-grabbing opacity-80" : "cursor-grab"}`}
      style={{
        left: `${field.x * 3.779527559 * zoom}px`,
        top: `${field.y * 3.779527559 * zoom}px`,
        fontSize: `${field.fontSize * zoom}pt`,
        color: field.color,
        textAlign: field.align ?? "center",
        fontWeight: field.fontWeight || "normal",
        fontStyle: field.fontStyle || "normal",
        textDecoration: field.underline ? "underline" : "none",
        opacity: field.opacity ?? 1,
        letterSpacing: field.letterSpacing ? `${field.letterSpacing}pt` : "normal",
        lineHeight: field.lineHeight || 1.2,
        transform: field.rotation ? `rotate(${field.rotation}deg)` : "none",
        transformOrigin: "center center",
      }}
    >
      <span className="whitespace-nowrap">{display}</span>
    </div>
  );
}
