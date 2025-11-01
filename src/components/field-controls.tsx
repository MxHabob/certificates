"use client";

import { Plus, Trash2, Type, AlignLeft, AlignCenter, AlignRight, Copy, Bold, Italic, Underline, Sliders, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { toast } from "sonner";

interface FieldControlsProps {
  columns: string[];
  onAddFromColumn: () => void;
}

export function FieldControls({ columns, onAddFromColumn }: FieldControlsProps) {
  const {
    fields,
    selectedId,
    addStatic,
    updateField,
    deleteField,
    duplicateField,
  } = useCertificateStore();

  const sel = fields.find(f => f.id === selectedId);

  return (
    <Card className="m-auto mb-4 rounded-lg p-0">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={addStatic} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>إضافة نص ثابت</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onAddFromColumn}
                  disabled={!columns.length}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  من البيانات
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{columns.length ? "إضافة حقل من بيانات Excel" : "يرجى تحميل ملف Excel أولاً"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Font Size Controls */}
          {sel && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1">
                <Label className="text-xs whitespace-nowrap">حجم:</Label>
                <Input
                  type="number"
                  min={8}
                  max={72}
                  value={sel.fontSize}
                  onChange={(e) => updateField({ fontSize: +e.target.value })}
                  disabled={sel.enabled === false}
                  className="w-16 h-8 text-xs"
                />
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Text Formatting */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sel.fontWeight === "bold" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ fontWeight: sel.fontWeight === "bold" ? "normal" : "bold" })}
                      disabled={sel.enabled === false}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>خط عريض</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sel.fontStyle === "italic" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ fontStyle: sel.fontStyle === "italic" ? "normal" : "italic" })}
                      disabled={sel.enabled === false}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>خط مائل</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sel.underline ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ underline: !sel.underline })}
                      disabled={sel.enabled === false}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تحته خط</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Color */}
              <div className="flex items-center gap-1">
                <Label className="text-xs whitespace-nowrap">لون:</Label>
                <Input
                  type="color"
                  value={sel.color}
                  onChange={(e) => updateField({ color: e.target.value })}
                  className="h-8 w-12"
                  disabled={sel.enabled === false}
                />
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sel.align === "right" || (!sel.align && "right") ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ align: "right" })}
                      disabled={sel.enabled === false}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>يمين</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sel.align === "center" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ align: "center" })}
                      disabled={sel.enabled === false}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>وسط</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sel.align === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField({ align: "left" })}
                      disabled={sel.enabled === false}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>يسار</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Field Content/Name */}
              <div className="flex items-center gap-1">
                <Input
                  value={sel.label || ""}
                  onChange={(e) => updateField({ label: e.target.value })}
                  placeholder="اسم الحقل"
                  disabled={sel.enabled === false}
                  className="h-8 w-32 text-xs"
                />
                {sel.column ? (
                  <Badge variant="secondary" className="text-xs">
                    {sel.column}
                  </Badge>
                ) : (
                  <Input
                    value={sel.value || ""}
                    onChange={(e) => updateField({ value: e.target.value })}
                    placeholder="النص"
                    disabled={sel.enabled === false}
                    className="h-8 w-32 text-xs"
                  />
                )}
              </div>

              <Separator orientation="vertical" className="h-6" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sliders className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-4" align="start">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">إعدادات متقدمة</Label>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">X (مم)</Label>
                        <Input
                          type="number"
                          step={0.5}
                          value={sel.x.toFixed(1)}
                          onChange={(e) => updateField({ x: +e.target.value })}
                          disabled={sel.enabled === false}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Y (مم)</Label>
                        <Input
                          type="number"
                          step={0.5}
                          value={sel.y.toFixed(1)}
                          onChange={(e) => updateField({ y: +e.target.value })}
                          disabled={sel.enabled === false}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">الاستدارة</Label>
                        <Input
                          type="number"
                          min={0}
                          max={360}
                          step={1}
                          value={sel.rotation ?? 0}
                          onChange={(e) => updateField({ rotation: +e.target.value })}
                          disabled={sel.enabled === false}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">الشفافية</Label>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={sel.opacity ?? 1}
                          onChange={(e) => updateField({ opacity: +e.target.value })}
                          disabled={sel.enabled === false}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">تباعد الأحرف</Label>
                        <Input
                          type="number"
                          min={-5}
                          max={10}
                          step={0.5}
                          value={sel.letterSpacing ?? 0}
                          onChange={(e) => updateField({ letterSpacing: +e.target.value })}
                          disabled={sel.enabled === false}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">ارتفاع السطر</Label>
                        <Input
                          type="number"
                          min={0.5}
                          max={3}
                          step={0.1}
                          value={sel.lineHeight ?? 1.2}
                          onChange={(e) => updateField({ lineHeight: +e.target.value })}
                          disabled={sel.enabled === false}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6" />

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        duplicateField(sel.id);
                        toast.success("تم تكرار الحقل");
                      }}
                      className="gap-1"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تكرار الحقل</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deleteField(sel.id);
                        toast.success("تم حذف الحقل");
                      }}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حذف الحقل</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}