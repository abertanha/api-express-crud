import { Response, NextFunction } from 'npm:express'
import { Print } from '../utilities/Print.ts'

export const MockResponser = {
  send_ok: (message: string, data?: unknown) => ({
    success: true,
    message,
    data,
    code: 200,
    status: 'OK',
  }),
  send_created: (message: string, data?: unknown) => ({
    success: true,
    message,
    data,
    code: 201,
    status: 'CREATED',
  }),
  send_partialContent: (message: string, data?: unknown) => ({
    success: true,
    message,
    data,
    code: 206,
    status: 'PARTIAL_CONTENT',
  }),
  send_noContent: (message: string, data?: unknown) => ({
    success: true,
    message,
    data,
    code: 204,
    status: 'NO_CONTENT',
  }),
  send_badRequest: (message: string, errors?: unknown) => ({
    success: false,
    errors,
    message,
    code: 400,
    status: 'BAD_REQUEST',
  }),
  send_unauthorized: (message: string, errors?: unknown) => ({
    success: false,
    errors,
    message,
    code: 401,
    status: 'UNAUTHORIZED',
  }),
  send_forbidden: (message: string, errors?: unknown) => ({
    success: false,
    errors,
    message,
    code: 403,
    status: 'FORBIDDEN',
  }),
  send_notFound: (message: string, errors?: unknown) => ({
    success: false,
    errors,
    message,
    code: 404,
    status: 'NOT_FOUND',
  }),
  send_conflict: (message: string, errors?: unknown) => ({
    success: false,
    errors,
    message,
    code: 409,
    status: 'CONFLICT',
  }),
  send_internalServerError: (message: string, errors?: unknown) => ({
    success: false,
    errors,
    message,
    code: 500,
    status: 'INTERNAL_SERVER_ERROR',
  }),
} as unknown as Response

export const MockNextFunction: NextFunction = (error?: any) => {
  if (error) {
    const print = new Print()
    print.error('Error caught by MockNextFunction:', error)
  }
}

export const MockSession = {
  startTransaction: () => {},
  abortTransaction: () => Promise.resolve(),
  commitTransaction: () => Promise.resolve(),
  endSession: () => {},
}