"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DraggableField } from "@/components/draggable-field";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { FileQuestion } from "lucide-react";

export function TemplateCanvas() {
  const { templateUrl, templateAspectRatio, fields, updateFieldPosition, selectedFieldId, setSelectedFieldId } = useCertificateStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      if (canvasRef.current) {
        setCanvasRect(canvasRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        setSelectedFieldId(null);
      }
    },
    [setSelectedFieldId]
  );

  return (
    <Card className="overflow-hidden border-2 shadow-xl">
      <CardContent className="p-0">
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="relative bg-muted/30 cursor-default"
          style={{
            aspectRatio: templateAspectRatio || "210 / 297",
          }}
        >
          {templateUrl ? (
            <>
              <img
                src={templateUrl}
                alt="Template"
                className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
                draggable={false}
              />
              {fields
                .filter((f) => f.enabled !== false)
                .map((f) => (
                  <DraggableField
                    key={f.id}
                    field={f}
                    onMove={updateFieldPosition}
                    onSelect={setSelectedFieldId}
                    isSelected={f.id === selectedFieldId}
                    canvasRect={canvasRect}
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