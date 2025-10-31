"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  FileImage,
  Sparkles,
  Loader2,
  Download,
  FileText,
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TemplateCanvas } from "./template-canvas";
import { FieldControls } from "./field-controls";
import { ColumnPicker } from "./column-picker";
import { PreviewDialog } from "./preview-dialog";
import { KeyboardHandler } from "./keyboard-handler";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { parseExcel } from "@/lib/excel-parser";
import { generateCertificates } from "@/lib/pdf/pdf-worker";
import { ModeToggle } from "./mode-toggle";

export function Certificates() {
  const {
    students,
    columns,
    templateFile,
    setStudents,
    setColumns,
    setTemplate,
    fields,
    fileNameCol,
    setFileNameCol,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCertificateStore();

  const [showExcel, setShowExcel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ---------- Excel ----------
  const onExcel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const { headers, rows } = await parseExcel(f);
        setColumns(headers);
        setStudents(rows);
        toast.success(`تم تحميل ${rows.length} سجل`);
      } catch {
        toast.error("فشل قراءة الملف");
      }
    },
    [setColumns, setStudents]
  );

  // ---------- Template ----------
  const onTemplate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!f.type.includes("image/png")) {
        toast.error("يرجى رفع PNG فقط");
        return;
      }
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const isL = img.naturalWidth > img.naturalHeight;
        setTemplate(f, url, isL ? 297 : 210, isL ? 210 : 297);
        toast.success("تم رفع القالب");
      };
      img.src = url;
    },
    [setTemplate]
  );

  // ---------- Generation ----------
  const startGenerate = async (single = false) => {
    if (!students.length || !templateFile || !fields.length) {
      toast.error("أكمل جميع الخطوات");
      return;
    }
    setGenerating(true);
    await generateCertificates(students, fields, templateFile, fileNameCol, single);
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20" dir="rtl">
      <KeyboardHandler />
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <ModeToggle/>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">مولد الشهادات</h1>
              <p className="text-sm text-muted-foreground">إنشاء شهادات احترافية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>

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
              onClick={() => startGenerate(false)}
              disabled={generating || !students.length || !templateFile || fields.length === 0}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {students.length} شهادة (ZIP)
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={() => startGenerate(true)}
              disabled={generating || !students.length || !templateFile || fields.length === 0}
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF واحد
            </Button>
          </div>
        </div>
      </header>

      {/* ---------- Uploads ---------- */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Excel */}
          <Card className="overflow-hidden border-2 border-dashed transition-all hover:border-primary/50">
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
                onChange={onExcel}
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

          {/* Template */}
          <Card className="overflow-hidden border-2 border-dashed transition-all hover:border-primary/50">
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
                onChange={onTemplate}
                className="file:mr-4 file:rounded-md file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />
              {templateFile && <Badge className="mt-3" variant="secondary">تم الرفع</Badge>}
            </CardContent>
          </Card>
        </div>

        {/* ---------- File-name column picker ---------- */}
        {columns.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Label className="mb-2 block">عمود اسم الملف (اختياري)</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={fileNameCol === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFileNameCol(null)}
                >
                  لا شيء
                </Badge>
                {columns.map(c => (
                  <Badge
                    key={c}
                    variant={fileNameCol === c ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFileNameCol(c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------- Canvas + Controls ---------- */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <FieldControls columns={columns} onAddFromColumn={() => setShowExcel(true)} />
          </aside>

          <section>
            <TemplateCanvas />
          </section>
        </div>
      </section>

      <ColumnPicker open={showExcel} onOpenChange={setShowExcel} columns={columns} />
      <PreviewDialog open={showPreview} onOpenChange={setShowPreview} />
    </div>
  );
}