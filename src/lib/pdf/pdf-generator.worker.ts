import { expose } from "comlink";
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  rgb,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Field } from "@/types/certificate";
import { MM_TO_PT, PROGRESS_UPDATE_INTERVAL, YIELD_INTERVAL } from "../constants";

// Import arabic-reshaper - handle CommonJS module
let convertArabic: ((text: string) => string) | null = null;

// Initialize reshaper on first use
async function ensureReshaper(): Promise<void> {
  if (!convertArabic) {
    try {
      const reshaperModule = await import('arabic-reshaper');
      // Handle different module formats - arabic-reshaper exports as default function
      if (typeof reshaperModule === 'function') {
        convertArabic = reshaperModule;
      } else if (reshaperModule.default && typeof reshaperModule.default === 'function') {
        convertArabic = reshaperModule.default;
      } else {
        // Fallback: module itself might be the function
        convertArabic = reshaperModule as unknown as (text: string) => string;
      }
    } catch {
      // Fallback if import fails
      convertArabic = (text: string) => text;
    }
  }
}

// Cache font bytes to avoid repeated fetches
let cachedFontBytes: ArrayBuffer | null = null;

async function getFontBytes(): Promise<ArrayBuffer> {
  if (!cachedFontBytes) {
    cachedFontBytes = await fetch("/fonts/NotoSansArabic-Regular.ttf").then(r =>
      r.arrayBuffer()
    );
  }
  if (!cachedFontBytes) {
    throw new Error("Failed to load font file");
  }
  return cachedFontBytes;
}

async function getFont(pdf: PDFDocument): Promise<PDFFont> {
  await getFontBytes(); // Ensure font is cached
  if (!cachedFontBytes) {
    throw new Error("Failed to load font");
  }
  try {
    pdf.registerFontkit(fontkit);
  } catch {
    // Fontkit already registered, ignore
  }
  return await pdf.embedFont(cachedFontBytes, { subset: true });
}

// Cache template image data
let cachedTemplateData: { arrayBuffer: ArrayBuffer; width: number; height: number } | null = null;
let cachedTemplateFileHash: string | null = null;

async function getTemplateData(file: File): Promise<{ arrayBuffer: ArrayBuffer; width: number; height: number }> {
  // Create a simple hash from file size and last modified time
  const hash = `${file.size}-${file.lastModified}`;
  
  if (cachedTemplateData && cachedTemplateFileHash === hash) {
    return cachedTemplateData;
  }
  
  const arrayBuffer = await file.arrayBuffer();
  
  // Parse PNG dimensions directly from the PNG file format
  // PNG header: 8 bytes signature, then IHDR chunk
  // Width and height are at bytes 16-23 (4 bytes each, big-endian)
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 24) {
    throw new Error('Invalid PNG file');
  }
  
  // Check PNG signature
  const signature = new Uint8Array(arrayBuffer.slice(0, 8));
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const isValidPng = signature.every((byte, i) => byte === pngSignature[i]);
  
  if (!isValidPng) {
    throw new Error('File is not a valid PNG');
  }
  
  // Read dimensions from IHDR chunk (bytes 16-23)
  const width = view.getUint32(16, false); // Big-endian
  const height = view.getUint32(20, false); // Big-endian
  
  cachedTemplateData = { arrayBuffer, width, height };
  cachedTemplateFileHash = hash;
  return cachedTemplateData;
}

async function embedTemplate(pdf: PDFDocument, file: File, pageWidth?: number, pageHeight?: number): Promise<{ pngImage: PDFImage; size: { w: number; h: number }; scale: number; templateWidth: number; templateHeight: number }> {
  const { arrayBuffer } = await getTemplateData(file);
  const pngImage = await pdf.embedPng(arrayBuffer);
  const { width, height } = pngImage;
  
  // If page dimensions are provided, scale template to fill page exactly
  let finalWidth = width;
  let finalHeight = height;
  let scale = 1;
  
  if (pageWidth && pageHeight) {
    const pageWidthPt = pageWidth * MM_TO_PT;
    const pageHeightPt = pageHeight * MM_TO_PT;
    // Scale template to fit page dimensions while maintaining aspect ratio
    const scaleX = pageWidthPt / width;
    const scaleY = pageHeightPt / height;
    // Use the smaller scale to ensure template fits within the page
    scale = Math.min(scaleX, scaleY);
    finalWidth = width * scale;
    finalHeight = height * scale;
  }
  
  return { pngImage, size: { w: finalWidth, h: finalHeight }, scale, templateWidth: width, templateHeight: height };
}

async function reshapeArabic(text: string): Promise<string> {
  try {
    await ensureReshaper();
    if (!convertArabic) {
      return text;
    }
    return convertArabic(text);
  } catch {
    return text;
  }
}

function drawField(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any, // PDF-lib PDFPage type with extended methods
  text: string,
  f: Field,
  font: PDFFont,
  pageH: number,
  reshapedText?: string,
  fieldScale?: number
) {
  if (!text) return;

  // Use pre-reshaped text if provided, otherwise use text as-is
  const displayText = reshapedText || text; 

  const size = f.fontSize * (fieldScale ?? 1);
  // Field positions are already in mm, convert to points
  const x = f.x * MM_TO_PT;
  // Y coordinate in PDF is from bottom-left, so we invert it
  // Adjust by font size to account for baseline positioning
  const y = pageH - (f.y * MM_TO_PT) - size;

  // Parse color - support both #RRGGBB and #RGB formats
  let color = rgb(0, 0, 0);
  const colorMatch = f.color?.match(/#([0-9a-f]{6}|[0-9a-f]{3})/i);
  if (colorMatch) {
    const hex = colorMatch[1];
    if (hex.length === 6) {
      color = rgb(
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255
      );
    } else if (hex.length === 3) {
      color = rgb(
        parseInt(hex[0] + hex[0], 16) / 255,
        parseInt(hex[1] + hex[1], 16) / 255,
        parseInt(hex[2] + hex[2], 16) / 255
      );
    }
  }

  // Apply opacity if specified (will use in drawText options)
  const opacity = f.opacity !== undefined ? f.opacity : 1;

  let finalX = x;
  const align = f.align || "center";
  if (align === "center" || align === "right") {
    const textWidth = font.widthOfTextAtSize(displayText, size);
    finalX = align === "center" ? x - textWidth / 2 : x - textWidth;
  }

  // Handle rotation
  if (f.rotation && f.rotation !== 0) {
    page.pushGraphicsState();
    // Translate to text position, rotate, then translate back
    const centerX = finalX;
    const centerY = y + size / 2;
    page.translateContent(centerX, centerY);
    page.rotateDegrees(f.rotation);
    page.translateContent(-centerX, -centerY);
  }

  // Draw text with letter spacing if specified
  const textOptions: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color: ReturnType<typeof rgb>;
    opacity?: number;
  } = {
    x: finalX,
    y,
    size,
    font,
    color,
  };

  if (opacity < 1) {
    textOptions.opacity = opacity;
  }

  if (f.letterSpacing && f.letterSpacing !== 0) {
    // Manual letter spacing - draw each character separately
    let currentX = finalX;
    for (let i = 0; i < displayText.length; i++) {
      const char = displayText[i];
      const charWidth = font.widthOfTextAtSize(char, size);
      page.drawText(char, {
        ...textOptions,
        x: currentX,
      });
      currentX += charWidth + (f.letterSpacing * MM_TO_PT);
    }
  } else {
    // Normal text drawing
    page.drawText(displayText, textOptions);
  }

  // Draw underline if specified
  if (f.underline) {
    const textWidth = font.widthOfTextAtSize(displayText, size);
    const underlineY = y - 2; // 2 points below baseline
    page.drawLine({
      start: { x: finalX, y: underlineY },
      end: { x: finalX + textWidth, y: underlineY },
      thickness: size * 0.05, // 5% of font size
      color,
      opacity,
    });
  }

  // Pop graphics state if rotation was applied
  if (f.rotation && f.rotation !== 0) {
    page.popGraphicsState();
  }
}

interface GenerateOptions {
  pageWidth_mm?: number | null;
  pageHeight_mm?: number | null;
}

const api = {
  async generateAll(
    students: Record<string, string | number | null | undefined>[],
    fields: Field[],
    templateFile: File | null,
    single = false,
    options: GenerateOptions = {}
  ) {
    const buffers: Uint8Array[] = [];

    let sharedPdf: PDFDocument | null = null;
    let sharedFont: PDFFont | null = null;
    let sharedTemplatePng: PDFImage | null = null;
    let sharedTemplateSize: { w: number; h: number } | null = null;
    let pageSize: [number, number];

    // Determine page size from template or use provided dimensions
    if (options.pageWidth_mm && options.pageHeight_mm) {
      pageSize = [
        options.pageWidth_mm * MM_TO_PT,
        options.pageHeight_mm * MM_TO_PT
      ];
    } else if (templateFile) {
      // Get template dimensions
      const { width, height } = await getTemplateData(templateFile);
      const isLandscape = width > height;
      pageSize = [
        (isLandscape ? 297 : 210) * MM_TO_PT,
        (isLandscape ? 210 : 297) * MM_TO_PT
      ];
    } else {
      pageSize = [210 * MM_TO_PT, 297 * MM_TO_PT];
    }

    // Pre-load shared resources for single PDF mode
    let sharedTemplateScale: number | undefined;
    if (single) {
      sharedPdf = await PDFDocument.create();
      sharedFont = await getFont(sharedPdf);
      if (templateFile) {
        const result = await embedTemplate(
          sharedPdf,
          templateFile,
          options.pageWidth_mm || undefined,
          options.pageHeight_mm || undefined
        );
        sharedTemplatePng = result.pngImage;
        sharedTemplateSize = result.size;
        sharedTemplateScale = result.scale;
      }
    }

    for (let i = 0; i < students.length; i++) {
      let currentPdf: PDFDocument;
      let page: { drawText: (text: string, options: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> }) => void; getHeight: () => number; drawImage: (image: PDFImage, options: { x: number; y: number; width: number; height: number }) => void; getSize: () => { width: number; height: number } };
      let font: PDFFont;
      let templatePng: PDFImage | null = null;
      let templateSize: { w: number; h: number } | null = null;
      let templateScale: number | undefined;

      if (single) {
        currentPdf = sharedPdf!;
        font = sharedFont!;
        templatePng = sharedTemplatePng;
        templateSize = sharedTemplateSize;
        templateScale = sharedTemplateScale;
        page = currentPdf.addPage(pageSize);
      } else {
        currentPdf = await PDFDocument.create();
        font = await getFont(currentPdf);
        if (templateFile) {
          const result = await embedTemplate(
            currentPdf,
            templateFile,
            options.pageWidth_mm || undefined,
            options.pageHeight_mm || undefined
          );
          templatePng = result.pngImage;
          templateSize = result.size;
          templateScale = result.scale;
        }
        page = currentPdf.addPage(pageSize);
      }

      // Draw template image (if exists) - scale to fill page exactly
      if (templatePng && templateSize) {
        // Center the template if it doesn't fill the entire page
        const offsetX = templateSize.w < pageSize[0] ? (pageSize[0] - templateSize.w) / 2 : 0;
        const offsetY = templateSize.h < pageSize[1] ? (pageSize[1] - templateSize.h) / 2 : 0;
        page.drawImage(templatePng, {
          x: offsetX,
          y: offsetY,
          width: templateSize.w,
          height: templateSize.h,
        });
      }

      // Calculate field scale factor based on template-to-page scaling
      // If template dimensions were provided, fields are positioned relative to those dimensions
      // We need to scale them to match the actual template size on the page
      let fieldScale = 1;
      if (templateScale && options.pageWidth_mm && options.pageHeight_mm) {
        // Fields are positioned in mm relative to template dimensions
        // Template is scaled by templateScale, so fields need same scaling
        fieldScale = templateScale;
      }

      // Draw fields
      const student = students[i];
      for (const f of fields) {
        if (f.enabled === false) continue;
        const txt = f.column
          ? String(student[f.column] ?? "").trim()
          : (f.value ?? "");
        if (txt) {
          // Reshape Arabic text
          const reshaped = await reshapeArabic(txt);
          
          // Calculate field position accounting for template scaling and centering
          // Fields are positioned in mm relative to template dimensions
          // Template is scaled and may be centered on page
          const templateOffsetX = templateSize && templateSize.w < pageSize[0] ? (pageSize[0] - templateSize.w) / 2 : 0;
          const templateOffsetY = templateSize && templateSize.h < pageSize[1] ? (pageSize[1] - templateSize.h) / 2 : 0;
          
          // Create adjusted field with scaled and offset positions
          const adjustedField: Field = {
            ...f,
            // Convert mm to points, apply scale, then add template offset
            x: (f.x * MM_TO_PT * fieldScale + templateOffsetX) / MM_TO_PT,
            y: (f.y * MM_TO_PT * fieldScale + templateOffsetY) / MM_TO_PT,
          };
          
          // Draw field without additional scaling since we already applied it above
          drawField(page, txt, adjustedField, font, page.getHeight(), reshaped, 1);
        }
      }

      if (!single) {
        buffers.push(await currentPdf.save());
      }

      // Progress update at intervals or at the end
      if (i % PROGRESS_UPDATE_INTERVAL === PROGRESS_UPDATE_INTERVAL - 1 || i === students.length - 1) {
        self.postMessage({ type: "progress", done: i + 1, total: students.length });
      }

      // Yield to browser at intervals to keep UI responsive
      if (i % YIELD_INTERVAL === YIELD_INTERVAL - 1) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    if (single && sharedPdf) {
      buffers.push(await sharedPdf.save());
    }

    return { buffers, total: students.length };
  },
};

expose(api);