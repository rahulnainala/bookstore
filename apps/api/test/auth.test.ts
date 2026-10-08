import { describe, expect, it } from "vitest";
import { app, request } from "./helpers";

describe("auth", () => {
  const email = `auth-${Date.now()}@example.com`;

  it("registers, sets a session cookie and returns the public user", async () => {
    const agent = request.agent(app);
    const res = await agent
      .post("/api/v1/auth/register")
      .send({ name: "Ada Lovelace", email: email.toUpperCase(), password: "correct-horse" })
      .expect(201);
    expect(res.body.user).toMatchObject({
      name: "Ada Lovelace",
      email,
      role: "CUSTOMER",
      isDemo: false,
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/bookstore_session=.*HttpOnly/i);

    const me = await agent.get("/api/v1/auth/me").expect(200);
    expect(me.body.user.email).toBe(email);
  });

  it("rejects a duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Ada Again", email, password: "correct-horse" })
      .expect(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("validates registration input field by field", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "A", email: "not-an-email", password: "short" })
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(res.body.error.details).sort()).toEqual(["email", "name", "password"]);
  });

  it("logs in with the right password only", async () => {
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "wrong-password" })
      .expect(401);
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "correct-horse" })
      .expect(200);
  });

  it("signs in as the demo accounts", async () => {
    const res = await request(app).post("/api/v1/auth/demo").send({ role: "admin" }).expect(200);
    expect(res.body.user).toMatchObject({ role: "ADMIN", isDemo: true });
  });

  it("returns 401 for /me without a session and clears the cookie on logout", async () => {
    await request(app).get("/api/v1/auth/me").expect(401);
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/demo").send({ role: "customer" }).expect(200);
    await agent.post("/api/v1/auth/logout").expect(204);
    await agent.get("/api/v1/auth/me").expect(401);
  });

  it("ignores a tampered session cookie", async () => {
    await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", "bookstore_session=not.a.jwt")
      .expect(401);
  });
});
