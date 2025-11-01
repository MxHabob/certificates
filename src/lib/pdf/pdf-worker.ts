import { wrap } from "comlink";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ERROR_MESSAGES } from "../constants";

const worker = new Worker(
  new URL("./pdf-generator.worker.ts", import.meta.url),
  { type: "module" }
);

const api = wrap<{
  generateAll(
    students: Record<string, any>[],
    fields: any[],
    templateFile: File | null,
    singlePdf: boolean,
    options?: { pageWidth_mm?: number | null; pageHeight_mm?: number | null }
  ): Promise<{ buffers: Uint8Array[]; total: number }>;
}>(worker);

export async function generateCertificates(
  students: Record<string, any>[],
  fields: any[],
  templateFile: File | null,
  fileNameCol: string | null,
  singlePdf = false,
  pageWidth_mm?: number | null,
  pageHeight_mm?: number | null
) {
  if (!students.length) {
    toast.error(ERROR_MESSAGES.NO_DATA);
    return;
  }

  const toastId = toast.loading(`0 / ${students.length} شهادة…`);

  // progress listener
  const onProgress = (e: MessageEvent) => {
    if (e.data?.type === "progress") {
      toast.loading(`${e.data.done} / ${e.data.total} شهادة…`, { id: toastId });
    }
  };
  worker.addEventListener("message", onProgress);

  try {
    const { buffers, total } = await api.generateAll(
      students,
      fields,
      templateFile,
      singlePdf,
      { pageWidth_mm, pageHeight_mm }
    );

    if (singlePdf) {
      const blob = new Blob([buffers[0] as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `شهادات_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const zip = new JSZip();
      buffers.forEach((buf, i) => {
        const name =
          fileNameCol && students[i][fileNameCol]
            ? String(students[i][fileNameCol]).trim()
            : `شهادة_${i + 1}`;
        const safe = name.replace(/[\\/:*?"<>|]/g, "_") || `شهادة_${i + 1}`;
        zip.file(`${safe}.pdf`, buf);
      });
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      saveAs(blob, `شهادات_${new Date().toISOString().split("T")[0]}.zip`);
    }

    toast.success(`تم إنشاء ${total} شهادة`, { id: toastId });
  } catch (err: any) {
    toast.error(err.message || ERROR_MESSAGES.GENERATION_ERROR, { id: toastId });
  } finally {
    worker.removeEventListener("message", onProgress);
  }
}