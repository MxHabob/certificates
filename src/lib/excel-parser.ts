import * as XLSX from "xlsx";

export async function parseExcel(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", cellDates: true, sheetStubs: true });
    
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      throw new Error("الملف لا يحتوي على جداول بيانات");
    }
    
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws || !ws["!ref"]) {
      throw new Error("الجدول فارغ أو غير صالح");
    }

    const range = XLSX.utils.decode_range(ws["!ref"]);
    
    // Validate range
    if (range.e.r < range.s.r || range.e.c < range.s.c) {
      throw new Error("نطاق البيانات غير صالح");
    }

    // Parse headers (first row)
    const headers: string[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      const headerValue = cell ? String(cell.v ?? "").trim() : "";
      // Use default header if empty
      headers.push(headerValue || `عمود ${C + 1}`);
    }

    // Parse data rows
    const rows: Record<string, any>[] = [];
    for (let R = 1; R <= range.e.r; ++R) {
      const row: Record<string, any> = {};
      let hasData = false;
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const header = headers[C];
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        const value = cell ? (cell.v ?? "") : "";
        row[header] = value;
        if (value !== "" && value != null) {
          hasData = true;
        }
      }
      
      // Only include rows with at least some data
      if (hasData) {
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      throw new Error("لا توجد بيانات في الجدول");
    }

    return { headers, rows };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("فشل قراءة الملف. تأكد من أن الملف بصيغة Excel أو CSV صالحة");
  }
}