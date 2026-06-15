import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the React frontend (port 5173) to make requests to this backend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Validate all incoming request bodies against DTO class rules
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,   // strip properties that have no decorators
      transform: true,   // auto-convert strings to numbers/booleans where typed
    }),
  );

  // Apply @Exclude() decorators on entities (e.g. hide passwordHash from responses)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
