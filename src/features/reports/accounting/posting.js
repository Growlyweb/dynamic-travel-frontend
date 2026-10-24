/** Shared journal posting primitive used by the seed and the live API. */

const pad = (value, size) => String(value).padStart(size, '0')

export function postJournal(
  state,
  { date, type = 'JV', narration, segment, partyId, fileId, ref, lines, status = 'posted' }
) {
  if (!date) throw new Error('A voucher date is required.')

  const knownAccounts = new Set((state.accounts || []).map((account) => account.code))
  const prepared = (lines || [])
    .filter((line) => line && line.account)
    .map((line) => ({
      account: line.account,
      debit: Math.round(Number(line.debit) || 0),
      credit: Math.round(Number(line.credit) || 0),
      partyId: line.partyId || null,
      memo: line.memo || '',
      dueDate: line.dueDate || null,
      kind: line.kind || null,
    }))
    .filter((line) => line.debit > 0 || line.credit > 0)

  if (prepared.length < 2) {
    throw new Error('A voucher needs at least two lines with amounts.')
  }
  for (const line of prepared) {
    if (!knownAccounts.has(line.account)) {
      throw new Error(`Unknown account code: ${line.account}`)
    }
    if (line.debit > 0 && line.credit > 0) {
      throw new Error('A line cannot carry both a debit and a credit.')
    }
  }

  const debit = prepared.reduce((sum, line) => sum + line.debit, 0)
  const credit = prepared.reduce((sum, line) => sum + line.credit, 0)
  if (debit !== credit) {
    throw new Error(`Voucher is out of balance by ৳${Math.abs(debit - credit).toLocaleString('en-IN')}.`)
  }
  if (debit === 0) throw new Error('Voucher total must be greater than zero.')

  const year = date.slice(0, 4)
  const key = `${type}-${year}`
  state.seq = state.seq || {}
  const sequence = (state.seq[key] || 0) + 1
  state.seq[key] = sequence

  if (!state.counters) state.counters = { journal: 0, file: 0 }
  state.counters.journal = (state.counters.journal || 0) + 1

  const journal = {
    id: `j${state.counters.journal}`,
    no: `${type}-${year}-${pad(sequence, 4)}`,
    date,
    type,
    narration: String(narration || '').trim() || 'Journal voucher',
    segment: segment || null,
    partyId: partyId || null,
    fileId: fileId || null,
    ref: String(ref || '').trim(),
    lines: prepared,
    status,
    createdAt: new Date().toISOString(),
  }

  state.journals = state.journals || []
  state.journals.push(journal)
  return journal
}

/** Next operating file number, e.g. VF-2026-0124. */
export function nextFileNo(state, type, prefix, year) {
  state.fileSeq = state.fileSeq || {}
  state.fileSeq[prefix] = (state.fileSeq[prefix] || 0) + 1
  return `${prefix}-${year}-${pad(state.fileSeq[prefix], 4)}`
}
