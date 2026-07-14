import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers (CSP, X-Frame-Options, etc.)
  app.use(helmet());

  // Allow the React frontend (port 5173) to make requests to this backend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Global exception filter — normalizes all error responses to a consistent shape
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validate all incoming request bodies against DTO class rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (validationErrors) => {
        const errors = validationErrors.map((err) => ({
          field: err.property,
          messages: Object.values(err.constraints || {}),
        }));
        return new BadRequestException({ message: 'Validation failed', errors });
      },
    }),
  );

  // Apply @Exclude() decorators on entities (e.g. hide passwordHash from responses)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
