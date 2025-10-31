import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Field } from "@/types/certificate";

interface HistoryState {
  past: CertificateState[];
  future: CertificateState[];
  push(s: CertificateState): void;
  undo(): CertificateState | undefined;
  redo(): CertificateState | undefined;
}

export interface CertificateState {
  // data
  students: Record<string, any>[];
  columns: string[];
  templateFile: File | null;
  templateUrl: string;
  templateAspect: string | null;
  pageWidth_mm: number | null;
  pageHeight_mm: number | null;
  fields: Field[];
  selectedId: string | null;
  fileNameCol: string | null;
  zoom: number;               // canvas zoom (1 = 100%)

  // actions
  setStudents(v: any[]): void;
  setColumns(v: string[]): void;
  setTemplate(f: File | null, url?: string, w?: number, h?: number): void;
  setFileNameCol(c: string | null): void;
  setSelected(id: string | null): void;
  setZoom(z: number): void;

  addStatic(): void;
  addFromCol(col: string, label?: string): void;
  updateField(upd: Partial<Field>): void;
  moveField(id: string, x: number, y: number): void;
  deleteField(id: string): void;
  toggleEnabled(id: string): void;
  duplicateField(id: string): void;
  reset(): void;

  // undo / redo
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
}

const initialData = {
  students: [] as Record<string, any>[],
  columns: [] as string[],
  templateFile: null as File | null,
  templateUrl: "" as string,
  templateAspect: null as string | null,
  pageWidth_mm: null as number | null,
  pageHeight_mm: null as number | null,
  fields: [] as Field[],
  selectedId: null as string | null,
  fileNameCol: null as string | null,
  zoom: 1 as number,
};

const useHistory = (): HistoryState => {
  const past: CertificateState[] = [];
  const future: CertificateState[] = [];

  return {
    past,
    future,
    push(s) {
      this.past.push({ ...s });
      this.future.length = 0;
    },
    undo() {
      if (!this.past.length) return undefined;
      const prev = this.past.pop()!;
      this.future.push({ ...get() });
      return prev;
    },
    redo() {
      if (!this.future.length) return undefined;
      const next = this.future.pop()!;
      this.past.push({ ...get() });
      return next;
    },
  };
};

let get: () => CertificateState; // will be set inside create

export const useCertificateStore = create<CertificateState & { history: HistoryState }>()(
  devtools(
    persist(
      (set, _get) => {
        get = _get as any;
        const history = useHistory();

        const push = () => {
          const s = get();
          const snap = {
            students: s.students,
            columns: s.columns,
            templateFile: s.templateFile,
            templateUrl: s.templateUrl,
            templateAspect: s.templateAspect,
            pageWidth_mm: s.pageWidth_mm,
            pageHeight_mm: s.pageHeight_mm,
            fields: s.fields.map(f => ({ ...f })),
            selectedId: s.selectedId,
            fileNameCol: s.fileNameCol,
            zoom: s.zoom,
          };
          history.push(snap as any);
        };

        return {
          ...initialData,
          history,

          // ---------- basic setters ----------
          setStudents: v => set({ students: v }),
          setColumns: v => set({ columns: v }),

          setTemplate: (f, url, w, h) =>
            set(s => {
              if (s.templateUrl) URL.revokeObjectURL(s.templateUrl);
              return {
                templateFile: f,
                templateUrl: url ?? (f ? URL.createObjectURL(f) : ""),
                templateAspect: w && h ? `${w}/${h}` : null,
                pageWidth_mm: w ?? null,
                pageHeight_mm: h ?? null,
              };
            }),

          setFileNameCol: c => set({ fileNameCol: c }),
          setSelected: id => set({ selectedId: id }),
          setZoom: z => set({ zoom: Math.max(0.2, Math.min(z, 3)) }),

          // ---------- field actions ----------
          addStatic: () =>
            set(s => {
              const nf: Field = {
                id: nanoid(),
                label: "نص ثابت",
                value: "اسم المؤسسة",
                x: 30,
                y: 60,
                fontSize: 18,
                color: "#000000",
                align: "center",
              };
              push();
              return { fields: [...s.fields, nf] };
            }),

          addFromCol: (col, label) =>
            set(s => {
              const nf: Field = {
                id: nanoid(),
                label: label ?? col,
                column: col,
                x: 30,
                y: 40 + s.fields.length * 20,
                fontSize: 14,
                color: "#000000",
                align: "center",
              };
              push();
              return { fields: [...s.fields, nf] };
            }),

          updateField: upd =>
            set(s => {
              if (!s.selectedId) return s;
              push();
              return {
                fields: s.fields.map(f =>
                  f.id === s.selectedId ? { ...f, ...upd } : f
                ),
              };
            }),

          moveField: (id, x, y) =>
            set(s => ({
              fields: s.fields.map(f => (f.id === id ? { ...f, x, y } : f)),
            })),

          deleteField: id =>
            set(s => {
              push();
              return {
                fields: s.fields.filter(f => f.id !== id),
                selectedId: s.selectedId === id ? null : s.selectedId,
              };
            }),

          toggleEnabled: id =>
            set(s => {
              push();
              return {
                fields: s.fields.map(f =>
                  f.id === id ? { ...f, enabled: !(f.enabled ?? true) } : f
                ),
              };
            }),

          duplicateField: id =>
            set(s => {
              const src = s.fields.find(f => f.id === id);
              if (!src) return s;
              const copy: Field = {
                ...src,
                id: nanoid(),
                label: `${src.label} (نسخة)`,
              };
              push();
              return { fields: [...s.fields, copy] };
            }),

          reset: () => {
            const { templateUrl } = get();
            if (templateUrl) URL.revokeObjectURL(templateUrl);
            set(initialData);
          },

          // ---------- undo / redo ----------
          undo: () => {
            const prev = history.undo();
            if (prev) set(prev);
          },
          redo: () => {
            const next = history.redo();
            if (next) set(next);
          },
          get canUndo() {
            return history.past.length > 0;
          },
          get canRedo() {
            return history.future.length > 0;
          },
        };
      },
      {
        name: "cert-gen",
        partialize: s => ({
          columns: s.columns,
          fields: s.fields,
          fileNameCol: s.fileNameCol,
          zoom: s.zoom,
        }),
      }
    ),
    { name: "CertStore" }
  )
);