const deletedAt = new Map<number, number>()
const TTL_MS = 15 * 60 * 1000 // 15 min — WP object cache should expire by then

export function markUserDeleted(userId: number) {
  deletedAt.set(userId, Date.now())
}

export function isUserDeleted(userId: number): boolean {
  const ts = deletedAt.get(userId)
  if (!ts) return false
  if (Date.now() - ts > TTL_MS) {
    deletedAt.delete(userId)
    return false
  }
  return true
}

export function clearUserDeleted(userId: number) {
  deletedAt.delete(userId)
}
