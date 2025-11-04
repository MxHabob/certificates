export interface Field {
    id: string
    name: string
    x: number
    y: number
    fontSize?: number
    color?: string
    fontFamily?: string
    fontWeight?: "normal" | "bold" | "semibold"
    textAlign?: "left" | "center" | "right"
  }
  
  export interface Template {
    id: string
    name: string
    fields: Field[]
    backgroundImage?: string
    width: number
    height: number
    createdAt: number
    updatedAt: number
  }
  
  export interface TemplateHistory {
    templateId: string
    fields: Field[]
    timestamp: number
  }
  