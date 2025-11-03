"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DraggableField } from "./draggable-field";
import { FileQuestion, ZoomIn, ZoomOut } from "lucide-react";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ZOOM_STEP } from "@/lib/constants";
import { mmToPx } from "@/lib/utils";

export function TemplateCanvas() {
  const {
    templateUrl,
    templateAspect,
    pageWidth_mm,
    pageHeight_mm,
    fields,
    moveField,
    setSelected,
    selectedId,
    zoom,
    setZoom,
  } = useCertificateStore();

  const canvas = useRef<HTMLDivElement>(null);
  const templateContainer = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      if (templateContainer.current) {
        setRect(templateContainer.current.getBoundingClientRect());
      } else if (canvas.current) {
        setRect(canvas.current.getBoundingClientRect());
      }
    };
    update();
    window.addEventListener("resize", update);
    // Also update when zoom changes
    const timeoutId = setTimeout(update, 50);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(timeoutId);
    };
  }, [zoom, templateUrl]);

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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => setZoom(zoom / ZOOM_STEP)}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تصغير</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => setZoom(zoom * ZOOM_STEP)}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تكبير</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>مستوى التكبير</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div
          ref={canvas}
          onClick={click}
          className="relative bg-muted/30 overflow-auto"
          style={{
            minHeight: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {templateUrl ? (
            <div
              ref={templateContainer}
              className="relative bg-white shadow-inner"
              style={{
                width: pageWidth_mm && pageHeight_mm ? `${mmToPx(pageWidth_mm) * zoom}px` : "auto",
                height: pageWidth_mm && pageHeight_mm ? `${mmToPx(pageHeight_mm) * zoom}px` : "auto",
                aspectRatio: templateAspect ?? "210 / 297",
                minWidth: pageWidth_mm && pageHeight_mm ? `${mmToPx(pageWidth_mm)}px` : "auto",
                minHeight: pageWidth_mm && pageHeight_mm ? `${mmToPx(pageHeight_mm)}px` : "auto",
              }}
            >
              <img
                src={templateUrl}
                alt="قالب"
                className="w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
              {/* Rulers */}
              {pageWidth_mm && pageHeight_mm && (
                <>
                  <div className="absolute left-0 top-0 h-6 w-full bg-muted/60 text-[10px] text-muted-foreground select-none flex">
                    {Array.from({ length: Math.ceil(pageWidth_mm) + 1 }).map((_, i) => (
                      <div key={i} style={{ width: mmToPx(1) * zoom }} className="relative flex items-end justify-center">
                        <div className={`h-3 w-px bg-foreground/30 ${i % 5 === 0 ? 'h-4 bg-foreground/60' : ''}`} />
                        {i % 10 === 0 && <span className="absolute -bottom-3">{i}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="absolute left-0 top-0 h-full w-6 bg-muted/60 text-[10px] text-muted-foreground select-none">
                    {Array.from({ length: Math.ceil(pageHeight_mm) + 1 }).map((_, i) => (
                      <div key={i} style={{ height: mmToPx(1) * zoom }} className="relative flex items-center justify-end">
                        <div className={`w-3 h-px bg-foreground/30 ${i % 5 === 0 ? 'w-4 bg-foreground/60' : ''}`} />
                        {i % 10 === 0 && <span className="absolute -right-3">{i}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}

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
                    zoom={zoom}
                    // snapping
                    gridStepMm={1}
                    showGuides
                  />
                ))}
            </div>
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