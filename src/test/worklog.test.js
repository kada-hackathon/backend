/**
 * @file tests/worklog.test.js
 * Unit test untuk endpoint WorkLog (GET, ADD, EDIT, DELETE)
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const app = require('../../app');
const User = require("../models/User");
const WorkLog = require("../models/WorkLog");

process.env.JWT_SECRET = "testsecret";

let mongoServer;
let token;
let userId;

beforeAll(async () => {
  // Jalankan database in-memory
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: "testdb" });

  // Buat user dummy
  const user = await User.create({
    name: "Test User",
    email: "test@gmail.com",
    password: "123456", // nanti di-hash otomatis lewat pre-save hook
    division: "Engineering",
    role: "user"
  });

  userId = user._id;

  // Generate token JWT
  token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "testsecret",
    { expiresIn: "1h" }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("WorkLog API", () => {
  let worklogId;

  // ADD WorkLog
  it("should create a new worklog", async () => {
    const res = await request(app)
      .post("/api/worklogs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Daily Standup",
        content: "Discuss project progress",
        tag: ["meeting", "daily"],
        media: ["https://example.com/image.png"]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.title).toBe("Daily Standup");
    worklogId = res.body._id;
  });

  // GET WorkLogs
  it("should get all worklogs", async () => {
    const res = await request(app)
      .get("/api/worklogs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // EDIT WorkLog
  it("should edit a worklog", async () => {
    const res = await request(app)
      .put(`/api/worklogs/${worklogId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Updated content after standup meeting" });

    expect(res.statusCode).toBe(200);
    expect(res.body.content).toBe("Updated content after standup meeting");
  });

  // DELETE WorkLog
  it("should delete a worklog", async () => {
    const res = await request(app)
      .delete(`/api/worklogs/${worklogId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("WorkLog deleted successfully");
  });
});
