declare module 'arabic-reshaper' {
  /**
   * Converts Arabic text to its correct presentation form (connected letters, RTL).
   * @param text The input Arabic string
   * @returns Reshaped string ready for PDF rendering
   */
  function convertArabic(text: string): string;
  export = convertArabic;
}