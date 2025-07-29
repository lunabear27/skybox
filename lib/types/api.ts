// Enterprise-grade API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface AuthResponse {
  sessionId?: string;
  accountId?: string;
  user?: {
    $id: string;
    email: string;
    name: string;
  };
}

export enum ErrorCodes {
  // Authentication errors
  INVALID_CREDENTIALS = 'AUTH_001',
  USER_NOT_FOUND = 'AUTH_002',
  USER_EXISTS = 'AUTH_003',
  WEAK_PASSWORD = 'AUTH_004',
  INVALID_EMAIL = 'AUTH_005',
  
  // Server errors
  INTERNAL_ERROR = 'SRV_001',
  DATABASE_ERROR = 'SRV_002',
  NETWORK_ERROR = 'SRV_003',
  
  // Validation errors
  VALIDATION_ERROR = 'VAL_001',
  MISSING_FIELD = 'VAL_002',
}

export const ErrorMessages = {
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCodes.USER_NOT_FOUND]: 'Invalid email or password', // Same message for security
  [ErrorCodes.USER_EXISTS]: 'An account with this email already exists',
  [ErrorCodes.WEAK_PASSWORD]: 'Password must be at least 8 characters long',
  [ErrorCodes.INVALID_EMAIL]: 'Please enter a valid email address',
  [ErrorCodes.INTERNAL_ERROR]: 'Something went wrong. Please try again.',
  [ErrorCodes.DATABASE_ERROR]: 'Service temporarily unavailable. Please try again.',
  [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.MISSING_FIELD]: 'Please fill in all required fields.',
} as const;