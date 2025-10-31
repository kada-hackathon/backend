const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const User = require("../models/User");
const WorkLog = require("../models/WorkLog");
const LogHistory = require("../models/LogHistory");

process.env.JWT_SECRET = "testsecret";

let mongoServer, token, user, worklog;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create dummy user
  user = await User.create({
    name: "Tester",
    email: "tester@example.com",
    password: "hashedpassword",
    division: "Engineering",
    role: "user"
  });

  // Create JWT token
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  // Create dummy worklog
  worklog = await WorkLog.create({
    title: "Initial log",
    content: "Some content",
    tag: "test",
    user: user._id,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("WorkLog Versions API", () => {
  test("should add a new version (log history) to a worklog", async () => {
    const res1 = await request(app)
        .post(`/api/worklogs/${worklog._id}/versions`)
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "Edited worklog title" });

    expect(res1.statusCode).toBe(201);
    expect(res1.body).toHaveProperty("message", "Version added");

    // tambahkan versi kedua
    const res2 = await request(app)
        .post(`/api/worklogs/${worklog._id}/versions`)
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "Another edit made" });

    expect(res2.statusCode).toBe(201);
    expect(res2.body).toHaveProperty("message", "Version added");
  });

  test("should get all versions (log history) for a worklog", async () => {
    // Add another version for testing retrieval
    const res = await request(app)
        .get(`/api/worklogs/${worklog._id}/versions`)
        .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("versions");
    expect(Array.isArray(res.body.versions)).toBe(true);
    expect(res.body.versions.length).toBeGreaterThanOrEqual(2); 
  });
});
