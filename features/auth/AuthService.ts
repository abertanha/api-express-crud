import { scryptSync } from 'node:crypto'
import { throwlhos } from '../../global/Throwlhos.ts'
import { RefreshTokenRepository } from '../../models/RefreshToken/RefreshTokenRepository.ts'
import { UserRepository } from '../../models/User/UserRepository.ts'
import { Print } from '../../utilities/Print.ts'
import { Buffer } from "node:buffer";
import jwt from 'npm:jsonwebtoken';
import { Env } from '../../config/Env.ts';

export interface LoginDTO {
  email: string
  password: string
}

export interface AuthResponseDTO {
  token: string
  refreshToken: string
  user: {
    _id: string
    name: string
    email: string
    cpf: string
  }
  expiresIn: string
}

export interface TokenPayload {
  id: string
  email: string
  name: string
  refreshTokenId: string
}

export class AuthService {
  private readonly userRepository: UserRepository
  private readonly refreshTokenRepository: RefreshTokenRepository
  private readonly print: Print

  constructor(
    userRepository: UserRepository = new UserRepository(),
    refreshTokenRepository: RefreshTokenRepository = new RefreshTokenRepository(),
    print: Print = new Print()
  ) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository
    this.print = print
  }
  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.userRepository.findOne({ email: data.email })
    
    if(!user) throw throwlhos.err_unauthorized('Email ou senha incorretos')
    if(!user.isActive) throw throwlhos.err_forbidden('Usuário desativado')
    
    const isPasswordValid = this.validatePassword(data.password, user.password);
    
    if(!isPasswordValid) throw throwlhos.err_unauthorized('Email ou senha incorretos')
    
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + Env.refreshTokenDays)

    const refreshToken = await this.refreshTokenRepository.createOne({
      userId: user._id!,
      expiration: expirationDate,
      lastActivityAt: new Date(),
    });

    const tokenPayload: TokenPayload = {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      refreshTokenId: refreshToken._id.toString(),
    }

    const token = jwt.sign(
      tokenPayload,
      Env.jwtSecret,
      {
        expiresIn: Env.jwtExpiresIn,
        algorithm: Env.jwtAuthAlgorithm as jwt.Algorithm,
      }
    )

    this.print.sucess(`✅ Login realizado: ${user.email}`)

    return {
      token,
      refreshToken: refreshToken._id!.toString(),
      expiresIn: Env.jwtExpiresIn,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        cpf: user.cpf,
      },
    }
  }

  async logout(refreshTokenId: string): Promise<void> {
    await this.refreshTokenRepository.deleteById(refreshTokenId)
    this.print.sucess(`✅ Logout realizado`)
  }

  async refreshAccessToken(refreshTokenId: string): Promise<{
    token: string
    expiresIn: string
  }> {
    const refreshToken = await this.refreshTokenRepository.findById(refreshTokenId);
    
    if(!refreshToken) throw throwlhos.err_unauthorized('Refresh token inválido')
    // TODO não exportou por que aqui?
    if(refreshToken.hasExpired) {
      await this.refreshTokenRepository.deleteById(refreshTokenId)
      throw throwlhos.err_unauthorized('Refresh token expirado!')
    }

    const user = await this.userRepository.findById(refreshToken.userId.toString())

    if(!user) throw throwlhos.err_unauthorized('Usuário não encontrado')

    await this.refreshTokenRepository.updateById(refreshTokenId, {
      lastActivityAt: new Date(),
    })

    const tokenPayload: TokenPayload = {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      refreshTokenId: refreshTokenId,
    };

    const token = jwt.sign(
      tokenPayload,
      Env.jwtSecret,
      {
        expiresIn: Env.jwtExpiresIn,
        algorithm: Env.jwtAuthAlgorithm as jwt.Algorithm,
      }
    );

    this.print.sucess(`✅ Token renovado para: ${user.email}`)

    return { 
      token,
      expiresIn: Env.jwtExpiresIn,
    };
  }

  private validatePassword (plainPassword: string, hashedPassword: string) {
    const [salt, storedHash] = hashedPassword.split('.');
    const hash = scryptSync(plainPassword, salt, 32) as Buffer;

    return storedHash === hash.toString('hex')
  }
}