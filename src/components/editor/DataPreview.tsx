"use client"

import { useState, useMemo } from "react"
import { useTemplateStore } from "@/store/templateStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface DataPreviewProps {
  data: any[]
  columns: string[]
}

export function DataPreview({ data, columns }: DataPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { currentTemplate } = useTemplateStore()

  const selectedRow = useMemo(() => {
    return data[selectedIndex] || null
  }, [data, selectedIndex])

  const renderField = (fieldName: string) => {
    if (!selectedRow) return `{${fieldName}}`
    const value = selectedRow[fieldName]
    return value !== undefined && value !== null ? String(value) : `{${fieldName}}`
  }

  if (!currentTemplate) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">اختر قالباً لعرض المعاينة</p>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">قم برفع ملف Excel لعرض المعاينة</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">معاينة البيانات</CardTitle>
          <Badge variant="secondary">
            {selectedIndex + 1} من {data.length}
          </Badge>
        </div>
        <Select value={selectedIndex.toString()} onValueChange={(v) => setSelectedIndex(Number.parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.map((row, i) => (
              <SelectItem key={i} value={i.toString()}>
                {row[columns[0]] || `سجل ${i + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div
          className="relative rounded-lg overflow-hidden shadow-inner border bg-card"
          style={{
            width: currentTemplate.width,
            height: currentTemplate.height,
            maxWidth: "100%",
          }}
        >
          {currentTemplate.backgroundImage && (
            <img
              src={currentTemplate.backgroundImage || "/placeholder.svg"}
              alt="Template background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {currentTemplate.fields.map((f) => (
            <div
              key={f.id}
              className="absolute px-2 py-1 rounded bg-green-500/20 border border-green-500"
              style={{
                left: f.x,
                top: f.y,
                fontSize: f.fontSize || 16,
                color: f.color || "#000000",
                fontFamily: f.fontFamily || "Arial",
                fontWeight: f.fontWeight || "normal",
                textAlign: f.textAlign || "right",
              }}
            >
              {renderField(f.name)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
