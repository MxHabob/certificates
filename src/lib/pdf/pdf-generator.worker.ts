// src/lib/pdf/pdf-generator.worker.ts
import { expose } from "comlink";
import {
  PDFDocument,
  PDFFont,
  rgb,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const MM_TO_PT = 2.83464567;

let cachedFont: PDFFont | null = null;
let cachedTemplatePng: any | null = null; // embedded PNG
let cachedTemplateSize: { w: number; h: number } | null = null;

async function getFont(pdf: PDFDocument): Promise<PDFFont> {
  if (cachedFont) return cachedFont;
  const fontBytes = await fetch("/fonts/NotoSansArabic-Regular.ttf").then(r =>
    r.arrayBuffer()
  );
  pdf.registerFontkit(fontkit);
  cachedFont = await pdf.embedFont(fontBytes, { subset: true });
  return cachedFont;
}

async function embedTemplate(pdf: PDFDocument, file: File) {
  if (cachedTemplatePng) return cachedTemplatePng;

  const arrayBuffer = await file.arrayBuffer();
  const pngImage = await pdf.embedPng(arrayBuffer);
  const { width, height } = pngImage;

  cachedTemplatePng = pngImage;
  cachedTemplateSize = { w: width, h: height };
  return pngImage;
}

function drawField(
  page: any,
  text: string,
  f: any,
  font: PDFFont,
  pageH: number
) {
  const size = f.fontSize;
  const x = f.x * MM_TO_PT;
  const y = pageH - f.y * MM_TO_PT - size * 0.35;

  const match = f.color.match(/#(..)(..)(..)/);
  const color = match
    ? rgb(
        parseInt(match[1], 16) / 255,
        parseInt(match[2], 16) / 255,
        parseInt(match[3], 16) / 255
      )
    : rgb(0, 0, 0);

  let finalX = x;
  if (f.align === "center" || f.align === "right") {
    const w = font.widthOfTextAtSize(text, size);
    finalX = f.align === "center" ? x - w / 2 : x - w;
  }

  page.drawText(text, {
    x: finalX,
    y,
    size,
    font,
    color,
  });
}

const api = {
  async generateAll(
    students: Record<string, any>[],
    fields: any[],
    templateFile: File | null,
    singlePdf: boolean
  ) {
    const pdf = await PDFDocument.create();
    const font = await getFont(pdf);

    let pageSize: [number, number] = [210, 297];
    let templatePng: any = null;

    if (templateFile) {
      templatePng = await embedTemplate(pdf, templateFile);
      const isLandscape = cachedTemplateSize!.w > cachedTemplateSize!.h;
      pageSize = isLandscape ? [297, 210] : [210, 297];
    }

    const buffers: Uint8Array[] = [];

    for (let i = 0; i < students.length; i++) {
      // Always create a fresh page in the same doc for singlePdf
      // For ZIP: create a new doc per certificate
      let currentPdf: PDFDocument;
      let page: any;

      if (singlePdf) {
        currentPdf = pdf;
        page = pdf.addPage(pageSize);
      } else {
        currentPdf = await PDFDocument.create();
        page = currentPdf.addPage(pageSize);
      }

      // Draw template background (if any)
      if (templatePng) {
        const { width, height } = page.getSize();
        page.drawImage(templatePng, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      // Draw fields
      const student = students[i];
      for (const f of fields) {
        if (f.enabled === false) continue;
        const txt = f.column
          ? String(student[f.column] ?? "").trim()
          : f.value ?? "";
        if (txt) drawField(page, txt, f, font, page.getHeight());
      }

      // Save
      const bytes = singlePdf ? await pdf.save() : await currentPdf.save();
      buffers.push(bytes);

      // Progress
      self.postMessage({ type: "progress", done: i + 1, total: students.length });

      if (i % 8 === 7) await new Promise(r => setTimeout(r, 0));
    }

    return { buffers, total: students.length };
  },
};

expose(api);