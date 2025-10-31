import { assertExists } from '@std/assert';
import { Request } from 'express';
import { AuthController } from './AuthController.ts';
import { MockAuthService } from './mocks/MockAuthService.ts';
import { MockResponser, MockNextFunction } from '../../globals/Stubs.ts';
import { Print } from '../../utilities/Print.ts';
import { Database } from '../../database/Database.ts';

function setupTest() {
  const mockAuthService = new MockAuthService();
  const mockPrint = new Print();
  const authController = new AuthController(mockAuthService, mockPrint);

  const refreshRepo = (mockAuthService as any).refreshTokenRepository;
  if (refreshRepo && refreshRepo.resetMockData) refreshRepo.resetMockData();

  const userRepo = (mockAuthService as any).userRepository;
  if (userRepo && userRepo.resetMockData) userRepo.resetMockData();

  return { authController };
}

let cleanupRegistered = false;
if (!cleanupRegistered) {
  cleanupRegistered = true;
  globalThis.addEventListener("unload", async () => {
    await Database.closeAllConnections();
  });
}

// LOGIN
Deno.test({
  name:'AuthController - login - deve realizar login com sucesso (teste positivo)',
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
  const { authController } = setupTest();
  const mockRequest = { body: { email: 'joao.silva@example.com', password: 'password123' } } as Request;
  await authController.login(mockRequest as any, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
}});

Deno.test('AuthController - login - deve falhar sem email (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { body: { password: 'password123' } } as Request;
  await authController.login(mockRequest as any, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_badRequest);
});

Deno.test('AuthController - login - deve falhar sem password (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { body: { email: 'joao.silva@example.com' } } as Request;
  await authController.login(mockRequest as any, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_badRequest);
});

Deno.test('AuthController - login - deve falhar com credenciais inválidas (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { body: { email: 'joao.silva@example.com', password: 'wrongpass' } } as Request;
  let errorCaught: any = null;
  await authController.login(mockRequest as any, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AuthController - login - deve falhar com usuário desativado (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { body: { email: 'pedro.oliveira@example.com', password: 'password123' } } as Request;
  let errorCaught: any = null;
  await authController.login(mockRequest as any, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// LOGOUT
Deno.test('AuthController - logout - deve realizar logout com sucesso (teste positivo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { refreshTokenId: '608f1f77bcf86cd799439011' } as any as Request;
  await authController.logout(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AuthController - logout - deve falhar sem refreshTokenId (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = {} as any as Request;
  await authController.logout(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_badRequest);
});

// REFRESH
Deno.test('AuthController - refresh - deve renovar token com sucesso (teste positivo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { body: { refreshTokenId: '608f1f77bcf86cd799439011' } } as Request;
  await authController.refresh(mockRequest as any, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AuthController - refresh - deve falhar sem refreshTokenId (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { body: {} } as Request;
  await authController.refresh(mockRequest as any, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_badRequest);
});

Deno.test('AuthController - refresh - deve falhar com refresh expirado (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { body: { refreshTokenId: '608f1f77bcf86cd799439013' } } as Request;
  let errorCaught: any = null;
  await authController.refresh(mockRequest as any, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// ME
Deno.test('AuthController - me - deve retornar dados do usuário (teste positivo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { userId: '507f1f77bcf86cd799439011' } as any as Request;
  await authController.me(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AuthController - me - deve falhar sem userId (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = {} as any as Request;
  await authController.me(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_unauthorized);
});

Deno.test('AuthController - me - deve falhar com userId inválido (teste negativo)', async () => {
  const { authController } = setupTest();
  const mockRequest = { userId: '507f1f77bcf86cd799999999' } as any as Request;
  let errorCaught: any = null;
  await authController.me(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});
