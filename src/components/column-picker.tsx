"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCertificateStore } from "@/hooks/use-certificate-store";
import { toast } from "sonner";

interface ColumnPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
}

export function ColumnPicker({ open, onOpenChange, columns }: ColumnPickerProps) {
  const { addFieldFromColumn } = useCertificateStore();
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [customLabel, setCustomLabel] = useState<string>("");

  const handleAdd = () => {
    if (!selectedColumn) {
      toast.error("يرجى اختيار عمود");
      return;
    }

    const label = customLabel.trim() || selectedColumn;
    addFieldFromColumn(selectedColumn, label);
    toast.success(`تم إضافة حقل: ${label}`);
    onOpenChange(false);
    setSelectedColumn("");
    setCustomLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>اختر عمود من البيانات</DialogTitle>
          <DialogDescription>
            اختر العمود الذي تريد إدراجه في الشهادة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <Badge
                key={col}
                variant={selectedColumn === col ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedColumn(col);
                  setCustomLabel("");
                }}
              >
                {col}
              </Badge>
            ))}
          </div>

          {selectedColumn && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">تسمية مخصصة (اختياري)</Label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={selectedColumn}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAdd} disabled={!selectedColumn}>
              إضافة الحقل
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}