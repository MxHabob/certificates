import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import type { Template } from "@/types/template"

/* ------------------------------------------------------------------ */
/* 1. oklch → rgb (آمن وسريع)                                         */
/* ------------------------------------------------------------------ */
const oklchToRgb = (s: string): string => {
  const m = s.match(/oklch\(([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i)
  if (!m) return "rgb(0,0,0)"
  const lRaw = parseFloat(m[1])
  const l = m[2] === "%" ? lRaw / 100 : lRaw
  const c = parseFloat(m[3])
  const h = parseFloat(m[4])
  const a = m[5] ? parseFloat(m[5]) : 1
  if (c === 0) { const v = Math.round(l * 255); return a < 1 ? `rgba(${v},${v},${v},${a})` : `rgb(${v},${v},${v})` }
  const rad = (h * Math.PI) / 180
  const r = Math.round(255 * (l + c * Math.cos(rad)))
  const g = Math.round(255 * (l + c * Math.sin(rad)))
  const b = Math.round(255 * (l - c))
  const clamp = (n: number) => Math.max(0, Math.min(255, n))
  return a < 1 ? `rgba(${clamp(r)},${clamp(g)},${clamp(b)},${a})` : `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`
}

/* ------------------------------------------------------------------ */
/* 2. تحويل كل الألوان إلى RGB قبل html2canvas                        */
/* ------------------------------------------------------------------ */
const forceRgb = (root: HTMLElement): void => {
  const replaceOklch = (val: string): string =>
    val.replace(/oklch\([^)]*\)/gi, (m) => oklchToRgb(m))

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  let node: HTMLElement | null
  while ((node = walker.nextNode() as HTMLElement | null)) {
    const cs = getComputedStyle(node), style = node.style
    const convert = (prop: keyof CSSStyleDeclaration, fallback = "rgb(0,0,0)") => {
      const val = cs[prop] as string
      if (val?.includes("oklch")) (style as unknown as Record<string, string>)[prop as string] = replaceOklch(val) || fallback
    }
    convert("color")
    // background color
    const isRoot = node === root
    const bgColor = cs.backgroundColor as string
    if (bgColor?.includes("oklch")) {
      ;(style as unknown as Record<string, string>)["backgroundColor"] = isRoot ? "#ffffff" : "transparent"
    } else if (bgColor) {
      ;(style as unknown as Record<string, string>)["backgroundColor"] = bgColor
    }
    // background shorthand and images/gradients
    const bg = cs.background as string
    if (bg && bg.includes("oklch")) {
      style.background = isRoot ? "#ffffff" : "none"
    }
    // Always remove background images to avoid color functions inside gradients
    if (cs.backgroundImage && cs.backgroundImage !== "none") {
      style.backgroundImage = "none"
    }
    convert("borderTopColor")
    convert("borderRightColor")
    convert("borderBottomColor")
    convert("borderLeftColor")
    convert("outlineColor")
    convert("columnRuleColor")
    convert("caretColor")
    // shadow props can include multiple colors; replace occurrences
    const boxShadow = cs.boxShadow
    if (boxShadow?.includes("oklch")) style.boxShadow = replaceOklch(boxShadow)
    const textShadow = cs.textShadow
    if (textShadow?.includes("oklch")) style.textShadow = replaceOklch(textShadow)
    // CSS Variables (Tailwind)
    const cssVarsToNormalize = [
      "--background","--foreground","--card","--muted","--accent","--border","--ring",
      "--primary","--secondary","--destructive",
    ]
    for (const name of cssVarsToNormalize) {
      const val = cs.getPropertyValue(name).trim()
      if (val && val.includes("oklch")) style.setProperty(name, replaceOklch(val))
    }
    for (let i = 0; i < 200; i++) {
      const name = `--tw-${i}`
      const val = cs.getPropertyValue(name).trim()
      if (val && val.includes("oklch")) style.setProperty(name, replaceOklch(val))
    }
  }
}

/* ------------------------------------------------------------------ */
/* 2.b تحميل صورة كـ DataURL لضمان عملها مع html2canvas/CORS           */
/* ------------------------------------------------------------------ */
const toDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* 3. إعادة تعيين التنسيق + أسلوب تعطيل متغيرات OKLCH عالمياً          */
/* ------------------------------------------------------------------ */
const createResetStyle = (): HTMLStyleElement => {
  const s = document.createElement("style")
  s.textContent = `
    .pdf-container {
      all: initial !important;
      display: block !important;
      position: absolute !important;
      background:#fff !important;
      isolation:isolate !important;
      font-family: Arial, sans-serif !important;
    }
    .pdf-container, .pdf-container * {
      box-shadow: none !important;
      text-shadow: none !important;
      background-image: none !important;
      filter: none !important;
    }
    .pdf-container *::before,
    .pdf-container *::after {
      content: none !important;
      background: none !important;
      background-image: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    .pdf-container img { max-width:100%; height:auto; display:block; }
  `
  return s
}

// Removed global theme override. We now only set safe CSS variables on the
// isolated `.pdf-container` element and inside the html2canvas clone. This
// prevents theme flashing or layout shifts in the main app during export.

/* ------------------------------------------------------------------ */
/* 4. تصدير PDF – معالجة الأخطاء + تسجيل واضح                         */
/* ------------------------------------------------------------------ */
type ExportOptions = {
  scale?: number
  quality?: number
  onProgress?: (current: number, total: number) => void
  signal?: AbortSignal
}

type DataRow = Record<string, unknown>

export const exportBatchPDF = async (
  data: DataRow[],
  template: Template,
  filename: string,
  options: ExportOptions = {}
): Promise<void> => {
  const { scale = 1.5, quality = 0.95, onProgress, signal } = options
  const pdf = new jsPDF({
    orientation: template.width > template.height ? "landscape" : "portrait",
    unit: "px",
    format: [template.width, template.height],
  })

  const reset = createResetStyle()
  document.head.appendChild(reset)

  try {
    // حاوية واحدة قابلة لإعادة الاستخدام
    const container = document.createElement("div")
    container.className = "pdf-container"
    container.style.cssText = `
      left:-9999px; top:0; width:${template.width}px; height:${template.height}px;
      overflow:hidden; background:#fff;
    `
    document.body.appendChild(container)
    // Force safe CSS variables on container to defeat oklch-based tokens
    const safeVars: Record<string, string> = {
      "--background": "#ffffff",
      "--foreground": "#111111",
      "--card": "#ffffff",
      "--card-foreground": "#111111",
      "--popover": "#ffffff",
      "--popover-foreground": "#111111",
      "--primary": "#222222",
      "--primary-foreground": "#fafafa",
      "--secondary": "#f3f3f3",
      "--secondary-foreground": "#222222",
      "--muted": "#f3f3f3",
      "--muted-foreground": "#6b7280",
      "--accent": "#f3f3f3",
      "--accent-foreground": "#222222",
      "--destructive": "#dc2626",
      "--border": "#e5e7eb",
      "--input": "#e5e7eb",
      "--ring": "#a3a3a3",
      "--chart-1": "#7c3aed",
      "--chart-2": "#06b6d4",
      "--chart-3": "#2563eb",
      "--chart-4": "#22c55e",
      "--chart-5": "#f59e0b",
      "--sidebar": "#fafafa",
      "--sidebar-foreground": "#111111",
      "--sidebar-primary": "#222222",
      "--sidebar-primary-foreground": "#fafafa",
      "--sidebar-accent": "#f3f3f3",
      "--sidebar-accent-foreground": "#222222",
      "--sidebar-border": "#e5e7eb",
      "--sidebar-ring": "#a3a3a3",
    }
    for (const [k, v] of Object.entries(safeVars)) container.style.setProperty(k, v)

    // الخلفية (تحميل مرة واحدة)
    let bgEl: HTMLImageElement | null = null
    if (template.backgroundImage) {
      bgEl = document.createElement("img")
      bgEl.crossOrigin = "anonymous"
      bgEl.setAttribute("referrerpolicy", "no-referrer")
      bgEl.decoding = "sync"
      bgEl.loading = "eager"
      bgEl.setAttribute("data-bg", "1")
      bgEl.style.cssText = `position:absolute;top:0;left:0;width:${template.width}px;height:${template.height}px;z-index:0;object-fit:cover;`
      container.appendChild(bgEl)
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.setAttribute("referrerpolicy", "no-referrer")
        const loaded = new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => {
            console.warn(`[PDF] فشل تحميل الصورة: ${template.backgroundImage}`)
            resolve()
          }
        })
        img.src = template.backgroundImage
        await Promise.race([
          loaded,
          new Promise<void>((r) => setTimeout(r, 5000)),
        ])
        // حاول تحويل الصورة إلى DataURL لتجاوز مشاكل CORS في html2canvas
        const dataUrl = await toDataUrl(img.src)
        bgEl.src = dataUrl || img.src
        if ("decode" in bgEl && typeof (bgEl as HTMLImageElement).decode === "function") {
          try {
            await (bgEl as HTMLImageElement).decode()
          } catch (err) {
            // Some browsers may throw on decode; continue without blocking
            console.debug("[PDF] decode() not supported or failed:", err)
          }
        }
      } catch (e) {
        console.warn("[PDF] خطأ في تحميل الصورة:", e)
      }
    }

    // عناصر الحقول (تبنى مرة واحدة ثم نحدث النص فقط)
    const fieldEls = template.fields.map((f) => {
      const el = document.createElement("div")
      const color = /^#|rgb/.test(f.color || "") ? f.color : "#000000"
      el.style.cssText = `
        position:absolute; left:${f.x}px; top:${f.y}px;
        font-size:${f.fontSize || 16}px; font-family:${f.fontFamily || "Arial"};
        font-weight:${f.fontWeight || "normal"}; text-align:${f.textAlign || "right"};
        white-space:nowrap; direction:rtl; color:${color}; background:transparent; z-index:1;
      `
      container.appendChild(el)
      return { f, el }
    })

    for (let i = 0; i < data.length; i++) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
      const row = data[i]
      onProgress?.(i, data.length)

      // تحديث النصوص فقط
      for (const { f, el } of fieldEls) {
        const value = row[f.name as keyof DataRow]
        el.textContent = value != null ? String(value) : `{${f.name}}`
      }

      // تحويل الألوان
      forceRgb(container)
      await new Promise(requestAnimationFrame)

      // التقاط
      const canvas = await html2canvas(container, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: template.width,
        height: template.height,
        onclone: (clonedDoc: Document) => {
          const clonedContainer = clonedDoc.querySelector('.pdf-container') as HTMLElement | null
          if (!clonedContainer) return
          // inject reset styles into the cloned document
          const resetInClone = clonedDoc.createElement('style')
          resetInClone.textContent = `
            .pdf-container, .pdf-container * { box-shadow:none!important; text-shadow:none!important; background-image:none!important; filter:none!important; }
            .pdf-container *::before, .pdf-container *::after { content:none!important; background:none!important; background-image:none!important; box-shadow:none!important; text-shadow:none!important; }
          `
          clonedDoc.head.appendChild(resetInClone)
          // enforce safe vars in clone (on container)
          const setVar = (k: string, v: string) => clonedContainer.style.setProperty(k, v)
          const cloneVars: Record<string,string> = {
            "--background": "#ffffff",
            "--foreground": "#111111",
            "--card": "#ffffff",
            "--card-foreground": "#111111",
            "--popover": "#ffffff",
            "--popover-foreground": "#111111",
            "--primary": "#222222",
            "--primary-foreground": "#fafafa",
            "--secondary": "#f3f3f3",
            "--secondary-foreground": "#222222",
            "--muted": "#f3f3f3",
            "--muted-foreground": "#6b7280",
            "--accent": "#f3f3f3",
            "--accent-foreground": "#222222",
            "--destructive": "#dc2626",
            "--border": "#e5e7eb",
            "--input": "#e5e7eb",
            "--ring": "#a3a3a3",
          }
          for (const [k,v] of Object.entries(cloneVars)) setVar(k,v)
          // Also ensure the root/background of the cloned document is plain white
          const htmlEl = clonedDoc.documentElement as HTMLElement
          const bodyEl = clonedDoc.body as HTMLElement
          if (htmlEl) htmlEl.style.backgroundColor = '#ffffff'
          if (bodyEl) bodyEl.style.backgroundColor = '#ffffff'
          // Ensure background image in clone has correct sizing and source
          const clonedBg = clonedContainer.querySelector('img[data-bg="1"]') as HTMLImageElement | null
          if (clonedBg) {
            clonedBg.crossOrigin = 'anonymous'
            clonedBg.setAttribute('referrerpolicy', 'no-referrer')
            clonedBg.style.position = 'absolute'
            clonedBg.style.top = '0'
            clonedBg.style.left = '0'
            clonedBg.style.width = `${template.width}px`
            clonedBg.style.height = `${template.height}px`
            clonedBg.style.objectFit = 'cover'
            clonedBg.style.zIndex = '0'
            if (!clonedBg.src) clonedBg.src = (bgEl && bgEl.src) || (template.backgroundImage as string)
          }
          // scrub colors across the WHOLE cloned document to eliminate any OKLCH
          try {
            // Normalize from the top to catch any inherited oklch values
            forceRgb(htmlEl)
          } catch {
            // ignore
          }
        }
      }).catch(err => {
        console.error("[PDF] فشل html2canvas:", err)
        throw err
      })

      const imgData = canvas.toDataURL("image/jpeg", quality)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, 0, template.width, template.height)
    }

    // آخر تقدم
    onProgress?.(data.length, data.length)

    // إزالة الحاوية
    document.body.removeChild(container)

    console.log(`[PDF] تم حفظ الملف: ${filename}.pdf`)
    pdf.save(`${filename}.pdf`)
  } catch (err: unknown) {
    console.error("[PDF] خطأ كامل:", err)
    throw err
  } finally {
    document.head.removeChild(reset)
  }
}

export const exportSinglePDF = (row: DataRow, template: Template, filename: string, options: ExportOptions = {}) =>
  exportBatchPDF([row], template, filename, options)