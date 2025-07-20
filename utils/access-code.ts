export function generateAccessCode(): string {
  // Returns a random 6-digit numeric string (e.g. “482931”)
  return Math.floor(100000 + Math.random() * 900000).toString()
}
