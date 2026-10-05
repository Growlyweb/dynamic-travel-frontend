// Dependency-free PDF writer (A4, Times) laid out like a classic travel-package
// fact sheet:
//   - logo ONLY in the page header (no brand text, no extra label)
//   - gray info bar  ->  dark-blue title  ->  gray section bars with blue bold text
//   - "Day N: ..." bold headings, divider line between days
//   - bullets with bold lead-ins, bordered price table
//
// Logo: put company_logo.png in /public. It is loaded in the browser, cropped,
// converted to JPEG on a canvas and embedded as a native PDF image.
//
// downloadPdf() is ASYNC (image loading):  await downloadPdf({ ... })
//
// Bold inside any text: wrap it in ** **   e.g. '**Overnight stay:** Thimphu'

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN_X = 56
const CONTENT_W = PAGE_WIDTH - MARGIN_X * 2
const CONTENT_TOP = 752
const BOTTOM_Y = 60

// header: logo only
const LOGO_H = 46
const LOGO_TOP = PAGE_HEIGHT - 20

const BODY = 11
const DOT_X = 18
const TEXT_X = 31

const DARK = '0 0 0 rg'
const TITLE_BLUE = '0.08 0.22 0.62 rg'
const BAR_BLUE = '0.06 0.36 0.92 rg'
const BAR_GRAY = '0.93 0.93 0.93 rg'
const INFO_GRAY = '0.95 0.95 0.95 rg'
const TABLE_HEAD = '0.96 0.96 0.96 rg'
const MUTED = '0.40 0.40 0.45 rg'
const DIVIDER = '0.35 0.35 0.38 RG'
const CELL_BORDER = '0.86 0.86 0.88 RG'

// Logo crop (fractions of the source image): trims the empty white margin.
const DEFAULT_LOGO_CROP = { x: 0.06, y: 0.17, w: 0.88, h: 0.64 }

/* ------------------------------ text helpers ------------------------------ */

const WIN_ANSI_MAP = {
  '\u2018': '\u0091',
  '\u2019': '\u0092',
  '\u201C': '\u0093',
  '\u201D': '\u0094',
  '\u2022': '\u0095',
  '\u2013': '\u0096',
  '\u2014': '\u0097',
}

// Times advance widths (1/1000 em), ASCII 32..126
const W_REGULAR = [
  250, 333, 408, 500, 500, 833, 778, 333, 333, 333, 500, 564, 250, 333, 250, 278,
  ...Array(10).fill(500),
  278, 278, 564, 564, 564, 444, 921,
  722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889, 722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611,
  333, 278, 333, 469, 500, 333,
  444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444,
  480, 200, 480, 541,
]
const W_BOLD = [
  250, 333, 555, 500, 500, 1000, 833, 333, 333, 333, 500, 570, 250, 333, 250, 278,
  ...Array(10).fill(500),
  333, 333, 570, 570, 570, 500, 930,
  722, 667, 722, 722, 667, 611, 778, 778, 389, 500, 778, 667, 944, 722, 778, 611, 778, 722, 556, 667, 722, 722, 1000, 722, 722, 667,
  333, 278, 333, 581, 500, 333,
  500, 556, 444, 556, 444, 333, 500, 556, 278, 333, 556, 278, 833, 556, 500, 556, 556, 444, 389, 333, 556, 500, 722, 500, 500, 444,
  394, 220, 394, 520,
]
const SPECIAL_WIDTHS = { 0x95: 350, 0x96: 500, 0x97: 1000, 0x91: 333, 0x92: 333, 0x93: 444, 0x94: 444, 0xa0: 250 }

function sanitize(text) {
  return String(text ?? '')
    .replace(/[\u2018\u2019\u201C\u201D\u2022\u2013\u2014]/g, (char) => WIN_ANSI_MAP[char] ?? char)
    .replace(/[^\n\x20-\x7E\x91-\x97\xA0-\xFF]/g, '')
}

function escapeText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function textWidth(value, font = 'F1', size = BODY) {
  const table = font === 'F2' ? W_BOLD : W_REGULAR
  let total = 0
  for (const char of value) {
    const code = char.charCodeAt(0)
    total += code >= 32 && code <= 126 ? table[code - 32] : SPECIAL_WIDTHS[code] ?? 444
  }
  return (total * size) / 1000
}

// shorten with "..." so text never overflows a fixed-width cell
function fit(value, maxWidth, font, size) {
  let out = sanitize(value).replace(/\*\*/g, '')
  if (textWidth(out, font, size) <= maxWidth) return out
  while (out.length > 1 && textWidth(`${out}...`, font, size) > maxWidth) out = out.slice(0, -1)
  return `${out.trimEnd()}...`
}

// "**bold** normal" -> [{ w, bold, space }]
function tokenize(paragraph, forceBold) {
  const tokens = []
  let pending = false
  paragraph.split('**').forEach((part, index) => {
    if (!part) return
    const bold = forceBold || index % 2 === 1
    const words = part.split(/\s+/).filter(Boolean)
    if (!words.length) {
      pending = true
      return
    }
    const lead = /^\s/.test(part)
    words.forEach((w, k) => {
      tokens.push({ w, bold, space: k > 0 || lead || pending })
      pending = false
    })
    pending = /\s$/.test(part)
  })
  if (tokens.length) tokens[0].space = false
  return tokens
}

// width-based wrapping with real glyph metrics, supports inline bold
function wrapRich(text, maxWidth, size = BODY, forceBold = false) {
  const lines = []
  const spaceW = textWidth(' ', 'F1', size)
  sanitize(text)
    .split('\n')
    .forEach((paragraph) => {
      const tokens = tokenize(paragraph, forceBold)
      if (!tokens.length) {
        lines.push([])
        return
      }
      let line = []
      let width = 0
      tokens.forEach((tok) => {
        const w = textWidth(tok.w, tok.bold ? 'F2' : 'F1', size)
        const gap = line.length && tok.space ? spaceW : 0
        if (line.length && width + gap + w > maxWidth) {
          lines.push(line)
          line = [{ ...tok, space: false }]
          width = w
        } else {
          line.push(tok)
          width += gap + w
        }
      })
      lines.push(line)
    })
  while (lines.length && !lines[lines.length - 1].length) lines.pop()
  return lines
}

/* ------------------------------ logo loading ------------------------------ */

function defaultLogoUrl() {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
  return `${base}company_logo.png`
}

// Loads an image, crops it, flattens on white and returns JPEG bytes for PDF.
async function loadLogo(url, crop = DEFAULT_LOGO_CROP) {
  if (!url || typeof document === 'undefined') return null
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })
    const sx = Math.round(img.naturalWidth * crop.x)
    const sy = Math.round(img.naturalHeight * crop.y)
    const sw = Math.round(img.naturalWidth * crop.w)
    const sh = Math.round(img.naturalHeight * crop.h)
    const scale = Math.min(1, 480 / sw)
    const width = Math.max(1, Math.round(sw * scale))
    const height = Math.max(1, Math.round(sh * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)

    const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1]
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return { bytes, width, height }
  } catch (error) {
    console.warn('PDF logo could not be loaded:', error)
    return null // PDF is still generated, just without the logo
  }
}

/* ------------------------------ page builder ------------------------------ */

// blocks:
//   { bar: 'Includes' }                         gray section bar, blue bold text
//   { day: 'Day 1: Arrival ...' }               bold heading (+ divider line above, except first day)
//   { day: '...', lines: ['...'] }              same, with paragraphs right below
//   { lines: ['text', '**Overnight stay:** X'] } paragraphs (inline **bold** allowed)
//   { bullets: ['**Lead:** text'], spaced: true } bullets; spaced = airy list (itinerary),
//                                               default = tight list (includes / excludes)
//   { rows: [[label, value]] }                  "**label:** value" lines
//   { table: { head: ['Pax Quantity','Price'], rows: [[2,'35,200']], widths: [0.5,0.5] } }
function buildPages({ title, subtitle, infoBar = [], blocks = [], logo, logoAlign, footerLabel, pageNumbers }) {
  const pages = []
  let ops = []
  let y = CONTENT_TOP
  let seenDay = false

  function newPage() {
    pages.push(ops)
    ops = []
    y = CONTENT_TOP
  }

  function drawLine(line, { size = BODY, indent = 0, color } = {}) {
    if (y - size < BOTTOM_Y) newPage()
    if (line.length) {
      const segs = []
      line.forEach((tok) => {
        const piece = (tok.space ? ' ' : '') + tok.w
        const last = segs[segs.length - 1]
        if (last && last.bold === tok.bold) last.text += piece
        else segs.push({ bold: tok.bold, text: piece })
      })
      const body = segs.map((s) => `/${s.bold ? 'F2' : 'F1'} ${size} Tf (${escapeText(s.text)}) Tj`).join(' ')
      const draw = `BT ${(MARGIN_X + indent).toFixed(2)} ${y.toFixed(2)} Td ${body} ET`
      ops.push(color ? `q ${color} ${draw} Q` : draw)
    }
    y -= size * 1.32
  }

  function para(value, { size = BODY, indent = 0, gapBefore = 0, forceBold = false, color } = {}) {
    y -= gapBefore
    const lines = wrapRich(value, CONTENT_W - indent, size, forceBold)
    if (!lines.length) {
      y -= 6
      return
    }
    lines.forEach((line) => drawLine(line, { size, indent, color }))
  }

  function divider() {
    y -= 4
    ops.push(`q ${DIVIDER} 0.8 w ${MARGIN_X} ${y.toFixed(2)} m ${PAGE_WIDTH - MARGIN_X} ${y.toFixed(2)} l S Q`)
    y -= 22
  }

  // gray section bar with blue bold label
  function bar(label) {
    if (y - 90 < BOTTOM_Y) newPage()
    y -= 10
    const height = 32
    const bottom = y - height
    ops.push(`q ${BAR_GRAY} ${MARGIN_X} ${bottom.toFixed(2)} ${CONTENT_W} ${height} re f Q`)
    ops.push(`q ${BAR_BLUE} BT /F2 13.5 Tf ${MARGIN_X + 12} ${(bottom + 11).toFixed(2)} Td (${escapeText(fit(label, CONTENT_W - 24, 'F2', 13.5))}) Tj ET Q`)
    y = bottom - 22
    seenDay = false
  }

  // "Day N: ..." heading; divider line between days
  function dayBlock(label, lines) {
    if (y - 90 < BOTTOM_Y) newPage()
    if (seenDay && y < CONTENT_TOP - 4) divider()
    else y -= 6
    seenDay = true
    para(label, { size: 14, forceBold: true })
    y -= 6
    lines.forEach((line) => para(line, { gapBefore: 4 }))
    if (lines.length) y -= 4
  }

  // bullets with a hanging indent (wrapped lines align under the text)
  function bulletList(items, spaced) {
    items.forEach((item) => {
      wrapRich(item, CONTENT_W - TEXT_X, BODY).forEach((line, index) => {
        if (y - BODY < BOTTOM_Y) newPage()
        if (index === 0) ops.push(`BT /F1 ${BODY} Tf ${MARGIN_X + DOT_X} ${y.toFixed(2)} Td (\u0095) Tj ET`)
        drawLine(line, { indent: TEXT_X })
      })
      if (spaced) y -= 13
    })
    y -= spaced ? 2 : 10
  }

  function tableBlock({ head = [], rows = [], widths }) {
    const cols = Math.max(head.length, ...rows.map((r) => r.length), 1)
    const frac = widths && widths.length === cols ? widths : Array(cols).fill(1 / cols)
    const colX = []
    let acc = 0
    frac.forEach((f) => {
      colX.push(MARGIN_X + acc * CONTENT_W)
      acc += f
    })
    const rowH = 23

    function drawRow(cells, bold, fill) {
      if (y - rowH < BOTTOM_Y) newPage()
      const bottom = y - rowH
      if (fill) ops.push(`q ${fill} ${MARGIN_X} ${bottom.toFixed(2)} ${CONTENT_W} ${rowH} re f Q`)
      ops.push(`q ${CELL_BORDER} 0.6 w ${MARGIN_X} ${bottom.toFixed(2)} ${CONTENT_W} ${rowH} re S Q`)
      for (let i = 1; i < cols; i += 1) {
        ops.push(`q ${CELL_BORDER} 0.6 w ${colX[i].toFixed(2)} ${bottom.toFixed(2)} m ${colX[i].toFixed(2)} ${y.toFixed(2)} l S Q`)
      }
      cells.forEach((cell, i) => {
        const font = bold ? 'F2' : 'F1'
        const t = fit(String(cell ?? ''), frac[i] * CONTENT_W - 14, font, BODY)
        ops.push(`BT /${font} ${BODY} Tf ${(colX[i] + 7).toFixed(2)} ${(bottom + 8).toFixed(2)} Td (${escapeText(t)}) Tj ET`)
      })
      y = bottom
    }

    y -= 4
    if (head.length) drawRow(head, true, TABLE_HEAD)
    rows.forEach((row) => drawRow(row, false))
    y -= 14
  }

  // ---- header (every page): logo only ----
  const headerOps = []
  if (logo) {
    const logoW = (LOGO_H * logo.width) / logo.height
    const x = logoAlign === 'left' ? MARGIN_X : PAGE_WIDTH - MARGIN_X - logoW
    headerOps.push(`q ${logoW.toFixed(2)} 0 0 ${LOGO_H} ${x.toFixed(2)} ${LOGO_TOP - LOGO_H} cm /Im1 Do Q`)
  }

  // ---- info bar: light gray band, "Label: value" cells ----
  if (infoBar.length) {
    const height = 22
    ops.push(`q ${INFO_GRAY} ${MARGIN_X} ${(y - height).toFixed(2)} ${CONTENT_W} ${height} re f Q`)
    const cells = Math.min(infoBar.length, 3)
    const cellW = CONTENT_W / cells
    infoBar.slice(0, cells).forEach(([label, value], index) => {
      const t = fit(`${label}: ${value}`, cellW - 14, 'F1', BODY)
      ops.push(`BT /F1 ${BODY} Tf ${(MARGIN_X + index * cellW + 7).toFixed(2)} ${(y - height + 7).toFixed(2)} Td (${escapeText(t)}) Tj ET`)
    })
    y -= height + 24
  }

  para(title, { size: 15, forceBold: true, color: TITLE_BLUE })
  if (subtitle) para(subtitle, { size: 10.5, gapBefore: 2 })
  y -= 8

  blocks.forEach((block) => {
    if (block.bar) bar(block.bar)
    else if (block.day) dayBlock(block.day, block.lines ?? [])
    else if (block.bullets) bulletList(block.bullets, block.spaced)
    else if (block.table) tableBlock(block.table)
    else if (block.rows) {
      block.rows.forEach(([label, value]) => para(`**${label}:** ${value ?? ''}`, { gapBefore: 2 }))
      y -= 6
    } else if (block.lines) {
      block.lines.forEach((line) => para(line, { gapBefore: 4 }))
      y -= 6
    }
  })

  pages.push(ops)

  // ---- optional footer + header on every page ----
  const total = pages.length
  pages.forEach((pageOps, index) => {
    const footer = []
    if (footerLabel) {
      footer.push(`q ${MUTED} BT /F1 8.5 Tf ${MARGIN_X} 36 Td (${escapeText(sanitize(footerLabel))}) Tj ET Q`)
    }
    if (pageNumbers) {
      const label = `Page ${index + 1} of ${total}`
      const w = textWidth(label, 'F1', 8.5)
      footer.push(`q ${MUTED} BT /F1 8.5 Tf ${(PAGE_WIDTH - MARGIN_X - w).toFixed(2)} 36 Td (${label}) Tj ET Q`)
    }
    pages[index] = [DARK, ...headerOps, ...pageOps, ...footer]
  })
  return pages
}

/* ------------------------------ PDF assembly ------------------------------ */

function latin1(str) {
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i += 1) bytes[i] = str.charCodeAt(i) & 0xff
  return bytes
}

function pdfDate(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `D:${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
}

// Binary-safe: offsets are counted in bytes so the JPEG stream can be embedded.
function assemblePdf(pages, { logo, title }) {
  // 1 Catalog, 2 Pages, 3 Times-Roman, 4 Times-Bold, [5 logo], 2 objects per page, Info
  const objects = []
  const imageNum = logo ? 5 : null
  const firstPageNum = logo ? 6 : 5
  const pageObjNums = pages.map((_, index) => firstPageNum + index * 2)

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageObjNums.map((num) => `${num} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>'

  if (logo) {
    objects[imageNum] = {
      dict: `/Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
      stream: logo.bytes,
    }
  }

  const xobjects = logo ? `/XObject << /Im1 ${imageNum} 0 R >>` : ''
  pages.forEach((ops, index) => {
    const pageNum = firstPageNum + index * 2
    const contentNum = pageNum + 1
    objects[pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xobjects} >> /Contents ${contentNum} 0 R >>`
    objects[contentNum] = { dict: '', stream: latin1(ops.join('\n')) }
  })

  const infoNum = objects.length
  objects[infoNum] = `<< /Title (${escapeText(sanitize(title || 'Document'))}) /Producer (Travel Dashboard) /CreationDate (${pdfDate()}) >>`

  const chunks = []
  let offset = 0
  const push = (data) => {
    const bytes = typeof data === 'string' ? latin1(data) : data
    chunks.push(bytes)
    offset += bytes.length
  }

  push('%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n')
  const offsets = []
  const last = objects.length - 1
  for (let num = 1; num <= last; num += 1) {
    offsets[num] = offset
    const object = objects[num]
    push(`${num} 0 obj\n`)
    if (typeof object === 'string') {
      push(object)
    } else {
      push(`<< ${object.dict} /Length ${object.stream.length} >>\nstream\n`)
      push(object.stream)
      push('\nendstream')
    }
    push('\nendobj\n')
  }

  const xrefStart = offset
  let xref = `xref\n0 ${last + 1}\n0000000000 65535 f \n`
  for (let num = 1; num <= last; num += 1) xref += `${String(offsets[num]).padStart(10, '0')} 00000 n \n`
  xref += `trailer\n<< /Size ${last + 1} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  push(xref)

  const out = new Uint8Array(offset)
  let pos = 0
  chunks.forEach((chunk) => {
    out.set(chunk, pos)
    pos += chunk.length
  })
  return out
}

/* --------------------------------- public --------------------------------- */

export async function generatePdfBytes({
  title,
  subtitle,
  infoBar,
  blocks,
  footerLabel,
  pageNumbers = false,
  logoUrl = defaultLogoUrl(), // public/company_logo.png
  logoCrop = DEFAULT_LOGO_CROP,
  logoAlign = 'right', // 'right' (like the sample) or 'left'
  logo: logoOverride, // optional { bytes, width, height } (JPEG) - mainly for tests
}) {
  const logo = logoOverride ?? (await loadLogo(logoUrl, logoCrop))
  const pages = buildPages({ title, subtitle, infoBar, blocks, logo, logoAlign, footerLabel, pageNumbers })
  return assemblePdf(pages, { logo, title })
}

export async function downloadPdf({ fileName = 'summary.pdf', ...options }) {
  const bytes = await generatePdfBytes(options)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatDurationNights(days) {
  const count = Number(days) || 1
  return count > 1 ? `${count - 1} Night ${count} Days` : `${count} Day`
}

export function padDay(day) {
  return String(day).padStart(2, '0')
}