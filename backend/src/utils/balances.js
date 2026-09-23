export const computeGroupBalances = (members, expenses, settlements) => {
  const balances = {};
  members.forEach((member) => {
    balances[member._id.toString()] = { user: member, netCents: 0 };
  });

  expenses.forEach((expense) => {
    if (!expense.paidBy) return;

    const payerId = (expense.paidBy._id || expense.paidBy).toString();
    if (!balances[payerId]) return;

    expense.splits.forEach((split) => {
      if (!split.user) return;

      const splitUserId = (split.user._id || split.user).toString();
      if (!balances[splitUserId] || splitUserId === payerId) return;

      balances[splitUserId].netCents -= split.amountCents;
      balances[payerId].netCents += split.amountCents;
    });
  });

  settlements.forEach((settlement) => {
    const fromId = settlement.from.toString();
    const toId = settlement.to.toString();

    if (balances[fromId]) balances[fromId].netCents += settlement.amountCents;
    if (balances[toId]) balances[toId].netCents -= settlement.amountCents;
  });

  return balances;
};

export const simplifyDebts = (balances) => {
  const debtors = [];
  const creditors = [];

  Object.values(balances).forEach((item) => {
    if (item.netCents < -1)
      debtors.push({ user: item.user, netCents: item.netCents });
    else if (item.netCents > 1)
      creditors.push({ user: item.user, netCents: item.netCents });
  });

  const debts = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amountCents = Math.min(-debtor.netCents, creditor.netCents);

    if (amountCents > 0) {
      debts.push({ from: debtor.user, to: creditor.user, amountCents });
    }

    debtor.netCents += amountCents;
    creditor.netCents -= amountCents;

    if (Math.abs(debtor.netCents) < 1) i++;
    if (creditor.netCents < 1) j++;
  }

  return debts;
};
