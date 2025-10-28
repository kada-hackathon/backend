require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.DISABLE_EMAIL = 'true';
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');

beforeAll(async () => {
    const uri = process.env.MONGO_URI_TEST || process.env.MONGO_URI || 'mongodb://localhost:27017/networkdb_test';
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('POST /api/admin/employees', () => {
    it('should add a new employee', async () => {
        const email = `snyzy13+${Date.now()}@gmail.com`;
        const res = await request(app)
            .post('/api/admin/employees')
            .send({
                email,
                password: 'password123',
                name: 'Sana',
                division: 'Engineering'
            });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('status', 'success');
    });
});

describe('GET /api/admin/employees', () => {
    it('should get the list of employees', async () => {
        const res = await request(app)
            .get('/api/admin/employees');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'success');
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
describe('PUT /api/admin/employees/:id', () => {
    it('should edit an existing employee', async () => {
        // First, add an employee to edit
        const email = `edit${Date.now()}@gmail.com`;
        const addRes = await request(app)
            .post('/api/admin/employees')
            .send({
                email,
                password: 'password123',
                name: 'Sana',
                division: 'Engineering'
            });

            const employeeId = addRes.body.data.id;

        // Now, edit the employee
        const editRes = await request(app)
            .put(`/api/admin/employees/${employeeId}`)
            .send({
                email: `sana+${Date.now()}@gmail.com`,
                name: 'Sana Ali',
                division: 'Product'
            });

        expect(editRes.status).toBe(200);
        expect(editRes.body).toHaveProperty('status', 'success');
        expect(editRes.body.data).toHaveProperty('id', employeeId);
        expect(editRes.body.data).toHaveProperty('email');
        expect(editRes.body.data).toHaveProperty('name', 'Sana Ali');
        expect(editRes.body.data).toHaveProperty('division', 'Product');
    });
});
describe('DELETE /api/admin/employees/:id', () => {
    it('should delete an existing employee', async () => {
        // First, add an employee to delete
        const email = `del${Date.now()}@gmail.com`;
        const addRes = await request(app)
            .post('/api/admin/employees')
            .send({
                email,
                password: 'password123',
                name: 'Sana Ali',
                division: 'Product'
            });

            const employeeId = addRes.body.data.id;

        // Now, delete the employee
        const deleteRes = await request(app)
            .delete(`/api/admin/employees/${employeeId}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toHaveProperty('status', 'success');
    });
});

describe('POST /api/auth/login', ()=>{
    it('should login an user', async ()=>{
        const email = `login${Date.now()}@gmail.com`;
        // create user first
        await request(app)
            .post('/api/admin/employees')
            .send({ email, password: 'password123', name: 'Login User', division: 'QA' });

        const res = await request(app)
        .post('/api/auth/login')
        .send({
            email,
            password: 'password123'
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
    });
});

describe('POST /api/auth/forgot-password', ()=>{
    it('should initiate forgot password process', async ()=>{
        const email = `forgot${Date.now()}@gmail.com`;
        // create user first
        await request(app)
            .post('/api/admin/employees')
            .send({ email, password: 'password123', name: 'Forgot User', division: 'Support' });

        const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });
});
describe('POST /api/auth/logout', ()=>{
    it('should logout an user', async ()=>{
    const res = await request(app)
    .post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    });
});