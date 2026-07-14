import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// Plain require avoids a TS default-import/esModuleInterop mismatch with supertest's
// "export =" CJS typings that made `import request from 'supertest'` resolve to
// `.default` at runtime (undefined) under this project's ts-jest config.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from './../src/app.module';

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
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });

  afterEach(async () => {
    await app.close();
  });
});
