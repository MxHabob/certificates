"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, EyeIcon, Table2 } from "lucide-react";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mmToPx } from "@/lib/utils";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewDialog({ open, onOpenChange }: PreviewDialogProps) {
  const { students, fields, templateUrl, columns, pageWidth_mm, pageHeight_mm } = useCertificateStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setCurrentIndex(0);
  }, [open]);

  useEffect(() => {
    const updateScale = () => {
      if (previewRef.current && pageWidth_mm && pageHeight_mm) {
        const containerW = previewRef.current.clientWidth;
        const containerH = previewRef.current.clientHeight;
        const contentW = mmToPx(pageWidth_mm);
        const contentH = mmToPx(pageHeight_mm);
        const scaleX = containerW / contentW;
        const scaleY = containerH / contentH;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [open, pageWidth_mm, pageHeight_mm]);

  if (!students.length) return null;

  const currentStudent = students[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl max-h-[90vh] p-0 flex flex-col" dir="rtl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة الشهادة</span>
            <Badge variant="secondary">
              {currentIndex + 1} من {students.length}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
          معاينة الشهادة الحالية مع إمكانية التنقل بين السجلات
         </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="preview">
              <EyeIcon className="h-4 w-4 mr-2" />
              معاينة الشهادة
            </TabsTrigger>
            <TabsTrigger value="data">
              <Table2 className="h-4 w-4 mr-2" />  
              البيانات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="p-6 pt-4 space-y-4 w-full">
            <div
              ref={previewRef}
              className="relative bg-muted/30 rounded-lg overflow-hidden w-full h-[60vh]"
              style={{
                aspectRatio: pageWidth_mm && pageHeight_mm ? `${pageWidth_mm} / ${pageHeight_mm}` : "210 / 297",
              }}
            >
              {templateUrl && (
                <>
                  <img
                    src={templateUrl}
                    alt="Template"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  {fields
                    .filter((f) => f.enabled !== false)
                    .map((field) => {
                      const value = field.column
                        ? String(currentStudent[field.column] ?? "").trim()
                        : field.value ?? "";
                      if (!value) return null;

                      return (
                        <div
                          key={field.id}
                          className="absolute font-medium"
                          style={{
                            left: `${mmToPx(field.x) * scale}px`,
                            top: `${mmToPx(field.y) * scale}px`,
                            fontSize: `${field.fontSize * scale}pt`,
                          }}
                        >
                          {value}
                        </div>
                      );
                    })}
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronRight className="h-4 w-4 ml-2" />
                السابق
              </Button>

              <span className="text-sm text-muted-foreground font-medium">
                {currentStudent[columns[0]] || "سجل"}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.min(students.length - 1, i + 1))}
                disabled={currentIndex === students.length - 1}
              >
                التالي
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="data" className="p-0">
            <ScrollArea className="h-[70vh] rounded-b-lg">
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">الأعمدة المتاحة</h3>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((col) => (
                      <Badge key={col} variant="outline">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-right">#</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col} className="text-right whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, idx) => (
                      <TableRow
                        key={idx}
                        className={`cursor-pointer transition-colors ${
                          idx === currentIndex ? "bg-primary/10" : "hover:bg-muted/50"
                        }`}
                        onClick={() => setCurrentIndex(idx)}
                      >
                        <TableCell className="text-muted-foreground text-sm">
                          {idx + 1}
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col} className="text-sm whitespace-nowrap">
                            {String(student[col] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}