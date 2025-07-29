import { ApiResponse, ErrorCodes, ErrorMessages } from '../types/api';

// Simple UUID generator to replace uuid dependency
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class ApiResponseBuilder {
  static success<T>(data: T, meta?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateId(),
        version: '1.0.0',
        ...meta,
      },
    };
  }

  static error(
    code: ErrorCodes,
    customMessage?: string,
    details?: any
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message: customMessage || ErrorMessages[code],
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateId(),
        version: '1.0.0',
      },
    };
  }
}

// Enterprise logging utility
export class Logger {
  static info(message: string, data?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  }

  static error(message: string, error?: any, context?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      context,
    });
  }

  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
}