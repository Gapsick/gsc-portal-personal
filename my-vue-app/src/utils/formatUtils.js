export function formatDate(dateStr) {
  return new Date(dateStr).toISOString().split("T")[0]
}
