import { IPaginationMiddle } from '../../middlewares/PaginationMiddle.ts'

declare global {
  namespace Express {
    interface Request {
      pagination?: IPaginationMiddle.output

      // Autenticação (para quando implementar)
      userId?: string
      user?: any

      deviceInfo?: {
        ip?: string
        userAgent?: string
      }

      file?: any
      files?: any[]
    }
  }
}

export {}