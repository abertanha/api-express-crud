import { scryptSync } from 'node:crypto'
import { throwlhos } from '../../globals/Throwlhos.ts'
import { RefreshTokenRepository } from '../../models/RefreshToken/RefreshTokenRepository.ts'
import { UserRepository } from '../../models/User/UserRepository.ts'
import { Print } from '../../utilities/Print.ts'
import { Buffer } from "node:buffer";
import jwt from 'npm:jsonwebtoken';
import { Env } from '../../config/Env.ts';

export namespace AuthService {
  export type TTokenPayload = {
    id: string
    email: string
    name: string
    refreshTokenId: string
  }

  export type TUserSanitized = {
    _id: string
    name:string
    email: string
    cpf: string
  }

  export type TUserProfile = {
    _id: string
    name: string
    email: string
    cpf: string
    birthDate: Date
    isActive?: boolean
  }

  export namespace Login {
    export type Input = {
      input: {
        email: string
        password: string
      }
    }
    
    export type Output = {
      token: string
      refreshToken: string
      user: TUserSanitized
      expiresIn: string
    }
  }

  export namespace Logout {
    export type Input = {
      input: {
        refreshTokenId: string
      }
    }

    export type Output = void
  }
  
  export namespace RefreshAccessToken {
    export type Input = {
      input: {
        refreshTokenId: string
      }
    }
    export type Output = {
      token: string
      expiresIn: string
    }
  }

  export namespace GetUserById {
    export type Input = { 
      input: {
        userId: string
      }
    }

    export type Output = TUserProfile
  }
}

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

  constructor(
    userRepository: UserRepository = new UserRepository(),
    refreshTokenRepository: RefreshTokenRepository = new RefreshTokenRepository(),
    print: Print = new Print()
  ) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository
    this.print = print
  }
  async login(params: AuthService.Login.Input): Promise<AuthService.Login.Output> {
    const { email, password } = params.input
    const user = await this.userRepository.findOne({ email })
    
    if(!user) throw throwlhos.err_unauthorized('Email ou senha incorretos')
    if(!user.isActive) throw throwlhos.err_forbidden('Usuário desativado')
    
    const isPasswordValid = this.validatePassword(password, user.password);
    
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

  async logout(params: AuthService.Logout.Input): Promise<AuthService.Logout.Output> {
    const { refreshTokenId } = params.input

    await this.refreshTokenRepository.deleteById(refreshTokenId)
  }

  async refreshAccessToken(params: AuthService.RefreshAccessToken.Input): Promise<AuthService.RefreshAccessToken.Output> {
    const { refreshTokenId } = params.input
    const refreshToken = await this.refreshTokenRepository.findById(refreshTokenId);
    
    if(!refreshToken) throw throwlhos.err_unauthorized('Refresh token inválido')
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

    return { 
      token,
      expiresIn: Env.jwtExpiresIn,
    };
  }

  async getUserById(params: AuthService.GetUserById.Input): Promise<AuthService.GetUserById.Output> {
    const { userId } = params.input

    const user = await this.userRepository
      .findById(userId)
      .select('name email cpf birthDate isActive')
      .lean()
      .exec();

    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { userId });
    }

    return {
      _id: user._id?.toString(),
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      birthDate: user.birthDate,
      isActive: user.isActive,
    };
  }

  private validatePassword (plainPassword: string, hashedPassword: string) {
    const [salt, storedHash] = hashedPassword.split('.');
    const hash = scryptSync(plainPassword, salt, 32) as Buffer;

    return storedHash === hash.toString('hex')
  }
}