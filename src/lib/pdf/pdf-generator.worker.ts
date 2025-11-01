import { expose } from "comlink";
import {
  PDFDocument,
  PDFFont,
  rgb,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as ArabicReshaper from 'arabic-reshaper';

const MM_TO_PT = 2.83464567;

async function getFont(pdf: PDFDocument): Promise<PDFFont> {
  const fontBytes = await fetch("/fonts/NotoSansArabic-Regular.ttf").then(r =>
    r.arrayBuffer()
  );
  pdf.registerFontkit(fontkit);
  return await pdf.embedFont(fontBytes, { subset: true });
}

async function embedTemplate(pdf: PDFDocument, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pngImage = await pdf.embedPng(arrayBuffer);
  const { width, height } = pngImage;
  return { pngImage, size: { w: width, h: height } };
}

function drawField(
  page: any,
  text: string,
  f: any,
  font: PDFFont,
  pageH: number
) {
  if (!text) return;

  const reshapedText = ArabicReshaper.convertArabic(text); 

  const size = f.fontSize;
  const x = f.x * MM_TO_PT;
  const y = pageH - f.y * MM_TO_PT - size;

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
    const w = font.widthOfTextAtSize(reshapedText, size);
    finalX = f.align === "center" ? x - w / 2 : x - w;
  }

  page.drawText(reshapedText, {
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
    single = false
  ) {
    const buffers: Uint8Array[] = [];

    let sharedPdf: PDFDocument | null = null;
    let sharedFont: PDFFont | null = null;
    let sharedTemplatePng: any | null = null;
    let pageSize: [number, number] | null = null;

    if (templateFile) {
      const tempPdf = await PDFDocument.create();
      const { size: templateSize } = await embedTemplate(tempPdf, templateFile);
      const isLandscape = templateSize.w > templateSize.h;
      const widthPt = (isLandscape ? 297 : 210) * MM_TO_PT;
      const heightPt = (isLandscape ? 210 : 297) * MM_TO_PT;
      pageSize = [widthPt, heightPt];
    } else {
      pageSize = [210 * MM_TO_PT, 297 * MM_TO_PT];
    }

    if (single) {
      sharedPdf = await PDFDocument.create();
      sharedFont = await getFont(sharedPdf);
      if (templateFile) {
        const { pngImage } = await embedTemplate(sharedPdf, templateFile);
        sharedTemplatePng = pngImage;
      }
    }

    for (let i = 0; i < students.length; i++) {
      let currentPdf: PDFDocument;
      let page: any;
      let font: PDFFont;
      let templatePng: any | null = null;

      if (single) {
        currentPdf = sharedPdf!;
        font = sharedFont!;
        templatePng = sharedTemplatePng;
        page = currentPdf.addPage(pageSize);
      } else {
        currentPdf = await PDFDocument.create();
        font = await getFont(currentPdf);
        if (templateFile) {
          const { pngImage } = await embedTemplate(currentPdf, templateFile);
          templatePng = pngImage;
        }
        page = currentPdf.addPage(pageSize);
      }

      // رسم القالب (إذا وجد)
      if (templatePng) {
        const { width, height } = page.getSize();
        page.drawImage(templatePng, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      // رسم الحقول
      const student = students[i];
      for (const f of fields) {
        if (f.enabled === false) continue;
        const txt = f.column
          ? String(student[f.column] ?? "").trim()
          : f.value ?? "";
        drawField(page, txt, f, font, page.getHeight());
      }

      if (!single) {
        buffers.push(await currentPdf.save());
      }

      self.postMessage({ type: "progress", done: i + 1, total: students.length });

      if (i % 8 === 7) await new Promise(r => setTimeout(r, 0));
    }

    if (single && sharedPdf) {
      buffers.push(await sharedPdf.save());
    }

    return { buffers, total: students.length };
  },
};

expose(api);