import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Field } from "@/types/certificate";

interface CertificateState {
  students: Record<string, any>[];
  columns: string[];
  templateFile: File | null;
  templateUrl: string;
  templateAspectRatio: string | null;
  pageWidth_mm: number | null;
  pageHeight_mm: number | null;
  fields: Field[];
  selectedFieldId: string | null;
  fileNameColumn: string | null;

  setStudents: (v: Record<string, any>[]) => void;
  setColumns: (v: string[]) => void;
  setTemplateFile: (f: File | null) => void;
  setTemplateUrl: (u: string, aspect?: string, pageWidth_mm?: number, pageHeight_mm?: number) => void;
  setFileNameColumn: (col: string | null) => void;
  setSelectedFieldId: (id: string | null) => void;

  addStaticField: () => void;
  addFieldFromColumn: (col: string, label?: string) => void;
  updateField: (updates: Partial<Field>) => void;
  updateFieldPosition: (id: string, x: number, y: number) => void;
  deleteField: (id: string) => void;
  toggleEnabled: (id: string) => void;
  reset: () => void;
}

const initialState = {
  students: [],
  columns: [],
  templateFile: null,
  templateUrl: "",
  templateAspectRatio: null,
  pageWidth_mm: null,
  pageHeight_mm: null,
  fields: [],
  selectedFieldId: null,
  fileNameColumn: null,
};

export const useCertificateStore = create<CertificateState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setStudents: (v) => set({ students: v }),
        setColumns: (v) => set({ columns: v }),
        setTemplateFile: (f) => set({ templateFile: f }),

        setTemplateUrl: (url, aspect, pageWidth_mm, pageHeight_mm) =>
          set((state) => {
            if (state.templateUrl) URL.revokeObjectURL(state.templateUrl);
            return { templateUrl: url, templateAspectRatio: aspect || null, pageWidth_mm: pageWidth_mm ?? null, pageHeight_mm: pageHeight_mm ?? null };
          }),

        setFileNameColumn: (col) => set({ fileNameColumn: col }),

        setSelectedFieldId: (id) => set({ selectedFieldId: id }),

        addStaticField: () =>
          set((state) => {
            const newField: Field = {
              id: nanoid(),
              label: "نص ثابت",
              column: "",
              value: "اسم المؤسسة",
              x: 30,
              y: 60,
              fontSize: 18,
              color: "#000000",
              align: "center",
              enabled: true,
            };
            return { fields: [...state.fields, newField] };
          }),

        addFieldFromColumn: (col, label) =>
          set((state) => {
            const newField: Field = {
              id: nanoid(),
              label: label ?? col,
              column: col,
              x: 30,
              y: 40 + state.fields.length * 20,
              fontSize: 14,
              color: "#000000",
              align: "center",
              enabled: true,
            };
            return { fields: [...state.fields, newField] };
          }),

        updateField: (updates) =>
          set((state) => {
            if (!state.selectedFieldId) return state;
            return {
              fields: state.fields.map((f) =>
                f.id === state.selectedFieldId ? { ...f, ...updates } : f
              ),
            };
          }),

        updateFieldPosition: (id, x, y) =>
          set((state) => ({
            fields: state.fields.map((f) => (f.id === id ? { ...f, x, y } : f)),
          })),

        deleteField: (id) =>
          set((state) => ({
            fields: state.fields.filter((f) => f.id !== id),
            selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
          })),

        toggleEnabled: (id) =>
          set((state) => ({
            fields: state.fields.map((f) =>
              f.id === id ? { ...f, enabled: !(f.enabled ?? true) } : f
            ),
          })),

        reset: () => {
          const { templateUrl } = get();
          if (templateUrl) URL.revokeObjectURL(templateUrl);
          set(initialState);
        },
      }),
      { name: "cert-gen", partialize: (s) => ({ columns: s.columns, fields: s.fields, fileNameColumn: s.fileNameColumn }) }
    ),
    { name: "CertStore" }
  )
);