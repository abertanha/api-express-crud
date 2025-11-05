import { AuthService } from '../AuthService.ts';
import { MockAuthRepository } from './MockAuthRepository.ts';
import { RefreshTokenRepository } from '../../../models/RefreshToken/RefreshTokenRepository.ts';
import { MockUserRepository } from '../../user/mocks/MockUserRepository.ts';
import { UserRepository } from '../../../models/User/UserRepository.ts';
import { Time } from '../../../utilities/Time.ts'

export class MockAuthService extends AuthService {
  constructor() {
    super(
      new MockUserRepository() as unknown as UserRepository,
      new MockAuthRepository() as unknown as RefreshTokenRepository,
    );
  }

  override async login(params: AuthService.Login.Input): Promise<AuthService.Login.Output> {
    const { email, password } = params.input
    const user = await (this as any).userRepository.findOne({ email }).exec();
    if (!user) throw { code: 401, status: 'UNAUTHORIZED', message: 'Email ou senha incorretos' };
    if (!user.isActive) throw { code: 403, status: 'FORBIDDEN', message: 'Usuário desativado' };
    
    if (password !== 'password123') throw { code: 401, status: 'UNAUTHORIZED', message: 'Email ou senha incorretos' };

    const refreshToken = await (this as any).refreshTokenRepository.createOne({
      userId: user._id,
      expiration: Time.now().add((1000 * 60 * 60 * 24), 'ms').toDate(),
      lastActivityAt: Time.now().toDate(),
    });

    return {
      token: 'mock-jwt-token',
      refreshToken: refreshToken._id!.toString(),
      expiresIn: '1h',
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        cpf: user.cpf,
      },
    };
  }

  override async logout(params: AuthService.Logout.Input): Promise<AuthService.Logout.Output> {
    const { refreshTokenId } = params.input
    await (this as any).refreshTokenRepository.deleteById(refreshTokenId);
  }

  override async refreshAccessToken(params: AuthService.RefreshAccessToken.Input): Promise<AuthService.RefreshAccessToken.Output> {
    const { refreshTokenId } = params.input
    const refresh = await (this as any).refreshTokenRepository.findById(refreshTokenId).exec();
    if (!refresh) throw { code: 401, status: 'UNAUTHORIZED', message: 'Refresh token inválido' };
    if (refresh.hasExpired) {
      await (this as any).refreshTokenRepository.deleteById(refreshTokenId);
      throw { code: 401, status: 'UNAUTHORIZED', message: 'Refresh token expirado!' };
    }

    const user = await (this as any).userRepository.findById(refresh.userId.toString()).exec();
    if (!user) throw { code: 401, status: 'UNAUTHORIZED', message: 'Usuário não encontrado' };

    await (this as any).refreshTokenRepository.updateById(refreshTokenId, { lastActivityAt: Time.now().toDate() });

    return { token: 'mock-jwt-token-refreshed', expiresIn: '1h' };
  }
}
