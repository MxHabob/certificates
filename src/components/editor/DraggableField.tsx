"use client"

import type React from "react"

import { useRef, useState, useCallback, useEffect } from "react"
import { useTemplateStore } from "@/store/templateStore"
import { Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Field } from "@/types/template"

interface DraggableFieldProps {
  field: Field
}

export function DraggableField({ field }: DraggableFieldProps) {
  const { updateField, deleteField, currentTemplate, saveHistory } = useTemplateStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const fieldRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return

    setIsDragging(true)
    const rect = fieldRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !currentTemplate) return

      const canvas = fieldRef.current?.parentElement
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      let newX = e.clientX - rect.left - dragOffset.x
      let newY = e.clientY - rect.top - dragOffset.y

      // Keep field within canvas bounds
      newX = Math.max(0, Math.min(newX, currentTemplate.width - 100))
      newY = Math.max(0, Math.min(newY, currentTemplate.height - 30))

      updateField(field.id, { x: newX, y: newY })
    },
    [isDragging, dragOffset, field.id, updateField, currentTemplate],
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      saveHistory()
    }
  }, [isDragging, saveHistory])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleDelete = useCallback(() => {
    deleteField(field.id)
    saveHistory()
  }, [field.id, deleteField, saveHistory])

  const handleUpdate = useCallback(
    (updates: Partial<Field>) => {
      updateField(field.id, updates)
      saveHistory()
    },
    [field.id, updateField, saveHistory],
  )

  return (
    <div
      ref={fieldRef}
      className={`absolute group cursor-move select-none transition-shadow ${
        isDragging ? "shadow-lg z-50" : "hover:shadow-md"
      }`}
      style={{
        left: field.x,
        top: field.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="px-3 py-1.5 rounded border-2 border-primary/50 bg-primary/10 backdrop-blur-sm"
        style={{
          fontSize: field.fontSize || 16,
          color: field.color || "#000000",
          fontFamily: field.fontFamily || "Arial",
          fontWeight: field.fontWeight || "normal",
          textAlign: field.textAlign || "right",
        }}
      >
        {`{${field.name}}`}
      </div>

      <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="secondary" className="h-6 w-6">
              <Settings className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">إعدادات الحقل</h4>

              <div className="space-y-2">
                <Label>حجم الخط</Label>
                <Input
                  type="number"
                  value={field.fontSize || 16}
                  onChange={(e) => handleUpdate({ fontSize: Number.parseInt(e.target.value) })}
                  min={8}
                  max={72}
                />
              </div>

              <div className="space-y-2">
                <Label>اللون</Label>
                <Input
                  type="color"
                  value={field.color || "#000000"}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>نوع الخط</Label>
                <Select
                  value={field.fontFamily || "Arial"}
                  onValueChange={(value) => handleUpdate({ fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>سمك الخط</Label>
                <Select
                  value={field.fontWeight || "normal"}
                  onValueChange={(value: any) => handleUpdate({ fontWeight: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">عادي</SelectItem>
                    <SelectItem value="semibold">متوسط</SelectItem>
                    <SelectItem value="bold">عريض</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>محاذاة النص</Label>
                <Select
                  value={field.textAlign || "right"}
                  onValueChange={(value: any) => handleUpdate({ textAlign: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">يمين</SelectItem>
                    <SelectItem value="center">وسط</SelectItem>
                    <SelectItem value="left">يسار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button size="icon" variant="destructive" className="h-6 w-6" onClick={handleDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
