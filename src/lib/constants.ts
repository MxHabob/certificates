/**
 * Application constants and configuration
 */

// Conversion constants
export const MM_TO_PX = 3.779527559; // 96 DPI
export const MM_TO_PT = 2.83464567;  // Points per millimeter
export const PT_TO_MM = 1 / MM_TO_PT;

// Default page sizes (A4 in mm)
export const DEFAULT_PAGE_WIDTH_MM = 210;
export const DEFAULT_PAGE_HEIGHT_MM = 297;

// Field defaults
export const DEFAULT_FONT_SIZE = 14;
export const DEFAULT_FIELD_COLOR = "#000000";
export const DEFAULT_FIELD_ALIGN: "left" | "center" | "right" = "center";

// Canvas defaults
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 1.3;

// Performance settings
export const PROGRESS_UPDATE_INTERVAL = 5; // Update progress every N certificates
export const YIELD_INTERVAL = 10; // Yield to browser every N certificates

// File validation
export const MAX_FILE_SIZE_MB = 50;
export const ACCEPTED_EXCEL_TYPES = [".xlsx", ".xls", ".csv"];
export const ACCEPTED_IMAGE_TYPES = ["image/png"];

// Error messages
export const ERROR_MESSAGES = {
  NO_DATA: "لا توجد بيانات لإنشاء الشهادات",
  NO_TEMPLATE: "يرجى رفع قالب الشهادة",
  NO_FIELDS: "يرجى إضافة حقول إلى الشهادة",
  INCOMPLETE_STEPS: "أكمل جميع الخطوات",
  FILE_READ_ERROR: "فشل قراءة الملف",
  GENERATION_ERROR: "حدث خطأ أثناء إنشاء الشهادات",
  INVALID_PNG: "يرجى رفع PNG فقط",
} as const;

