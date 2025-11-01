declare module 'arabic-reshaper' {
  function convertArabic(text: string): string;
  export = convertArabic; // This is the key - it uses CommonJS exports
}