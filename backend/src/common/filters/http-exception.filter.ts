import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Shape produced by our custom ValidationPipe exceptionFactory (main.ts) and,
// in the plain-message branch, NestJS's default HttpException body.
interface ExceptionResponseBody {
  message?: string | string[];
  errors?: { field: string; messages: string[] }[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let errors: { field: string; messages: string[] }[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as ExceptionResponseBody;

        if (resp.errors) {
          // Structured validation errors produced by our custom exceptionFactory
          message = (resp.message as string) || 'Validation failed';
          errors = resp.errors;
        } else if (Array.isArray(resp.message)) {
          // Default NestJS ValidationPipe format: message is string[]
          message = 'Validation failed';
          errors = resp.message.map((msg) => ({
            field: msg.split(' ')[0],
            messages: [msg],
          }));
        } else {
          message = resp.message || message;
        }
      }
    } else if (exception instanceof Error) {
      console.error('Unhandled error:', exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
