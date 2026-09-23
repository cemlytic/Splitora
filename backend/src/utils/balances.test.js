import { describe, it, expect } from "vitest";
import { computeGroupBalances, simplifyDebts } from "./balances.js";

const alice = { _id: "alice" };
const bob = { _id: "bob" };
const carol = { _id: "carol" };

describe("computeGroupBalances", () => {
  it("initializes a zero balance entry for every group member, even with no expenses", () => {
    const balances = computeGroupBalances([alice, bob, carol], [], []);
    expect(Object.keys(balances).sort()).toEqual(["alice", "bob", "carol"]);
    expect(balances.alice.netCents).toBe(0);
    expect(balances.bob.netCents).toBe(0);
    expect(balances.carol.netCents).toBe(0);
  });

  it("credits the payer and debits the other split member", () => {
    const expenses = [
      {
        paidBy: alice,
        splits: [
          { user: alice, amountCents: 500 },
          { user: bob, amountCents: 500 },
        ],
      },
    ];
    const balances = computeGroupBalances([alice, bob], expenses, []);
    expect(balances.alice.netCents).toBe(500);
    expect(balances.bob.netCents).toBe(-500);
  });

  it("does not let the payer owe themselves", () => {
    const expenses = [
      { paidBy: alice, splits: [{ user: alice, amountCents: 1000 }] },
    ];
    const balances = computeGroupBalances([alice], expenses, []);
    expect(balances.alice.netCents).toBe(0);
  });

  it("applies settlements to reduce to debtor's balance and the creditor's credit", () => {
    const expenses = [
      {
        paidBy: alice,
        splits: [
          { user: alice, amountCents: 500 },
          { user: bob, amountCents: 500 },
        ],
      },
    ];
    const settlements = [{ from: "bob", to: "alice", amountCents: 500 }];
    const balances = computeGroupBalances([alice, bob], expenses, settlements);
    expect(balances.alice.netCents).toBe(0);
    expect(balances.bob.netCents).toBe(0);
  });
  it("ignores splits for users no longer in the group", () => {
    const expenses = [
      {
        paidBy: alice,
        splits: [
          { user: alice, amountCents: 500 },
          { user: { _id: "ghost" }, amountCents: 500 },
        ],
      },
    ];
    const balances = computeGroupBalances([alice], expenses, []);
    expect(balances.alice.netCents).toBe(0);
  });

  it("handles a three-way split matching the real $350 taxi scenario", () => {
    const expenses = [
      {
        paidBy: bob,
        splits: [
          { user: alice, amountCents: 11667 },
          { user: bob, amountCents: 11667 },
          { user: carol, amountCents: 11666 },
        ],
      },
    ];
    const balances = computeGroupBalances([alice, bob, carol], expenses, []);
    expect(balances.bob.netCents).toBe(11667 + 11666); 
    expect(balances.alice.netCents).toBe(-11667);
    expect(balances.carol.netCents).toBe(-11666);
  });
});

describe("simplifyDebts", () => {
  it("returns no debts when everyone is settled", () => {
    const balances = {
      alice: { user: alice, netCents: 0 },
      bob: { user: bob, netCents: 0 },
    };
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("matches a single debtor with a single creditor", () => {
    const balances = {
      alice: { user: alice, netCents: 1000 },
      bob: { user: bob, netCents: -1000 },
    };
    expect(simplifyDebts(balances)).toEqual([
      { from: bob, to: alice, amountCents: 1000 },
    ]);
  });

  it("simplifies a three-person scenario into the minimum number of transactions", () => {
    const balances = {
      alice: { user: alice, netCents: 1500 },
      bob: { user: bob, netCents: 0 },
      carol: { user: carol, netCents: -1500 },
    };
    expect(simplifyDebts(balances)).toEqual([
      { from: carol, to: alice, amountCents: 1500 },
    ]);
  });

  it("never produces debts whose total exceeds what the debtor actually owes", () => {
    const balances = {
      alice: { user: alice, netCents: 300 },
      bob: { user: bob, netCents: 700 },
      carol: { user: carol, netCents: -1000 },
    };
    const debts = simplifyDebts(balances);
    const totalFromCarol = debts
      .filter((d) => d.from === carol)
      .reduce((sum, d) => sum + d.amountCents, 0);
    expect(totalFromCarol).toBe(1000);
  });

  it("treats balances under 1 cent as settled (rounding noise)", () => {
    const balances = {
      alice: { user: alice, netCents: 0.4 },
      bob: { user: bob, netCents: -0.4 },
    };
    expect(simplifyDebts(balances)).toEqual([]);
  });
});
