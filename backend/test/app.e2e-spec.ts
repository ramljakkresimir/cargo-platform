import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// TS-specific `import ... = require()` avoids the same default-import/esModuleInterop
// mismatch with supertest's "export =" CJS typings that a plain `import request from
// 'supertest'` hit (resolved to `.default`, undefined, at runtime) — while keeping
// supertest's own types (a bare `require()` call would type `request` as `any`).
import request = require('supertest');
import { AppModule } from './../src/app.module';

interface HealthResponse {
  status: string;
  timestamp: string;
}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as HealthResponse;
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  afterEach(async () => {
    await app.close();
  });
});
