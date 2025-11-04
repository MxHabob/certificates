"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTemplateStore } from "@/store/templateStore"
import { Plus, Trash2, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function TemplateManager() {
  const { templates, currentTemplate, setCurrent, deleteTemplate, addTemplate, duplicateTemplate } = useTemplateStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [width, setWidth] = useState("800")
  const [height, setHeight] = useState("600")

  const saveNew = () => {
    if (!name.trim()) return
    addTemplate(name, Number.parseInt(width), Number.parseInt(height))
    setName("")
    setWidth("800")
    setHeight("600")
    setOpen(false)
  }

  const handleDuplicate = (id: string) => {
    duplicateTemplate(id)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">القوالب المحفوظة</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                قالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء قالب جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم القالب</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="شهادة تخرج 2025"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">العرض (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      min={400}
                      max={2000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">الارتفاع (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      min={300}
                      max={2000}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveNew} className="w-full">
                  إنشاء القالب
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد قوالب محفوظة</p>
        ) : (
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    currentTemplate?.id === t.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{t.name}</span>
                      {currentTemplate?.id === t.id && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          نشط
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.fields.length} حقل • {t.width}×{t.height}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {currentTemplate?.id !== t.id && (
                      <Button size="sm" variant="outline" onClick={() => setCurrent(t)}>
                        تحميل
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => handleDuplicate(t.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteTemplate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
