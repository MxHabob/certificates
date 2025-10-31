import * as XLSX from "xlsx";

export async function parseExcel(file: File) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("No worksheet found");

  const range = XLSX.utils.decode_range(ws["!ref"]!);
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    headers.push(cell ? String(cell.v ?? "") : "");
  }

  const rows: Record<string, any>[] = [];
  for (let R = 1; R <= range.e.r; ++R) {
    const row: Record<string, any> = {};
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const header = headers[C];
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      row[header] = cell ? cell.v ?? "" : "";
    }
    rows.push(row);
  }

  return { headers, rows };
}