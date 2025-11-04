"use client"

import type React from "react"

import { useState, useRef, useMemo } from "react"
import { readExcel, getColumns, validateExcelData } from "@/lib/excel"
import { TemplateCanvas } from "@/components/editor/template-canvas"
import { FieldPalette } from "@/components/field-palette"
import { DataPreview } from "@/components/editor/data-preview"
import { TemplateManager } from "@/components/admin/template-manager"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTemplateStore } from "@/store/use-template-store"
import { exportBatchPDF } from "@/lib/pdf"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Download, Undo2, Redo2, Loader2 } from "lucide-react"

export default function App() {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [quality, setQuality] = useState<number>(0.95)
  const [scale, setScale] = useState<number>(1.5)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentTemplate, undo, redo, canUndo, canRedo } = useTemplateStore()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const json = await readExcel(file)
      const validation = validateExcelData(json)

      if (!validation.valid) {
        toast.warning( validation.error)
        return
      }

      setData(json)
      setColumns(getColumns(json))
      toast.success(`تم تحميل ${json.length} سجل`)
    } catch (error) {
      toast.error("تأكد من أن الملف بصيغة Excel صحيحة",)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleBatchExport = async () => {
    if (!currentTemplate || data.length === 0) {
      toast.warning("تأكد من اختيار قالب وتحميل بيانات",)
      return
    }

    if (currentTemplate.fields.length === 0) {
      toast( "أضف حقولاً إلى القالب أولاً",)
      return
    }

    setIsExporting(true)
    setProgress({ current: 0, total: data.length })
    abortRef.current = new AbortController()
    try {
      await exportBatchPDF(data, currentTemplate, currentTemplate.name, {
        quality,
        scale,
        signal: abortRef.current.signal,
        onProgress: (current, total) => setProgress({ current, total }),
      })
      toast(`تم إنشاء ${data.length} شهادة`)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast("تم إلغاء التصدير")
      } else {
        toast.error("حدث خطأ أثناء إنشاء ملف PDF",)
      }
    } finally {
      setIsExporting(false)
      abortRef.current = null
    }
  }

  const handleCancelExport = () => {
    abortRef.current?.abort()
  }

  const progressLabel = useMemo(() => {
    if (!isExporting || progress.total === 0) return ""
    const page = Math.min(progress.current + 1, progress.total)
    return `(${page}/${progress.total})`
  }, [isExporting, progress])

  return (
    <div className="min-h-screen bg-background over" dir="rtl">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">DocGen Pro</h1>
              <p className="text-sm text-muted-foreground">مولد الشهادات والوثائق الاحترافي</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo()} title="تراجع">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo()} title="إعادة">
                <Redo2 className="h-4 w-4" />
              </Button>
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* File Upload */}
            <Card>
              <CardContent className="pt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      رفع ملف Excel
                    </>
                  )}
                </Button>
                {data.length > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{data.length} سجل</span>
                    <Badge variant="secondary">{columns.length} حقل</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Field Palette */}
            <FieldPalette fields={columns} />

            {/* Template Manager */}
            <TemplateManager />

            {/* Export Button */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select
                value={String(scale)}
                onValueChange={(v) => setScale(Number(v))}
                disabled={isExporting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="دقة الالتقاط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">دقة منخفضة (سريعة)</SelectItem>
                  <SelectItem value="1.5">دقة متوسطة</SelectItem>
                  <SelectItem value="2">دقة عالية</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(quality)}
                onValueChange={(v) => setQuality(Number(v))}
                disabled={isExporting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="جودة الصورة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.8">جودة 80%</SelectItem>
                  <SelectItem value="0.9">جودة 90%</SelectItem>
                  <SelectItem value="0.95">جودة 95%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBatchExport}
                disabled={!currentTemplate || data.length === 0 || isExporting}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التصدير {progressLabel}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    تصدير PDF ({data.length})
                  </>
                )}
              </Button>
              {isExporting && (
                <Button variant="outline" onClick={handleCancelExport} className="whitespace-nowrap">
                  إلغاء
                </Button>
              )}
            </div>
          </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="editor">محرر القالب</TabsTrigger>
                <TabsTrigger value="preview">معاينة البيانات</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <TemplateCanvas />
              </TabsContent>

              <TabsContent value="preview">
                <DataPreview data={data} columns={columns} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
