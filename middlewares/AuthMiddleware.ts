import { NextFunction, Request, Response } from 'npm:express'
import { throwlhos } from '../globals/Throwlhos.ts'
import { RefreshTokenRepository } from '../models/RefreshToken/RefreshTokenRepository.ts'
import { UserRepository } from '../models/User/UserRepository.ts'
import { Print } from '../utilities/Print.ts'
import jwt from 'npm:jsonwebtoken'
import { Env } from '../config/Env.ts'

const print = new Print();

export interface TokenPayload {
  id: string  //nunca pode ser string, sempre Types.ObjectId
  email: string
  name: string
  refreshTokenId: string
}

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
      userName?: string
      refreshTokenId?: string
    }
  }
}

export const AuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const userRepository = new UserRepository()
    const refreshTokenRepository = new RefreshTokenRepository()

    if(!req.headers.authorization) {
      throw throwlhos.err_unauthorized('Acesso negado: sem autenticação.')
    }

    const [bearer, token] = req.headers.authorization.split(' ')

    if (bearer !== 'Bearer' || !token) {
      throw throwlhos.err_unauthorized('Formato de token inválido')
    }
    
    jwt.verify(
      token,
      Env.jwtSecret,
      async(error: unknown, decoded: unknown) => {
        try {
          if (error) {
            if (Env.local) {
              print.error('[AuthMiddleware] JWT Error:', error)
            }
            throw throwlhos.err_unauthorized('Token expirado ou inválido')
          }

          const tokenPayload = decoded as TokenPayload

          if(!tokenPayload?.refreshTokenId) {
            throw throwlhos.err_unauthorized('Token inválido')
          }

          const refreshToken = await refreshTokenRepository.findById(
            tokenPayload.refreshTokenId,
          )
          if (!refreshToken) {
            throw throwlhos.err_unauthorized('Sessão inválida. Faça login novamente')
          } 

          if(refreshToken.hasExpired) {
            await refreshTokenRepository.deleteById(tokenPayload.refreshTokenId)
            throw throwlhos.err_unauthorized('Sessão expirada. Faça login novamente')
          }

          const user = await userRepository.findById(tokenPayload.id)

          if (!user) throw throwlhos.err_unauthorized('Usuário não encontrado')
          if (!user.isActive) throw throwlhos.err_forbidden('Usuário desativado')  
          
          req.userId = tokenPayload.id
          req.userEmail = tokenPayload.email
          req.userName = tokenPayload.name
          req.refreshTokenId = tokenPayload.refreshTokenId

          await refreshTokenRepository.updateById(
            tokenPayload.refreshTokenId,
            { lastActivityAt: new Date() },
          )

          if (Env.local) {
            print.info(`[AuthMiddleware] User authenticated: ${user.email}`)
          }

          return next()

        } catch (err) {
          print.error('[AuthMiddleWare] Error: ', err)
          next(err)
        }
      }
    )
  } catch (err) {
    print.error('[AuthMiddleware] Error: ', err)
    next(err)
  }
}