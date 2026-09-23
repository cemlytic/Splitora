export const toCents = (amount) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (typeof num !== "number" || isNaN(num)) return null;

  return Math.round(num * 100);
};

export const toDollars = (cents) => Number((cents / 100).toFixed(2));

export const splitEvenly = (totalCents, count) => {
  const base = Math.floor(totalCents / count);

  const remainder = totalCents - base * count;

  return Array.from(
    { length: count },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
};
