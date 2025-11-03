"use client";

import { useMemo } from "react";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FieldInspector() {
  const { fields, selectedId, updateField } = useCertificateStore();
  const f = useMemo(() => fields.find(x => x.id === selectedId), [fields, selectedId]);
  if (!f) return null;

  const setNum = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v)) updateField({ [k]: v } as unknown as Partial<typeof f>);
  };

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
      <div>
        <Label>الموضع X (مم)</Label>
        <Input type="number" step="0.5" value={f.x} onChange={setNum('x')} />
      </div>
      <div>
        <Label>الموضع Y (مم)</Label>
        <Input type="number" step="0.5" value={f.y} onChange={setNum('y')} />
      </div>
      <div>
        <Label>الحجم (نقطة)</Label>
        <Input type="number" step="1" value={f.fontSize} onChange={setNum('fontSize')} />
      </div>
      <div>
        <Label>الدوران (°)</Label>
        <Input type="number" step="1" value={f.rotation ?? 0} onChange={setNum('rotation')} />
      </div>
      <div>
        <Label>العرض الأقصى (مم)</Label>
        <Input type="number" step="1" value={f.maxWidth_mm ?? ''} onChange={setNum('maxWidth_mm')} />
      </div>
      <div>
        <Label>أقل حجم</Label>
        <Input type="number" step="1" value={f.minFontSize ?? ''} onChange={setNum('minFontSize')} />
      </div>
      <div>
        <Label>المحاذاة</Label>
        <Select value={f.align ?? 'center'} onValueChange={v => updateField({ align: v as 'left' | 'center' | 'right' })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">يسار</SelectItem>
            <SelectItem value="center">وسط</SelectItem>
            <SelectItem value="right">يمين</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>اللون</Label>
        <Input type="color" value={f.color} onChange={e => updateField({ color: e.target.value })} />
      </div>
    </div>
  );
}


