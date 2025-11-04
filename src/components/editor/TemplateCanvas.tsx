"use client"

import type React from "react"

import { useRef, useState, useCallback } from "react"
import { useTemplateStore } from "@/store/templateStore"
import { DraggableField } from "./DraggableField"
import { Button } from "@/components/ui/button"
import { Upload, Trash2 } from "lucide-react"

export function TemplateCanvas() {
  const { currentTemplate, updateTemplate, addField, saveHistory } = useTemplateStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (!canvasRef.current || !currentTemplate) return

      const fieldName = e.dataTransfer.getData("field")
      if (!fieldName) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Ensure field stays within bounds
      const boundedX = Math.max(0, Math.min(x, currentTemplate.width - 100))
      const boundedY = Math.max(0, Math.min(y, currentTemplate.height - 30))

      addField({
        name: fieldName,
        x: boundedX,
        y: boundedY,
        fontSize: 16,
        color: "#000000",
        fontFamily: "Arial",
        fontWeight: "normal",
        textAlign: "right",
      })

      saveHistory()
    },
    [currentTemplate, addField, saveHistory],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleBackgroundUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !currentTemplate) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        updateTemplate(currentTemplate.id, { backgroundImage: imageUrl })
      }
      reader.readAsDataURL(file)
    },
    [currentTemplate, updateTemplate],
  )

  const removeBackground = useCallback(() => {
    if (!currentTemplate) return
    updateTemplate(currentTemplate.id, { backgroundImage: undefined })
  }, [currentTemplate, updateTemplate])

  if (!currentTemplate) {
    return (
      <div className="h-[600px] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-muted/20">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">اختر أو أنشئ قالباً للبدء</p>
          <p className="text-sm">يمكنك إنشاء قالب جديد من قسم "القوالب المحفوظة"</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="h-4 w-4" />
          رفع خلفية
        </Button>
        {currentTemplate.backgroundImage && (
          <Button variant="outline" size="sm" onClick={removeBackground} className="gap-2 bg-transparent">
            <Trash2 className="h-4 w-4" />
            إزالة الخلفية
          </Button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
      </div>

      <div
        ref={canvasRef}
        className={`relative rounded-lg overflow-hidden shadow-lg border-2 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
        style={{
          width: currentTemplate.width,
          height: currentTemplate.height,
          maxWidth: "100%",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {currentTemplate.backgroundImage && (
          <img
            src={currentTemplate.backgroundImage || "/placeholder.svg"}
            alt="Template background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {currentTemplate.fields.length === 0 && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
            <p className="text-center">اسحب الحقول من القائمة الجانبية وأفلتها هنا</p>
          </div>
        )}

        {currentTemplate.fields.map((field) => (
          <DraggableField key={field.id} field={field} />
        ))}
      </div>
    </div>
  )
}
