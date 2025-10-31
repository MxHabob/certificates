"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DraggableField } from "./draggable-field";
import { FileQuestion, ZoomIn, ZoomOut } from "lucide-react";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { Button } from "./ui/button";

export function TemplateCanvas() {
  const {
    templateUrl,
    templateAspect,
    fields,
    moveField,
    setSelected,
    selectedId,
    zoom,
    setZoom,
  } = useCertificateStore();

  const canvas = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => canvas.current && setRect(canvas.current.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const click = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvas.current) setSelected(null);
    },
    [setSelected]
  );

  return (
    <Card className="overflow-hidden border-2 shadow-xl">
      <CardContent className="p-0">
        <div className="flex items-center justify-between bg-muted/30 px-3 py-1">
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => setZoom(zoom / 1.3)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setZoom(zoom * 1.3)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        <div
          ref={canvas}
          onClick={click}
          className="relative bg-muted/30 overflow-hidden"
          style={{
            aspectRatio: templateAspect ?? "210 / 297",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          {templateUrl ? (
            <>
              <img
                src={templateUrl}
                alt="قالب"
                className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
                draggable={false}
              />
              {fields
                .filter(f => f.enabled !== false)
                .map(f => (
                  <DraggableField
                    key={f.id}
                    field={f}
                    onMove={moveField}
                    onSelect={setSelected}
                    isSelected={f.id === selectedId}
                    canvasRect={rect}
                  />
                ))}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
              <FileQuestion className="h-16 w-16 opacity-20" />
              <div className="text-center">
                <p className="text-lg font-medium">لم يتم رفع قالب بعد</p>
                <p className="text-sm">ارفع قالب الشهادة للبدء</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}