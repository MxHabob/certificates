"use client";

import { Plus, Settings2, Trash2, Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { toast } from "sonner";

interface FieldControlsProps {
  columns: string[];
  onAddFromColumn: () => void;
}

export function FieldControls({ columns, onAddFromColumn }: FieldControlsProps) {
  const {
    fields,
    selectedFieldId,
    addStaticField,
    updateField,
    deleteField,
    setSelectedFieldId,
    toggleEnabled,
  } = useCertificateStore();

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleAddStatic = () => {
    addStaticField();
    setSelectedFieldId(null);
    toast.success("تم إضافة نص ثابت");
  };

  const handleAddFromColumn = () => {
    setSelectedFieldId(null);
    onAddFromColumn();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            إضافة حقول
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={handleAddStatic} variant="outline" className="w-full justify-start gap-2">
            <Type className="h-4 w-4" />
            نص ثابت
          </Button>
          <Button
            onClick={handleAddFromColumn}
            disabled={!columns.length}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Plus className="h-4 w-4" />
            من البيانات
          </Button>
        </CardContent>
      </Card>

      {selectedField && (
        <Card className="border-primary/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" />
              إعدادات الحقل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">تفعيل الحقل</Label>
              <Switch
                checked={selectedField.enabled !== false}
                onCheckedChange={(c) => {
                  toggleEnabled(selectedField.id);
                  toast.success(c ? "تم تفعيل الحقل" : "تم تعطيل الحقل");
                }}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم الحقل</Label>
              <Input
                value={selectedField.label || ""}
                onChange={(e) => updateField({ label: e.target.value })}
                placeholder="اسم الحقل"
                disabled={selectedField.enabled === false}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">المحتوى</Label>
              {selectedField.column ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    {selectedField.column}
                  </Badge>
                  <p className="text-xs text-center text-muted-foreground">البيانات من عمود Excel</p>
                </div>
              ) : (
                <Input
                  value={selectedField.value || ""}
                  onChange={(e) => updateField({ value: e.target.value })}
                  placeholder="أدخل النص"
                  disabled={selectedField.enabled === false}
                />
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">محاذاة النص</Label>
              <div className="flex gap-2">
                {(["right", "center", "left"] as const).map((a) => (
                  <Button
                    key={a}
                    variant={
                      selectedField.align === a || (!selectedField.align && a === "center")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="flex-1"
                    onClick={() => updateField({ align: a })}
                    disabled={selectedField.enabled === false}
                  >
                    {a === "right" && <AlignRight className="h-4 w-4" />}
                    {a === "center" && <AlignCenter className="h-4 w-4" />}
                    {a === "left" && <AlignLeft className="h-4 w-4" />}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">حجم الخط</Label>
                <Input
                  type="number"
                  min={8}
                  max={72}
                  value={selectedField.fontSize}
                  onChange={(e) => updateField({ fontSize: +e.target.value })}
                  disabled={selectedField.enabled === false}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">اللون</Label>
                <Input
                  type="color"
                  value={selectedField.color}
                  onChange={(e) => updateField({ color: e.target.value })}
                  className="h-10"
                  disabled={selectedField.enabled === false}
                />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">X (مم)</Label>
                <Input
                  type="number"
                  step={0.5}
                  value={selectedField.x.toFixed(1)}
                  onChange={(e) => updateField({ x: +e.target.value })}
                  disabled={selectedField.enabled === false}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Y (مم)</Label>
                <Input
                  type="number"
                  step={0.5}
                  value={selectedField.y.toFixed(1)}
                  onChange={(e) => updateField({ y: +e.target.value })}
                  disabled={selectedField.enabled === false}
                />
              </div>
            </div>
            <Separator />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                deleteField(selectedField.id);
                setSelectedFieldId(null);
                toast.success("تم حذف الحقل");
              }}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف الحقل
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}