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

describe("Auth enforcement", () => {
  it("rejects requests with no identity at all", async () => {
    const res = await request(app).get("/api/groups/user/me");
    expect(res.status).toBe(401);
  });

  it("rejects a user who has authenticated but never synced", async () => {
    const res = await request(app)
      .get("/api/groups/user/me")
      .set("X-Test-Clerk-Id", "someone who never synced");
    expect(res.status).toBe(401);
  });

  it("allows a synced user to see their own (empty) group list", async () => {
    await syncUser("alice-clerk-id", "Alice");
    const res = await request(app)
      .get("/api/groups/user/me")
      .set("X-Test-Clerk-Id", "alice-clerk-id");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("blocks a non member from reading another group's expenses", async () => {
    await syncUser("alice-clerk-id", "Alice");
    await syncUser("mallory-clerk-id", "Mallory");

    const createRes = await request(app)
      .post("/api/groups")
      .set("X-Test-Clerk-Id", "alice-clerk-id")
      .send({ name: "Alice's trip" });

    const groupId = createRes.body._id;

    const res = await request(app)
      .get(`/api/expenses/group/${groupId}`)
      .set("X-Test-Clerk-Id", "mallory-clerk-id");

    expect(res.status).toBe(403);
  });

  it("block writing an expense to a group you don't belong to", async () => {
    await syncUser("alice-clerk-id", "Alice");
    await syncUser("mallory-clerk-id", "Mallory");

    const createRes = await request(app)
      .post("/api/groups")
      .set("X-Test-Clerk-Id", "alice-clerk-id")
      .send({ name: "Alice's Trip" });

    const groupId = createRes.body._id;

    const res = await request(app)
      .post(`/api/expenses/group/${groupId}`)
      .set("X-Test-Clerk-Id", "mallory-clerk-id")
      .send({ title: "Sneaky expense", amount: 10 });

    expect(res.status).toBe(403);
  });
});
