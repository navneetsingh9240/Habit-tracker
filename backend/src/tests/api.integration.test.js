const request = require('supertest');
const app = require('../app');
const prisma = require('../db');

describe('API Integration Tests', () => {
  let token;
  let userId;
  let habitId;

  beforeAll(async () => {
    // Clean database before integration tests
    await prisma.habitCheckIn.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.habitCheckIn.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Authentication Endpoints', () => {
    it('registers a new user with valid IANA timezone', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        timezone: 'Asia/Kolkata',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.timezone).toBe('Asia/Kolkata');

      token = res.body.token;
      userId = res.body.user.id;
    });

    it('rejects registration with invalid IANA timezone', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'invalid-tz@example.com',
        password: 'password123',
        timezone: 'Fake/Timezone',
      });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('Invalid IANA timezone');
    });

    it('logs in an existing user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('gets current user details (/api/auth/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
    });
  });

  describe('Habits & Check-ins Endpoints', () => {
    it('creates a habit for the authenticated user', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Morning Meditation',
          description: '10 minutes of mindfulness',
        });

      expect(res.status).toBe(201);
      expect(res.body.habit.name).toBe('Morning Meditation');
      habitId = res.body.habit.id;
    });

    it('allows checking in for today', async () => {
      const res = await request(app)
        .post(`/api/habits/${habitId}/check-ins`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.checkIn).toHaveProperty('localDate');
      expect(res.body.streaks.currentStreak).toBe(1);
    });

    it('rejects duplicate check-in for the same habit and local date (409 Conflict)', async () => {
      const res = await request(app)
        .post(`/api/habits/${habitId}/check-ins`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('already exists');
    });

    it('allows backfilling a past local date', async () => {
      const res = await request(app)
        .post(`/api/habits/${habitId}/check-ins`)
        .set('Authorization', `Bearer ${token}`)
        .send({ localDate: '2026-08-01' });

      expect(res.status).toBe(201);
      expect(res.body.checkIn.localDate).toBe('2026-08-01');
    });

    it('rejects checking in for a future local date', async () => {
      const res = await request(app)
        .post(`/api/habits/${habitId}/check-ins`)
        .set('Authorization', `Bearer ${token}`)
        .send({ localDate: '2099-12-31' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('future date');
    });
  });

  describe('Authorization & IDOR Protection', () => {
    let secondToken;

    beforeAll(async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'other@example.com',
        password: 'password123',
        timezone: 'America/New_York',
      });
      secondToken = res.body.token;
    });

    it('prevents user B from checking in for user A habit (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/habits/${habitId}/check-ins`)
        .set('Authorization', `Bearer ${secondToken}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('prevents user B from deleting user A habit (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${secondToken}`);

      expect(res.status).toBe(403);
    });
  });
});
