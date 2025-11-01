// src/types/pdf-lib.d.ts
declare module "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js" {
    export * from "pdf-lib";
    export { PDFDocument, PDFFont, rgb } from "pdf-lib";
  }
  
  declare module "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js" {
    const fontkit: any;
    export default fontkit;
  }