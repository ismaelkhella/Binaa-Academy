/**
 * e2e tests for real-time community chat (Socket.IO gateway + REST broadcast).
 *
 * Covers:
 *  1. Two subscribed students in the same subject room: one posts via REST,
 *     the other receives `message:new` immediately.
 *  2. A non-subscribed student's `join` is rejected with an error and they
 *     never receive `message:new` for that subject.
 *  3. After an admin deletes a message, every listener receives `message:deleted`.
 *
 * Runs against the real dev database; all rows are namespaced with a unique
 * prefix and removed in afterAll.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const PREFIX = `e2e-comm-${Date.now()}`;

function waitForEvent<T = any>(socket: Socket, event: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/** Resolves if the event arrives within windowMs, otherwise resolves null. */
function eventOrSilence<T = any>(socket: Socket, event: string, windowMs = 1500): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      resolve(null);
    }, windowMs);
    const handler = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };
    socket.once(event, handler);
  });
}

describe('Community gateway (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let baseUrl: string;

  let subjectId: string;
  let studentAId: string;
  let studentBId: string;
  let outsiderId: string;

  let tokenA: string;
  let tokenB: string;
  let tokenOutsider: string;
  let adminToken: string;

  const sockets: Socket[] = [];

  function connect(token: string): Promise<Socket> {
    const socket = io(`${baseUrl}/community`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('socket connect timeout')), 5000);
      socket.on('connect', () => {
        clearTimeout(timer);
        resolve(socket);
      });
      socket.on('connect_error', (e) => {
        clearTimeout(timer);
        reject(e);
      });
    });
  }

  /** Nest turns the handler's `{ event, data }` return value into an emitted event. */
  function joinRoom(socket: Socket, sid: string): Promise<{ event: string; data: any }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout waiting for join result')), 5000);
      const done = (event: string) => (data: any) => {
        clearTimeout(timer);
        socket.off('joined');
        socket.off('error');
        resolve({ event, data });
      };
      socket.once('joined', done('joined'));
      socket.once('error', done('error'));
      socket.emit('join', { subjectId: sid });
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    // ---- Seed isolated test data ----
    const teacherUser = await prisma.user.create({
      data: { phone: `${PREFIX}-teacher`, name: 'معلم اختبار', role: 'TEACHER' },
    });
    const teacher = await prisma.teacher.create({
      data: { userId: teacherUser.id, name: 'معلم اختبار' },
    });
    const subject = await prisma.subject.create({
      data: { name: `${PREFIX}-مادة`, grade: 'GRADE_12', branch: 'SCIENTIFIC', teacherId: teacher.id },
    });
    subjectId = subject.id;

    const plan =
      (await prisma.subscriptionPlan.findUnique({ where: { type: 'MONTHLY' } })) ||
      (await prisma.subscriptionPlan.create({
        data: { type: 'MONTHLY', nameAr: 'شهري', durationDays: 30, priceIls: 50 },
      }));

    const mkStudent = async (tag: string, subscribed: boolean) => {
      const user = await prisma.user.create({
        data: { phone: `${PREFIX}-${tag}`, name: `طالب ${tag}`, role: 'STUDENT', grade: 'GRADE_12', branch: 'SCIENTIFIC' },
      });
      if (subscribed) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
            subjects: { create: { subjectId } },
          },
        });
      }
      return user.id;
    };

    studentAId = await mkStudent('a', true);
    studentBId = await mkStudent('b', true);
    outsiderId = await mkStudent('outsider', false);

    const sign = (sub: string, role: string) =>
      jwt.sign({ sub, role }, { secret: process.env.JWT_SECRET, expiresIn: '10m' });
    tokenA = sign(studentAId, 'STUDENT');
    tokenB = sign(studentBId, 'STUDENT');
    tokenOutsider = sign(outsiderId, 'STUDENT');
    adminToken = jwt.sign({ sub: 'e2e-admin', role: 'ADMIN' }, {
      secret: process.env.ADMIN_JWT_SECRET,
      expiresIn: '10m',
    });
  });

  afterEach(() => {
    while (sockets.length) sockets.pop()?.disconnect();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.communityMessage.deleteMany({ where: { subjectId } });
      await prisma.subscription.deleteMany({ where: { user: { phone: { startsWith: PREFIX } } } });
      await prisma.subject.deleteMany({ where: { id: subjectId } });
      await prisma.teacher.deleteMany({ where: { user: { phone: { startsWith: PREFIX } } } });
      await prisma.user.deleteMany({ where: { phone: { startsWith: PREFIX } } });
    }
    await app?.close();
  });

  it('delivers message:new to another subscribed student in the same room', async () => {
    const [socketA, socketB] = await Promise.all([connect(tokenA), connect(tokenB)]);
    expect((await joinRoom(socketA, subjectId)).event).toBe('joined');
    expect((await joinRoom(socketB, subjectId)).event).toBe('joined');

    const received = waitForEvent(socketB, 'message:new');
    const res = await request(baseUrl)
      .post(`/api/community/${subjectId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'مرحبا من الطالب أ' });
    expect(res.status).toBe(201);

    const msg: any = await received;
    expect(msg.id).toBe(res.body.id);
    expect(msg.content).toBe('مرحبا من الطالب أ');
    expect(msg.subjectId).toBe(subjectId);
    expect(msg.sender.id).toBe(studentAId);
  });

  it('rejects join for a non-subscribed student and never sends them message:new', async () => {
    const [socketOut, socketA] = await Promise.all([connect(tokenOutsider), connect(tokenA)]);

    const result = await joinRoom(socketOut, subjectId);
    expect(result.event).toBe('error');
    expect(result.data.subjectId).toBe(subjectId);

    // Subscribed student joins and posts; outsider must stay silent.
    expect((await joinRoom(socketA, subjectId)).event).toBe('joined');
    const outsiderMsg = eventOrSilence(socketOut, 'message:new');
    const res = await request(baseUrl)
      .post(`/api/community/${subjectId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'رسالة يجب ألا تصل للغرباء' });
    expect(res.status).toBe(201);
    expect(await outsiderMsg).toBeNull();
  });

  it('broadcasts message:deleted to all listeners after an admin deletes a message', async () => {
    const [socketA, socketB] = await Promise.all([connect(tokenA), connect(tokenB)]);
    expect((await joinRoom(socketA, subjectId)).event).toBe('joined');
    expect((await joinRoom(socketB, subjectId)).event).toBe('joined');

    const posted = await request(baseUrl)
      .post(`/api/community/${subjectId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'رسالة سيتم حذفها' });
    expect(posted.status).toBe(201);
    const messageId = posted.body.id;

    const deletedA = waitForEvent(socketA, 'message:deleted');
    const deletedB = waitForEvent(socketB, 'message:deleted');
    const del = await request(baseUrl)
      .delete(`/api/admin/community/messages/${messageId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const [a, b]: any[] = await Promise.all([deletedA, deletedB]);
    expect(a).toEqual({ id: messageId, subjectId });
    expect(b).toEqual({ id: messageId, subjectId });
  });
});
