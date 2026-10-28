// Which statuses an application can move to. The server decides in the end; this only keeps the list honest so a person is
// not offered a move that is refused. `statuses` is the answer of GET /api/visa/statuses.

const firstSystemKey = (statuses) => [...statuses].filter((status) => status.isSystem).sort((a, b) => a.displayOrder - b.displayOrder)[0]?.key

export function nextStatuses(currentKey, statuses, { isAdmin = false } = {}) {
  const from = statuses.find((status) => status.key === currentKey)
  if (!from) return statuses.filter((status) => status.active)

  // A finished application can only be reopened by an admin, and only to one status.
  if (from.final) return isAdmin ? statuses.filter((status) => status.reopenTarget) : []

  const first = firstSystemKey(statuses)
  return statuses.filter((status) => {
    if (status.key === from.key || !status.active) return false
    const custom = status.transitions === null
    if (from.transitions) return custom || from.transitions.includes(status.key)
    return custom || status.key !== first
  })
}

// The text a move needs: a finished application being reopened needs an internal reason, otherwise the target decides.
export function requiredText(from, to) {
  if (from?.final) return 'internalReason'
  return to?.requiredText ?? null
}
