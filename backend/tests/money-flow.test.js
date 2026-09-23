import { describe, it, expect } from "vitest";
import request from "supertest";
import "./setup.js";
import { createTestApp } from "./testApp.js";

process.env.NODE_ENV = "test";
const app = createTestApp();

const syncUser = async (clerkId, name) => {
  const res = await request(app)
    .post("/api/users/sync")
    .set("X-Test-Clerk-Id", clerkId)
    .send({ email: `${clerkId}@test.com`, name });
  return res.body;
};

const setupGroupWithTwoMembers = async () => {
  const alice = await syncUser("alice", "Alice");
  const bob = await syncUser("bob", "Bob");

  const group = (
    await request(app)
      .post("/api/groups")
      .set("X-Test-Clerk-Id", "alice")
      .send({ name: "Roommates" })
  ).body;

  await request(app)
    .post("/api/groups/join")
    .set("X-Test-Clerk-Id", "bob")
    .send({ inviteCode: group.inviteCode });

  return { alice, bob, groupId: group._id };
};

describe("Expense -> summary -> settle-up flow", () => {
  it("splits an expense evenly and reflects it correctly in the summary", async () => {
    const { groupId } = await setupGroupWithTwoMembers();

    await request(app)
      .post(`/api/expenses/group/${groupId}`)
      .set("X-Test-Clerk-Id", "alice")
      .send({ title: "Groceries", amount: 100 });

    const summary = (
      await request(app)
        .get(`/api/expenses/group/${groupId}/summary`)
        .set("X-Test-Clerk-Id", "alice")
    ).body;

    expect(summary.debts).toHaveLength(1);
    expect(summary.debts[0].amount).toBe(50);
    expect(summary.totalExpense).toBe(100);
  });

  it("rejects settle-up from someone who owes nothing in this group", async () => {
    const { groupId } = await setupGroupWithTwoMembers();

    const bobUser = await request(app)
      .get("/api/users/me")
      .set("X-Test-Clerk-Id", "bob");

    const res = await request(app)
      .post(`/api/expenses/group/${groupId}/settle-up`)
      .set("X-Test-Clerk-Id", "alice")
      .send({ receiverId: bobUser.body._id, amount: 10 });

    expect(res.status).toBe(400);
  });

  it("accepts a valid settle-up and brings the debt back to zero", async () => {
    const { groupId } = await setupGroupWithTwoMembers();

    await request(app)
      .post(`/api/expenses/group/${groupId}`)
      .set("X-Test-Clerk-Id", "alice")
      .send({ title: "Groceries", amount: 100 });

    const aliceUser = await request(app)
      .get("/api/users/me")
      .set("X-Test-Clerk-Id", "alice");

    const settleRes = await request(app)
      .post(`/api/expenses/group/${groupId}/settle-up`)
      .set("X-Test-Clerk-Id", "bob")
      .send({ receiverId: aliceUser.body._id, amount: 50 });

    expect(settleRes.status).toBe(200);

    const summary = (
      await request(app)
        .get(`/api/expenses/group/${groupId}/summary`)
        .set("X-Test-Clerk-Id", "alice")
    ).body;

    expect(summary.debts).toHaveLength(0);
  });

  it("rejects a settle-up amount that exceeds the actual debt", async () => {
    const { groupId } = await setupGroupWithTwoMembers();

    await request(app)
      .post(`/api/expenses/group/${groupId}`)
      .set("X-Test-Clerk-Id", "alice")
      .send({ title: "Groceries", amount: 100 });

    const aliceUser = await request(app)
      .get("/api/users/me")
      .set("X-Test-Clerk-Id", "alice");

    const res = await request(app)
      .post(`/api/expenses/group/${groupId}/settle-up`)
      .set("X-Test-Clerk-Id", "bob")
      .send({ receiverId: aliceUser.body._id, amount: 9999 });

    expect(res.status).toBe(400);
  });

  it("splits an ugly three-way amount (350 / 3) without losing a cent", async () => {
    const alice = await syncUser("alice", "Alice");
    const bob = await syncUser("bob", "Bob");
    const carol = await syncUser("carol", "Carol");

    const group = (
      await request(app)
        .post("/api/groups")
        .set("X-Test-Clerk-Id", "alice")
        .send({ name: "Trip" })
    ).body;

    await request(app)
      .post("/api/groups/join")
      .set("X-Test-Clerk-Id", "bob")
      .send({ inviteCode: group.inviteCode });
    await request(app)
      .post("/api/groups/join")
      .set("X-Test-Clerk-Id", "carol")
      .send({ inviteCode: group.inviteCode });

    const createRes = await request(app)
      .post(`/api/expenses/group/${group._id}`)
      .set("X-Test-Clerk-Id", "bob")
      .send({ title: "Taxi", amount: 350 });

    const amounts = createRes.body.data.splits.map((s) => s.amount).sort();
    expect(amounts).toEqual([116.66, 116.67, 116.67]);

    const total = createRes.body.data.splits.reduce((s, x) => s + x.amount, 0);
    expect(Math.round(total * 100) / 100).toBe(350);
  });
});
