import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import type { Template } from "@/types/template"

const oklchToRgb = (s: string): string => {
  const m = s.match(/oklch\(([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i)
  if (!m) return "rgb(0,0,0)"
  const lRaw = Number.parseFloat(m[1])
  const l = m[2] === "%" ? lRaw / 100 : lRaw
  const c = Number.parseFloat(m[3])
  const h = Number.parseFloat(m[4])
  const a = m[5] ? Number.parseFloat(m[5]) : 1
  if (c === 0) {
    const v = Math.round(l * 255)
    return a < 1 ? `rgba(${v},${v},${v},${a})` : `rgb(${v},${v},${v})`
  }
  const rad = (h * Math.PI) / 180
  const r = Math.round(255 * (l + c * Math.cos(rad)))
  const g = Math.round(255 * (l + c * Math.sin(rad)))
  const b = Math.round(255 * (l - c))
  const clamp = (n: number) => Math.max(0, Math.min(255, n))
  return a < 1 ? `rgba(${clamp(r)},${clamp(g)},${clamp(b)},${a})` : `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`
}

const forceRgb = (root: HTMLElement): void => {
  const replaceOklch = (val: string): string => val.replace(/oklch\([^)]*\)/gi, (m) => oklchToRgb(m))

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  let node: HTMLElement | null
  while ((node = walker.nextNode() as HTMLElement | null)) {
    const cs = getComputedStyle(node)
    const style = node.style

    const convert = (prop: keyof CSSStyleDeclaration, fallback = "rgb(0,0,0)") => {
      const val = cs[prop] as string
      if (val?.includes("oklch")) {
        ;(style as any)[prop] = replaceOklch(val) || fallback
      }
    }

    convert("color")
    convert("borderTopColor")
    convert("borderRightColor")
    convert("borderBottomColor")
    convert("borderLeftColor")
    convert("outlineColor")
    convert("columnRuleColor")
    convert("caretColor")

    const bgColor = cs.backgroundColor as string
    if (bgColor?.includes("oklch")) {
      style.backgroundColor = node === root ? "#ffffff" : "transparent"
    }

    const bg = cs.background as string
    if (bg && bg.includes("oklch")) {
      style.background = node === root ? "#ffffff" : "none"
    }

    const bgImage = cs.backgroundImage
    if (bgImage && bgImage !== "none" && bgImage.includes("oklch")) {
      style.backgroundImage = "none"
    }

    const boxShadow = cs.boxShadow
    if (boxShadow?.includes("oklch")) style.boxShadow = replaceOklch(boxShadow)

    const textShadow = cs.textShadow
    if (textShadow?.includes("oklch")) style.textShadow = replaceOklch(textShadow)

    const cssVars = ["--background", "--foreground", "--card", "--muted", "--accent", "--border", "--ring", "--primary", "--secondary", "--destructive"]
    for (const name of cssVars) {
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

const toDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const createResetStyle = (): HTMLStyleElement => {
  const s = document.createElement("style")
  s.textContent = `
    .pdf-container { all: initial !important; display: block !important; position: relative !important; background:#fff !important; isolation:isolate !important; font-family: Arial, sans-serif !important; }
    .pdf-container * { box-shadow: none !important; text-shadow: none !important; filter: none !important; }
    .pdf-container *:not(img) { background-image: none !important; }
    .pdf-container *::before, .pdf-container *::after { content: none !important; background: none !important; }
    .pdf-container img { max-width:100%; height:auto; display:block; pointer-events: none; }
    .pdf-container img[data-bg="1"] { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; z-index: 0 !important; }
  `
  return s
}

type ExportOptions = {
  scale?: number
  quality?: number
  onProgress?: (current: number, total: number) => void
  signal?: AbortSignal
}

type DataRow = Record<string, unknown>

// ... (oklchToRgb, forceRgb, toDataUrl, createResetStyle) تبقى كما هي ...

export const exportBatchPDF = async (
  data: DataRow[],
  template: Template,
  filename: string,
  options: ExportOptions = {},
): Promise<void> => {
  const { scale = 1.5, quality = 0.95, onProgress, signal } = options
  const pdf = new jsPDF({
    orientation: template.width > template.height ? "landscape" : "portrait",
    unit: "px",
    format: [template.width, template.height],
  })

  const reset = createResetStyle()
  document.head.appendChild(reset)

  let container: HTMLDivElement | null = null
  let bgEl: HTMLImageElement | null = null
  let fieldEls: { f: any; el: HTMLDivElement }[] = []

  try {
    container = document.createElement("div")
    container.className = "pdf-container"
    container.style.cssText = `
      position: fixed;
      left: 0; top: 0;
      width: ${template.width}px; height: ${template.height}px;
      overflow: hidden;
      background: #fff;
      z-index: -9999;
      opacity: 0;
      pointer-events: none;
    `
    document.body.appendChild(container)

    // متغيرات آمنة
    const safeVars: Record<string, string> = { /* ... */ }
    for (const [k, v] of Object.entries(safeVars)) container.style.setProperty(k, v)

    // تحميل الخلفية
    if (template.backgroundImage) {
      bgEl = document.createElement("img")
      bgEl.crossOrigin = "anonymous"
      bgEl.setAttribute("data-bg", "1")
      bgEl.style.cssText = `
        position: absolute; top: 0; left: 0;
        width: ${template.width}px; height: ${template.height}px;
        object-fit: cover; z-index: 0; pointer-events: none;
      `
      container.appendChild(bgEl)

      const dataUrl = await toDataUrl(template.backgroundImage)
      if (dataUrl) {
        bgEl.src = dataUrl
        await new Promise<void>((resolve, reject) => {
          const onLoad = () => {
            if ('decode' in bgEl!) {
              bgEl!.decode().then(resolve).catch(resolve)
            } else resolve()
          }
          if (bgEl!.complete && bgEl!.naturalWidth > 0) {
            onLoad()
          } else {
            bgEl!.onload = onLoad
            bgEl!.onerror = reject
          }
        })
      } else {
        bgEl.src = template.backgroundImage
      }
    }
    console.log("BG SRC:", bgEl?.src?.slice(0, 50))
    // الحقول
    fieldEls = template.fields.map((f) => {
      const el = document.createElement("div")
      const color = /^#|rgb/.test(f.color || "") ? f.color : "#000000"
      el.style.cssText = `
        position: absolute; left: ${f.x}px; top: ${f.y}px;
        font-size: ${f.fontSize || 16}px; font-family: ${f.fontFamily || "Arial"};
        font-weight: ${f.fontWeight || "normal"}; text-align: ${f.textAlign || "right"};
        white-space: nowrap; direction: rtl; color: ${color}; z-index: 1;
      `
      container!.appendChild(el)
      return { f, el }
    })

    for (let i = 0; i < data.length; i++) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
      const row = data[i]
      onProgress?.(i, data.length)

      // تحديث النصوص
      fieldEls.forEach(({ f, el }) => {
        const value = row[f.name as keyof DataRow]
        el.textContent = value != null ? String(value) : `{${f.name}}`
      })

      // تأخير الرسم
      await new Promise(r => setTimeout(r, 50))
      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)

      forceRgb(container!)

      const canvas = await html2canvas(container!, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: template.width,
        height: template.height,
        onclone: (clonedDoc) => {
          const clonedBg = clonedDoc.querySelector('img[data-bg="1"]') as HTMLImageElement
          if (clonedBg && bgEl?.src) {
            clonedBg.src = bgEl.src
            clonedBg.width = template.width
            clonedBg.height = template.height
            clonedBg.style.width = template.width + 'px'
            clonedBg.style.height = template.height + 'px'
          }
          forceRgb(clonedDoc.documentElement)
        },
      })

      const imgData = canvas.toDataURL("image/jpeg", quality)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, 0, template.width, template.height)
    }

    onProgress?.(data.length, data.length)
    pdf.save(`${filename}.pdf`)
  } catch (err) {
    console.error("[PDF] خطأ:", err)
    throw err
  } finally {
    if (container?.parentNode) document.body.removeChild(container)
    document.head.removeChild(reset)
  }
}

export const exportSinglePDF = (row: DataRow, template: Template, filename: string, options: ExportOptions = {}) =>
  exportBatchPDF([row], template, filename, options)