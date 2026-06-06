import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import type {
  ApiErrorBody,
  ApiErrorItem,
} from '../response/api-response.factory';

function mapValidationEntry(entry: unknown): ApiErrorItem {
  if (typeof entry !== 'object' || entry === null) {
    return { message: String(entry) };
  }
  const e = entry as Record<string, unknown>;
  if (
    typeof e.property === 'string' &&
    e.constraints &&
    typeof e.constraints === 'object'
  ) {
    const values = Object.values(e.constraints as Record<string, string>);
    const first = values[0];
    return { field: e.property, message: first ?? 'Invalid value' };
  }
  if (typeof e.message === 'string') {
    return { message: e.message };
  }
  return { message: JSON.stringify(entry) };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = this.normalizeHttpPayload(
        exception.getResponse(),
        exception.message,
      );
      return res.status(status).json(body);
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    const body: ApiErrorBody = {
      success: false,
      message: 'Internal server error',
    };
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }

  private normalizeHttpPayload(
    payload: unknown,
    fallbackMessage: string,
  ): ApiErrorBody {
    if (typeof payload === 'string') {
      return { success: false, message: payload };
    }
    if (typeof payload !== 'object' || payload === null) {
      return { success: false, message: fallbackMessage };
    }

    const messageRaw = (payload as Record<string, unknown>)['message'];
    const existingErrors = (payload as Record<string, unknown>)['errors'];

    if (Array.isArray(existingErrors)) {
      const errors = existingErrors.map((item) =>
        typeof item === 'object' &&
        item !== null &&
        'message' in item &&
        typeof (item as { message: unknown }).message === 'string'
          ? {
              field:
                typeof (item as { field?: unknown }).field === 'string'
                  ? (item as { field: string }).field
                  : undefined,
              message: (item as { message: string }).message,
            }
          : mapValidationEntry(item),
      );
      const message =
        typeof messageRaw === 'string'
          ? messageRaw
          : (errors[0]?.message ?? fallbackMessage);
      return { success: false, message, errors };
    }

    if (Array.isArray(messageRaw)) {
      const errors = messageRaw.map((entry) =>
        typeof entry === 'string'
          ? { message: entry }
          : mapValidationEntry(entry),
      );
      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    if (typeof messageRaw === 'string') {
      return { success: false, message: messageRaw };
    }

    return { success: false, message: fallbackMessage };
  }
}
