// Minimal dependency-free PDF writer (A4, Helvetica) styled after classic
// travel-package fact sheets: brand mark top-right, info bar, gray section
// bars, "Day 01" headings with rules, bullet lists. WinAnsi-encoded so
// bullets and typographic dashes/quotes render properly.
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN_X = 48
const CONTENT_TOP = 756
const BOTTOM_Y = 64
const BRAND_Y = 810

const BLUE = '0.09 0.40 0.83 rg'
const INDIGO = '0.31 0.27 0.90 rg'
const DARK = '0 0 0 rg'
const BAR_GRAY = '0.93 0.94 0.96 rg'
const RULE_GRAY = '0.72 0.72 0.76 RG'

const WIN_ANSI_MAP = {
  '\u2018': '\u0091',
  '\u2019': '\u0092',
  '\u201C': '\u0093',
  '\u201D': '\u0094',
  '\u2022': '\u0095',
  '\u2013': '\u0096',
  '\u2014': '\u0097',
}

function sanitize(text) {
  return String(text ?? '')
    .replace(/[\u2018\u2019\u201C\u201D\u2022\u2013\u2014]/g, (char) => WIN_ANSI_MAP[char] ?? char)
    .replace(/[^\x20-\x7E\x91-\x97\xA0-\xFF]/g, '')
}

function escapeText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapText(text, max = 92) {
  const words = sanitize(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  words.forEach((word) => {
    if (current && `${current} ${word}`.length > max) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  })
  if (current) lines.push(current)
  return lines
}

// blocks:
//   { bar: 'Includes' }                             — gray section bar, blue bold text
//   { day: 'Day 01 — Arrival', lines: [...] }       — bold heading with rule + body
//   { bullets: ['…'] }                              — bullet list
//   { rows: [[label, value]] }                      — bold label + wrapped value
//   { lines: ['…'] }                                — plain paragraphs
function buildPages({ title, subtitle, infoBar = [], blocks = [], brand, footerLabel }) {
  const pages = []
  let ops = []
  let y = CONTENT_TOP

  function newPage() {
    pages.push(ops)
    ops = []
    y = CONTENT_TOP
  }

  function text(value, { font = 'F1', size = 10.5, indent = 0, gapBefore = 0, color } = {}) {
    y -= gapBefore
    if (y - size < BOTTOM_Y) newPage()
    if (color) ops.push(color)
    ops.push(`BT /${font} ${size} Tf ${MARGIN_X + indent} ${y} Td (${escapeText(value)}) Tj ET`)
    if (color) ops.push(DARK)
    y -= size + 4
  }

  function wrapped(value, options = {}, width = 92) {
    const lines = wrapText(value, width)
    if (!lines.length) {
      y -= 5
      return
    }
    lines.forEach((line) => text(line, options))
  }

  function rule(gap = 4) {
    y -= gap
    ops.push(`${RULE_GRAY} 0.7 w ${MARGIN_X} ${y} m ${PAGE_WIDTH - MARGIN_X} ${y} l S`)
    y -= 9
  }

  // gray section bar with blue bold label
  function bar(label) {
    if (y - 58 < BOTTOM_Y) newPage()
    y -= 12
    const height = 22
    ops.push(`q ${BAR_GRAY} ${MARGIN_X} ${y - height + 6} ${PAGE_WIDTH - MARGIN_X * 2} ${height} re f Q`)
    ops.push(`q ${BLUE} BT /F2 12.5 Tf ${MARGIN_X + 10} ${y - height + 12} Td (${escapeText(label)}) Tj ET Q`)
    y -= height + 6
  }

  // bold day heading with rule, body kept together
  function dayBlock(label, lines) {
    const bodyLines = lines.flatMap((line) => wrapText(line, 92))
    const needed = 34 + bodyLines.length * 15 + 10
    if (needed < CONTENT_TOP - BOTTOM_Y && y - needed < BOTTOM_Y) newPage()
    y -= 12
    text(label, { font: 'F2', size: 12.5 })
    rule()
    bodyLines.forEach((line, index) => text(line, { gapBefore: index === 0 ? 2 : 0 }))
    y -= 6
  }

  function bulletList(items) {
    items.forEach((item) => {
      wrapped(`\u0095 ${item}`, { indent: 8 }, 88)
    })
    y -= 4
  }

  function rowsList(rows) {
    rows.forEach(([label, value]) => {
      if (y - 42 < BOTTOM_Y) newPage()
      text(label, { font: 'F2', size: 9.5, gapBefore: 2 })
      wrapped(String(value), { indent: 12, size: 10 }, 80)
    })
    y -= 4
  }

  // brand mark, top-right, every page
  const brandOps = brand
    ? [
        `q ${INDIGO} BT /F2 11 Tf ${PAGE_WIDTH - MARGIN_X - 110} ${BRAND_Y} Td (${escapeText(sanitize(brand))}) Tj ET Q`,
        `q ${INDIGO} 1.4 w ${PAGE_WIDTH - MARGIN_X - 110} ${BRAND_Y - 5} m ${PAGE_WIDTH - MARGIN_X} ${BRAND_Y - 5} l S Q`,
      ]
    : []

  // info bar (gray band with label: value cells)
  function infoBarOps() {
    const height = 26
    const top = y
    ops.push(`q ${BAR_GRAY} ${MARGIN_X} ${top - height} ${PAGE_WIDTH - MARGIN_X * 2} ${height} re f Q`)
    const cells = Math.min(infoBar.length, 3)
    const cellWidth = (PAGE_WIDTH - MARGIN_X * 2) / cells
    infoBar.slice(0, cells).forEach(([label, value], index) => {
      const cellX = MARGIN_X + index * cellWidth + 10
      ops.push(`BT /F2 10 Tf ${cellX} ${top - height + 9} Td (${escapeText(`${sanitize(label)}:`)}) Tj ET`)
      ops.push(`BT /F1 10 Tf ${cellX + sanitize(label).length * 5.6 + 8} ${top - height + 9} Td (${escapeText(sanitize(value))}) Tj ET`)
    })
    y -= height + 14
  }

  if (infoBar.length) infoBarOps()

  text(title, { font: 'F2', size: 15.5, color: BLUE, gapBefore: 2 })
  if (subtitle) text(subtitle, { size: 10, gapBefore: 1 })
  y -= 4

  blocks.forEach((block) => {
    if (block.bar) bar(block.bar)
    else if (block.day) dayBlock(block.day, block.lines ?? [])
    else if (block.bullets) bulletList(block.bullets)
    else if (block.rows) rowsList(block.rows)
    else if (block.lines) {
      block.lines.forEach((line) => wrapped(line, { gapBefore: 2 }))
      y -= 4
    }
  })

  pages.push(ops)

  const total = pages.length
  pages.forEach((pageOps, index) => {
    const label = footerLabel
      ? `${footerLabel}  ·  Page ${index + 1} of ${total}`
      : `Page ${index + 1} of ${total}`
    const footer = `BT /F1 8.5 Tf ${MARGIN_X} 40 Td (${escapeText(sanitize(label))}) Tj ET`
    pages[index] = [...brandOps, ...pageOps, footer]
  })
  return pages
}

function assemblePdf(pages) {
  const objects = []
  // obj 1 = Catalog, 2 = Pages, 3 = F1 (Helvetica), 4 = F2 (Helvetica-Bold)
  // Each page uses TWO objects: [pageDict, contentStream]
  // pageDict obj num = 5 + index*2
  // contentStream obj num = 5 + index*2 + 1
  const pageObjNums = pages.map((_, index) => 5 + index * 2)

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageObjNums.map((num) => `${num} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'

  pages.forEach((ops, index) => {
    const pageDictNum = 5 + index * 2       // page dictionary object
    const contentNum  = 5 + index * 2 + 1   // content stream object

    const streamStr = ops.join('\n')

    // Page dictionary — references content stream
    objects[pageDictNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNum} 0 R >>`

    // Content stream
    objects[contentNum] = { stream: streamStr }
  })

  let pdf = '%PDF-1.4\n'
  const offsets = []
  const last = objects.length - 1
  for (let num = 1; num <= last; num += 1) {
    offsets[num] = pdf.length
    const object = objects[num]
    if (!object) {
      // Should never happen, but guard against gaps
      offsets[num] = pdf.length
      continue
    }
    if (typeof object === 'string') {
      pdf += `${num} 0 obj\n${object}\nendobj\n`
    } else {
      const len = object.stream.length
      pdf += `${num} 0 obj\n<< /Length ${len} >>\nstream\n${object.stream}\nendstream\nendobj\n`
    }
  }

  const xrefStart = pdf.length
  pdf += `xref\n0 ${last + 1}\n0000000000 65535 f \n`
  for (let num = 1; num <= last; num += 1) {
    pdf += `${String(offsets[num] ?? 0).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${last + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return pdf
}


export function downloadPdf({ fileName = 'summary.pdf', title, subtitle, infoBar, blocks, brand, footerLabel }) {
  const pages = buildPages({ title, subtitle, infoBar, blocks, brand, footerLabel })
  const pdf = assemblePdf(pages)
  const bytes = new Uint8Array(pdf.length)
  for (let index = 0; index < pdf.length; index += 1) bytes[index] = pdf.charCodeAt(index) & 0xff

  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function formatDurationNights(days) {
  const count = Number(days) || 1
  return count > 1 ? `${count - 1} Nights ${count} Days` : `${count} Day`
}

export function padDay(day) {
  return String(day).padStart(2, '0')
}
