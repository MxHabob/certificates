// src/lib/pdf/pdf-generator.worker.ts
/// <reference lib="webworker" />
import { expose } from "comlink";

let arabicReshaper: any;
async function loadArabicReshaper() {
  if (!arabicReshaper) {
    arabicReshaper = await import("arabic-reshaper");
  }
  return arabicReshaper;
}
const MM_TO_PT = 2.83464567;

async function loadPdfLib() {
  const [pdfLib, fontkitLib] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);
  return {
    PDFDocument: pdfLib.PDFDocument,
    rgb: pdfLib.rgb,
    fontkit: fontkitLib.default,
  };
}

async function getFont(pdf: any, fontkit: any) {
  const fontBytes = await fetch("/fonts/NotoSansArabic-Regular.ttf").then(r =>
    r.arrayBuffer()
  );
  pdf.registerFontkit(fontkit);
  return pdf.embedFont(fontBytes, { subset: true });
}

async function embedTemplate(pdf: any, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pngImage = await pdf.embedPng(arrayBuffer);
  const { width, height } = pngImage;
  return { pngImage, size: { w: width, h: height } };
}

async function drawField(page: any, text: string, f: any, font: any, pageH: number) {
  if (!text) return;
  const reshaper = await loadArabicReshaper();
  const reshapedText = reshaper.convertArabic(text);
  const size = f.fontSize;
  const x = f.x * MM_TO_PT;
  const y = pageH - f.y * MM_TO_PT - size;

  const match = f.color.match(/#(..)(..)(..)/);
  const color = match
    ? page.doc.context.obj.rgb(
        parseInt(match[1], 16) / 255,
        parseInt(match[2], 16) / 255,
        parseInt(match[3], 16) / 255
      )
    : page.doc.context.obj.rgb(0, 0, 0);

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
    const { PDFDocument, fontkit } = await loadPdfLib();

    const buffers: Uint8Array[] = [];
    let sharedPdf: any = null;
    let sharedFont: any = null;
    let sharedTemplatePng: any = null;
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
      sharedFont = await getFont(sharedPdf, fontkit);
      if (templateFile) {
        const { pngImage } = await embedTemplate(sharedPdf, templateFile);
        sharedTemplatePng = pngImage;
      }
    }

    for (let i = 0; i < students.length; i++) {
      let currentPdf: any;
      let page: any;
      let font: any;
      let templatePng: any = null;

      if (single) {
        currentPdf = sharedPdf;
        font = sharedFont;
        templatePng = sharedTemplatePng;
        page = currentPdf.addPage(pageSize);
      } else {
        currentPdf = await PDFDocument.create();
        font = await getFont(currentPdf, fontkit);
        if (templateFile) {
          const { pngImage } = await embedTemplate(currentPdf, templateFile);
          templatePng = pngImage;
        }
        page = currentPdf.addPage(pageSize);
      }

      if (templatePng) {
        const { width, height } = page.getSize();
        page.drawImage(templatePng, { x: 0, y: 0, width, height });
      }

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