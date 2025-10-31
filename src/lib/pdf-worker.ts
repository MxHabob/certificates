// src/lib/pdf-worker.ts
import { wrap } from "comlink";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";

const worker = new Worker(
  new URL("./pdf-generator.worker.ts", import.meta.url),
  { type: "module" }
);

const api = wrap<{
  generateAll(
    students: Record<string, any>[],
    fields: any[],
    templateFile: File
  ): Promise<Uint8Array[]>;
}>(worker);

export async function generateAllCertificates(
  students: Record<string, any>[],
  fields: any[],
  templateFile: File,
  fileNameColumn: string | null
) {
  const id = toast.loading(`جاري إنشاء ${students.length} شهادة…`);
  try {
    const pdfBuffers = await api.generateAll(students, fields, templateFile);

    const zip = new JSZip();
    pdfBuffers.forEach((buf, i) => {
      const name = fileNameColumn
        ? String(students[i][fileNameColumn] ?? "").trim()
        : `شهادة_${i + 1}`;
      const safeName = name.replace(/[\\/:*?"<>|]/g, "_") || `شهادة_${i + 1}`;
      zip.file(`${safeName}.pdf`, buf);
    });

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const date = new Date().toISOString().split("T")[0];
    saveAs(blob, `certificates_${date}.zip`);
    toast.success("تم بنجاح!", { id });
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "فشل الإنشاء", { id });
  }
}