"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileImage, Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TemplateCanvas } from "@/components/template-canvas";
import { FieldControls } from "@/components/field-controls";
import { ColumnPicker } from "@/components/column-picker";
import { PreviewDialog } from "@/components/preview-dialog";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { parseExcel } from "@/lib/excel-parser";
import { generateAllCertificates } from "@/lib/pdf-worker";
import { ModeToggle } from "./mode-toggle";

export function Certificates() {
  const {
    students,
    columns,
    templateFile,
    templateUrl,
    fields,
    setStudents,
    setColumns,
    setTemplateFile,
    setTemplateUrl,
    fileNameColumn
  } = useCertificateStore();

  const [showExcelViewer, setShowExcelViewer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExcel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const { headers, rows } = await parseExcel(file);
        setColumns(headers);
        setStudents(rows);
        toast.success(`تم تحميل ${rows.length} سجل`, {
          description: `${headers.length} عمود`,
        });
      } catch {
        toast.error("فشل قراءة الملف");
      }
    },
    [setColumns, setStudents]
  );

  const handleTemplate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.includes("image/png")) {
        toast.error("يرجى رفع ملف PNG فقط");
        return;
      }

      setTemplateFile(file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const aspect = `${img.naturalWidth} / ${img.naturalHeight}`;
        const isLandscape = img.naturalWidth > img.naturalHeight;
        const pageWidth_mm = isLandscape ? 297 : 210;
        const pageHeight_mm = isLandscape ? 210 : 297;
        setTemplateUrl(url, aspect, pageWidth_mm, pageHeight_mm);
        toast.success("تم رفع القالب");
      };
      img.src = url;
    },
    [setTemplateFile, setTemplateUrl]
  );

  const handleGenerate = async () => {
    if (!students.length || !templateFile || !fields.length) {
      toast.error("أكمل جميع الخطوات");
      return;
    }

    setIsGenerating(true);
    try {
      await generateAllCertificates(students, fields, templateFile, fileNameColumn);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20" dir="rtl">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <ModeToggle />
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">مولد الشهادات</h1>
              <p className="text-sm text-muted-foreground">إنشاء شهادات احترافية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {students.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                disabled={!templateFile || fields.length === 0}
              >
                معاينة
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={!students.length || !templateFile || fields.length === 0 || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري…
                </>
              ) : (
                `إنشاء ${students.length} شهادة`
              )}
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="group overflow-hidden border-2 border-dashed transition-all hover:border-primary/50">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <Label className="font-semibold">ملف البيانات</Label>
                  <p className="text-sm text-muted-foreground">Excel / CSV</p>
                </div>
              </div>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcel}
                className="file:mr-4 file:rounded-md file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />
              {columns.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <Badge variant="secondary">{students.length} سجل</Badge>
                  <Badge variant="outline">{columns.length} عمود</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-2 border-dashed transition-all hover:border-primary/50">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileImage className="h-6 w-6" />
                </div>
                <div>
                  <Label className="font-semibold">قالب الشهادة</Label>
                  <p className="text-sm text-muted-foreground">PNG فقط</p>
                </div>
              </div>
              <Input
                type="file"
                accept="image/png"
                onChange={handleTemplate}
                className="file:mr-4 file:rounded-md file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />
              {templateUrl && <Badge className="mt-3" variant="secondary">تم الرفع</Badge>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <FieldControls columns={columns} onAddFromColumn={() => setShowExcelViewer(true)} />
          </aside>

          <section>
            <TemplateCanvas />
          </section>
        </div>
      </section>

      <ColumnPicker
        open={showExcelViewer}
        onOpenChange={setShowExcelViewer}
        columns={columns}
      />
      <PreviewDialog open={showPreview} onOpenChange={setShowPreview} />
    </div>
  );
}