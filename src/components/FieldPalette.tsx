"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GripVertical } from "lucide-react"

interface FieldPaletteProps {
  fields: string[]
}

export function FieldPalette({ fields }: FieldPaletteProps) {
  const onDragStart = (e: React.DragEvent, field: string) => {
    e.dataTransfer.setData("field", field)
    e.dataTransfer.effectAllowed = "copy"
  }

  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الحقول المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">قم برفع ملف Excel لعرض الحقول</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">الحقول المتاحة</CardTitle>
        <p className="text-xs text-muted-foreground">اسحب الحقول إلى القالب</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {fields.map((field) => (
              <Badge
                key={field}
                draggable
                onDragStart={(e) => onDragStart(e, field)}
                className="cursor-move w-full justify-between py-2 px-3 hover:bg-primary/90 transition-colors"
                variant="default"
              >
                <span className="text-sm">{field}</span>
                <GripVertical className="h-4 w-4" />
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
