export const formatIban = (value: string): string => {
  const clean = value
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 34);
  const parts = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.join(" ");
};
