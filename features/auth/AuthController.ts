import { Request, Response, NextFunction } from 'npm:express'
import { Print } from '../../utilities/Print.ts'
import { AuthService } from './AuthService.ts'

export class AuthController {
  private readonly authService: AuthService
  private readonly print: Print

  constructor(
    authService: AuthService = new AuthService(),
    print: Print = new Print()
  ) {
    this.authService = authService
    this.print = print
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body

      if(!email || !password) {
        return res.send_badRequest('Email e senha são obrigatórios')
      }

      const result = await this.authService.login({
        input:{
          email: email,
          password: password 
        }
      })

      return res.send_ok('Login realizado com sucesso', result)
    } catch (error) {
      next(error)
    }
  }
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshTokenId = req.refreshTokenId

      if(!refreshTokenId) {
        return res.send_badRequest('Refresh token não encontrado')
      }

      await this.authService.logout({
        input: {
          refreshTokenId
        }
      })

      return res.send_ok('Logout realizado com sucesso')
    } catch (error) {
      next(error)
    }
  }
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshTokenId } = req.body

      if(!refreshTokenId) return res.send_badRequest('Refresh token é obrigatório')

      const result = await this.authService.refreshAccessToken({
        input:{
          refreshTokenId: refreshTokenId
        }
      })

      return res.send_ok('Token renovado com sucesso', result)
    } catch (error) {
      next(error)
    }
  }
  me = async (req: Request, res:Response, next: NextFunction) => {
    try {
      const userId = req.userId

      if(!userId) return res.send_unauthorized('Usuário não autenticado')
      
      const user = await this.authService.getUserById({
        input: {
          userId: userId
        }
      })

      return res.send_ok('Dados do usuário', user)
    } catch (error) {
      next(error)
    }
  }
}