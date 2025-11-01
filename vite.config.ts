// vite.config.ts
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      mangle: {
        reserved: [
          // Preserve PDF-lib class names
          'PDFDocument', 'PDFPage', 'PDFFont', 'PDFImage',
          'PDFForm', 'PDFTextField', 'PDFDropdown', 'PDFOptionList',
          'PDFButton', 'PDFCheckBox', 'PDFRadioGroup', 'PDFSignature',
          'PDFEmbeddedPage', 'PDFEmbeddedFile', 'PDFJavaScript',
          'PDFObject', 'PDFRef', 'PDFStream', 'PDFArray', 'PDFDict',
          'PDFName', 'PDFNumber', 'PDFHexString', 'PDFString',
          'PDFNull', 'PDFBool', 'PDFOperator', 'PDFRawStream',
          'PDFContentStream', 'PDFHeader', 'PDFTrailer', 'PDFXRef',
          'PDFWriter', 'PDFReader', 'PDFObjectParser', 'PDFObjectCopier',
          'PDFObjectStreamParser', 'PDFObjectStream', 'PDFPageEmbedder',
          'PDFWidgetAnnotation', 'PDFAcroForm', 'PDFAcroTextField',
          'PDFAcroComboBox', 'PDFAcroListBox', 'PDFAcroCheckBox',
          'PDFAcroRadioButton', 'PDFAcroPushButton', 'PDFAcroSignature',
          'PDFDocumentFactory', 'PDFDocumentWriter', 'StandardFonts',
          'RGB', 'CMYK', 'Grayscale', 'HSB', 'Lab', 'ColorSpace',
          'PDFInvalidObject', 'PDFContext',
          // Comlink functions
          'expose', 'wrap', 'transfer', 'proxy',
          // Our functions
          'generateAll', 'drawField', 'loadPdfLib', 'getFont', 'embedTemplate'
        ],
        keep_classnames: true, // Preserve class names
        keep_fnames: true,     // Preserve function names
      },
      compress: {
        drop_console: true,
        keep_classnames: true, // Also preserve in compression
        keep_fnames: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ['pdf-lib', '@pdf-lib/fontkit'],
          utils: ['jszip', 'file-saver', 'comlink', 'arabic-reshaper']
        }
      }
    }
  },

  worker: {
    format: "es",
  },
});