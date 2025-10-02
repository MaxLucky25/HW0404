import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponseBody } from './error-response-body.type';
import { isErrorWithMessage } from './is-error-with-message';
import { ThrottlerException } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

@Catch(ThrottlerException)
export class AllHttpExceptionsFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: ThrottlerException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Логируем для отладки
    console.log('AllHttpExceptionsFilter caught ThrottlerException:', {
      exception: exception?.constructor?.name,
      message: exception.message,
    });

    const status = HttpStatus.TOO_MANY_REQUESTS;
    const message = exception.message;

    const responseBody = this.buildResponseBody(message);

    response.status(status).json(responseBody);
  }

  private buildResponseBody(message: string): ErrorResponseBody {
    return {
      errorsMessages: [
        {
          message,
          field: ' We are working to fix this issue. Please try again later.',
        },
      ],
    };
  }
}
