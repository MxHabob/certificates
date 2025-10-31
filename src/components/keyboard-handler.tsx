"use client";

import { useEffect } from "react";
import { useCertificateStore } from "@/hooks/use-certificate-store";

export function KeyboardHandler() {
  const {
    selectedId,
    fields,
    deleteField,
    updateField,
    undo,
    redo,
    duplicateField,
  } = useCertificateStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key === "Delete" && selectedId) deleteField(selectedId);

      const step = e.shiftKey ? 5 : 1;
      const sel = fields.find(f => f.id === selectedId);
      if (sel) {
        if (e.key === "ArrowUp") updateField({ y: sel.y - step });
        if (e.key === "ArrowDown") updateField({ y: sel.y + step });
        if (e.key === "ArrowLeft") updateField({ x: sel.x - step });
        if (e.key === "ArrowRight") updateField({ x: sel.x + step });
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); undo(); }
        if (e.key === "y") { e.preventDefault(); redo(); }
        if (e.key === "d" && selectedId) { e.preventDefault(); duplicateField(selectedId); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, fields, deleteField, updateField, undo, redo, duplicateField]);

  return null;
}