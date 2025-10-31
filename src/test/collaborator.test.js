const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../app");
const User = require("../models/User");
const WorkLog = require("../models/WorkLog");
const jwt = require("jsonwebtoken");


describe("Collaborator API", () => {
  let token, user, collaborator, worklog, mongoServer;

  beforeAll(async () => {
    // Jalankan MongoDB in-memory
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Buat user utama
    user = await User.create({
      name: "Main User",
      email: "mainuser@gmail.com",
      password: "password123",
      division: "IT",
      role: "user",
    });

    // Generate token JWT
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "testsecret", {
      expiresIn: "1h",
    });

    // Buat collaborator dummy
    collaborator = await User.create({
      name: "Collaborator User",
      email: "collabuser@gmail.com",
      password: "password123",
      division: "Marketing",
      role: "user",
    });

    // Buat WorkLog dummy
    worklog = await WorkLog.create({
      title: "Collaborator Test Log",
      content: "Testing collaborator addition.",
      tag: ["testing"],
      media: [],
      user: user._id,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  // Add Collaborator
  it("should add a collaborator to a worklog", async () => {
    const res = await request(app)
      .post(`/api/worklogs/${worklog._id}/collaborators`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: collaborator.email });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Collaborator added");
    expect(res.body.log.collaborators).toContainEqual(expect.any(String));
  });

  // Get Collaborators
  it("should get all collaborators of a worklog", async () => {
    const res = await request(app)
      .get(`/api/worklogs/${worklog._id}/collaborators`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.collaborators)).toBe(true);
    expect(res.body.collaborators.length).toBeGreaterThanOrEqual(1);
  });

  // Delete Collaborator
  it("should remove a collaborator from a worklog", async () => {
    const res = await request(app)
      .delete(`/api/worklogs/${worklog._id}/collaborators/${collaborator._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Collaborator removed successfully");
  });
});
    