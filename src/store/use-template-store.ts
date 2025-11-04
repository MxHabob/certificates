import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Field, Template, TemplateHistory } from "@/types/template"

interface TemplateStore {
  templates: Template[]
  currentTemplate: Template | null
  history: TemplateHistory[]
  historyIndex: number

  // Template operations
  addTemplate: (name: string, width?: number, height?: number) => void
  updateTemplate: (id: string, updates: Partial<Template>) => void
  deleteTemplate: (id: string) => void
  duplicateTemplate: (id: string) => void
  setCurrent: (template: Template | null) => void

  // Field operations
  addField: (field: Omit<Field, "id">) => void
  updateField: (fieldId: string, updates: Partial<Field>) => void
  deleteField: (fieldId: string) => void

  // History operations
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveHistory: () => void
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      currentTemplate: null,
      history: [],
      historyIndex: -1,

      addTemplate: (name, width = 800, height = 600) =>
        set((state) => {
          const newTemplate: Template = {
            id: Date.now().toString(),
            name,
            fields: [],
            width,
            height,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          return {
            templates: [...state.templates, newTemplate],
            currentTemplate: newTemplate,
            history: [],
            historyIndex: -1,
          }
        }),

      updateTemplate: (id, updates) =>
        set((state) => {
          const updatedTemplates = state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t,
          )
          const updatedCurrent =
            state.currentTemplate?.id === id
              ? { ...state.currentTemplate, ...updates, updatedAt: Date.now() }
              : state.currentTemplate
          return {
            templates: updatedTemplates,
            currentTemplate: updatedCurrent,
          }
        }),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
          history: state.currentTemplate?.id === id ? [] : state.history,
          historyIndex: state.currentTemplate?.id === id ? -1 : state.historyIndex,
        })),

      duplicateTemplate: (id) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === id)
          if (!template) return state

          const newTemplate: Template = {
            ...template,
            id: Date.now().toString(),
            name: `${template.name} (نسخة)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }

          return {
            templates: [...state.templates, newTemplate],
          }
        }),

      setCurrent: (template) =>
        set({
          currentTemplate: template,
          history: [],
          historyIndex: -1,
        }),

      addField: (field) =>
        set((state) => {
          if (!state.currentTemplate) return state

          const newField: Field = {
            ...field,
            id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }

          const updatedFields = [...state.currentTemplate.fields, newField]
          const updatedTemplate = {
            ...state.currentTemplate,
            fields: updatedFields,
            updatedAt: Date.now(),
          }

          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
          }
        }),

      updateField: (fieldId, updates) =>
        set((state) => {
          if (!state.currentTemplate) return state

          const updatedFields = state.currentTemplate.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))

          const updatedTemplate = {
            ...state.currentTemplate,
            fields: updatedFields,
            updatedAt: Date.now(),
          }

          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
          }
        }),

      deleteField: (fieldId) =>
        set((state) => {
          if (!state.currentTemplate) return state

          const updatedFields = state.currentTemplate.fields.filter((f) => f.id !== fieldId)
          const updatedTemplate = {
            ...state.currentTemplate,
            fields: updatedFields,
            updatedAt: Date.now(),
          }

          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
          }
        }),

      saveHistory: () =>
        set((state) => {
          if (!state.currentTemplate) return state

          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push({
            templateId: state.currentTemplate.id,
            fields: JSON.parse(JSON.stringify(state.currentTemplate.fields)),
            timestamp: Date.now(),
          })

          // Keep only last 50 history items
          if (newHistory.length > 50) {
            newHistory.shift()
          }

          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          }
        }),

      undo: () =>
        set((state) => {
          if (!state.currentTemplate || state.historyIndex <= 0) return state

          const newIndex = state.historyIndex - 1
          const historyItem = state.history[newIndex]

          if (historyItem.templateId !== state.currentTemplate.id) return state

          const updatedTemplate = {
            ...state.currentTemplate,
            fields: JSON.parse(JSON.stringify(historyItem.fields)),
            updatedAt: Date.now(),
          }

          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
            historyIndex: newIndex,
          }
        }),

      redo: () =>
        set((state) => {
          if (!state.currentTemplate || state.historyIndex >= state.history.length - 1) return state

          const newIndex = state.historyIndex + 1
          const historyItem = state.history[newIndex]

          if (historyItem.templateId !== state.currentTemplate.id) return state

          const updatedTemplate = {
            ...state.currentTemplate,
            fields: JSON.parse(JSON.stringify(historyItem.fields)),
            updatedAt: Date.now(),
          }

          return {
            currentTemplate: updatedTemplate,
            templates: state.templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
            historyIndex: newIndex,
          }
        }),

      canUndo: () => {
        const state = get()
        return state.historyIndex > 0
      },

      canRedo: () => {
        const state = get()
        return state.historyIndex < state.history.length - 1
      },
    }),
    {
      name: "docgen-templates-v2",
    },
  ),
)
