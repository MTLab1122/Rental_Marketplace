import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  // Set global API prefix while keeping health and ready endpoints accessible at root
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'ready', 'docs', 'docs-json'],
  });

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Swagger / OpenAPI Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rental Marketplace Peshawar API')
    .setDescription(
      'Production-ready rental property platform exclusively for Peshawar, Khyber Pakhtunkhwa, Pakistan.\n' +
        'Enforces strict tenant classification (STUDENT vs FAMILY) and single-eligibility constraints.',
    )
    .setVersion('1.0.0')
    .addTag('Health & Diagnostics')
    .addTag('Authentication')
    .addTag('Properties')
    .addTag('Localities')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env['PORT'] ? Number(process.env['PORT']) : 4000;
  await app.listen(port);
  pinoLogger.log(`Application is running on: http://localhost:${port}/api/v1`);
  pinoLogger.log(`Interactive API Documentation: http://localhost:${port}/docs`);
}

bootstrap();
