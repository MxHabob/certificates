// src/lib/pdf-generator.worker.ts
import { expose } from "comlink";
import { PDFDocument, PDFFont, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const MM_TO_PT = 2.83464567;

async function loadFont(): Promise<PDFFont> {
  const fontBytes = await fetch("/fonts/NotoSansArabic-Regular.ttf").then((res) =>
    res.arrayBuffer()
  );
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  return await pdfDoc.embedFont(fontBytes, { subset: true });
}

async function loadTemplateImage(file: File): Promise<{
  imageBytes: Uint8Array;
  width: number;
  height: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const imageBytes = new Uint8Array(arrayBuffer);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ imageBytes, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

async function createPdf(
  student: Record<string, any>,
  fields: any[],
  template: { imageBytes: Uint8Array; width: number; height: number } | null,
  font: PDFFont
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const isLandscape = template ? template.width > template.height : false;
  const page = pdfDoc.addPage(isLandscape ? [297, 210] : [210, 297]);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  if (template) {
    const pngImage = await pdfDoc.embedPng(template.imageBytes);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  for (const f of fields) {
    if (f.enabled === false) continue;
    const text = f.column ? String(student[f.column] ?? "").trim() : f.value ?? "";
    if (!text) continue;

    const fontSize = f.fontSize;
    const x_mm = f.x;
    const y_mm = f.y;
    const x_pt = x_mm * MM_TO_PT;
    const y_pt = pageHeight - y_mm * MM_TO_PT - fontSize * 0.35;

    const color = f.color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    const r = color ? parseInt(color[1], 16) / 255 : 0;
    const g = color ? parseInt(color[2], 16) / 255 : 0;
    const b = color ? parseInt(color[3], 16) / 255 : 0;

    let finalX = x_pt;

    if (f.align === "center" || f.align === "right") {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      if (f.align === "center") {
        finalX = x_pt - textWidth / 2;
      } else if (f.align === "right") {
        finalX = x_pt - textWidth;
      }
    }

    page.drawText(text, {
      x: finalX,
      y: y_pt,
      size: fontSize,
      font,
      color: rgb(r, g, b),
    });
  }

  return await pdfDoc.save();
}

let cachedFont: PDFFont | null = null;

const api = {
  async generateAll(
    students: Record<string, any>[],
    fields: any[],
    templateFile: File
  ): Promise<Uint8Array[]> {
    if (!cachedFont) {
      cachedFont = await loadFont();
    }

    let template = null;
    if (templateFile) {
      try {
        template = await loadTemplateImage(templateFile);
      } catch (e) {
        throw new Error("فشل تحميل القالب");
      }
    }

    const result: Uint8Array[] = [];
    for (let i = 0; i < students.length; i++) {
      const pdfBytes = await createPdf(students[i], fields, template, cachedFont);
      result.push(pdfBytes);

      if (i % 5 === 4) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    return result;
  },
};

expose(api);