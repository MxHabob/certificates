import * as XLSX from "xlsx"

export const readExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet)
        resolve(json)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("فشل قراءة الملف"))
    reader.readAsBinaryString(file)
  })
}

export const getColumns = (data: any[]): string[] => {
  if (data.length === 0) return []
  return Object.keys(data[0])
}

export const validateExcelData = (data: any[]): { valid: boolean; error?: string } => {
  if (!data || data.length === 0) {
    return { valid: false, error: "الملف فارغ" }
  }

  if (data.length > 10000) {
    return { valid: false, error: "الملف يحتوي على عدد كبير جداً من السجلات (أكثر من 10000)" }
  }

  return { valid: true }
}
