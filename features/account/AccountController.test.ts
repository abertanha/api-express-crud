import { assertExists } from '@std/assert';
import { Request } from 'express';
import { AccountController } from './AccountController.ts';
import { MockAccountService } from './mocks/MockAccountService.ts';
import { MockResponser, MockNextFunction } from '../../globals/Stubs.ts';
import { AccountRules } from './AccountRules.ts';
import { Print } from '../../utilities/Print.ts';
import { Database } from '../../database/Database.ts';

function setupTest() {
  const mockAccountService = new MockAccountService();
  const mockAccountRules = new AccountRules();
  const mockPrint = new Print();
  const accountController = new AccountController(mockAccountService, mockAccountRules, mockPrint);
  
  const repository = mockAccountService['accountRepository'] as any;
  if (repository && repository.resetMockData) {
    repository.resetMockData();
  }
  
  return { accountController };
}

// Registra cleanup global para fechar conexões após todos os testes
let cleanupRegistered = false;
if (!cleanupRegistered) {
  cleanupRegistered = true;
  globalThis.addEventListener("unload", async () => {
    await Database.closeAllConnections();
  });
}

// CREATE
Deno.test(
  {name:'AccountController - create - deve criar conta com sucesso (teste positivo)',
  sanitizeOps: false,
  sanitizeResources: false,
  fn:async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { userId: '507f1f77bcf86cd799439011', type: 'corrente', balance: 100.00 } } as Request;
  await accountController.create(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_created);
}});

Deno.test('AccountController - create - deve falhar sem userId (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { type: 'corrente' } } as Request;
  let errorCaught: any = null;
  await accountController.create(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - create - deve falhar sem type (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { userId: '507f1f77bcf86cd799439011' } } as Request;
  let errorCaught: any = null;
  await accountController.create(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - create - deve falhar com tipo inválido (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { userId: '507f1f77bcf86cd799439011', type: 'investimento' } } as Request;
  let errorCaught: any = null;
  await accountController.create(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - create - deve falhar com saldo negativo (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { userId: '507f1f77bcf86cd799439011', type: 'corrente', balance: -100 } } as Request;
  let errorCaught: any = null;
  await accountController.create(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// FINDBYID
Deno.test('AccountController - findById - deve buscar conta por ID (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' } } as any as Request;
  await accountController.findById(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AccountController - findById - deve falhar com conta não encontrada (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799999999' } } as any as Request;
  let errorCaught: any = null;
  await accountController.findById(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// FINDALL
Deno.test('AccountController - findAll - deve listar contas (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { query: {}, pagination: { page: 1, limit: 10 } } as any as Request;
  await accountController.findAll(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

// FINDBYUSERID
Deno.test('AccountController - findByUserId - deve buscar contas do usuário (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { userId: '507f1f77bcf86cd799439011' }, query: {} } as any as Request;
  await accountController.findByUserId(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

// UPDATE
Deno.test('AccountController - update - deve atualizar tipo da conta (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, body: { type: 'poupança' } } as any as Request;
  await accountController.update(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_partialContent);
});

Deno.test('AccountController - update - deve falhar com conta não encontrada (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799999999' }, body: { type: 'poupança' } } as any as Request;
  let errorCaught: any = null;
  await accountController.update(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - update - deve falhar com tipo inválido (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, body: { type: 'investimento' } } as any as Request;
  let errorCaught: any = null;
  await accountController.update(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// DEPOSIT
Deno.test('AccountController - deposit - deve realizar depósito (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, body: { amount: 500.00 } } as any as Request;
  await accountController.deposit(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AccountController - deposit - deve falhar sem amount (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, body: {} } as any as Request;
  let errorCaught: any = null;
  await accountController.deposit(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - deposit - deve falhar com amount zero (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, body: { amount: 0 } } as any as Request;
  let errorCaught: any = null;
  await accountController.deposit(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - deposit - deve falhar em conta desativada (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439023' }, body: { amount: 100.00 } } as any as Request;
  let errorCaught: any = null;
  await accountController.deposit(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// WITHDRAW
Deno.test('AccountController - withdraw - deve realizar saque (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439022' }, body: { amount: 500.00 } } as any as Request;
  await accountController.withdraw(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AccountController - withdraw - deve falhar com saldo insuficiente (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, body: { amount: 10000.00 } } as any as Request;
  let errorCaught: any = null;
  await accountController.withdraw(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - withdraw - deve falhar em conta desativada (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439023' }, body: { amount: 50.00 } } as any as Request;
  let errorCaught: any = null;
  await accountController.withdraw(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// TRANSFER
Deno.test('AccountController - transfer - deve realizar transferência (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { fromAccountId: '607f1f77bcf86cd799439022', toAccountId: '607f1f77bcf86cd799439021', amount: 200.00 } } as Request;
  await accountController.transfer(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AccountController - transfer - deve falhar sem fromAccountId (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { toAccountId: '607f1f77bcf86cd799439021', amount: 100.00 } } as Request;
  let errorCaught: any = null;
  await accountController.transfer(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - transfer - deve falhar com saldo insuficiente (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { fromAccountId: '607f1f77bcf86cd799439021', toAccountId: '607f1f77bcf86cd799439022', amount: 50000.00 } } as Request;
  let errorCaught: any = null;
  await accountController.transfer(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

Deno.test('AccountController - transfer - deve falhar transferindo para mesma conta (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { body: { fromAccountId: '607f1f77bcf86cd799439021', toAccountId: '607f1f77bcf86cd799439021', amount: 100.00 } } as Request;
  let errorCaught: any = null;
  await accountController.transfer(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// GETBALANCE
Deno.test('AccountController - getBalance - deve consultar saldo (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' } } as any as Request;
  await accountController.getBalance(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AccountController - getBalance - deve falhar com conta não encontrada (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799999999' } } as any as Request;
  let errorCaught: any = null;
  await accountController.getBalance(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// GETUSERTOTALBALANCE
Deno.test('AccountController - getUserTotalBalance - deve consultar saldo total do usuário (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { userId: '507f1f77bcf86cd799439011' } } as any as Request;
  await accountController.getUserTotalBalance(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_ok);
});

Deno.test('AccountController - getUserTotalBalance - deve falhar com usuário não encontrado (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { userId: '507f1f77bcf86cd799999999' } } as any as Request;
  let errorCaught: any = null;
  await accountController.getUserTotalBalance(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// DEACTIVATE
Deno.test('AccountController - deactivate - deve desativar conta com saldo zero (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439023' }, query: {} } as any as Request;
  await accountController.deactivate(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_noContent);
});

Deno.test('AccountController - deactivate - deve desativar conta com force (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, query: { force: 'true' } } as any as Request;
  await accountController.deactivate(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_noContent);
});

Deno.test('AccountController - deactivate - deve falhar com saldo sem force (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' }, query: {} } as any as Request;
  let errorCaught: any = null;
  await accountController.deactivate(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});

// REACTIVATE
Deno.test('AccountController - reactivate - deve reativar conta (teste positivo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439023' } } as any as Request;
  await accountController.reactivate(mockRequest, MockResponser, MockNextFunction);
  assertExists(MockResponser.send_created);
});

Deno.test('AccountController - reactivate - deve falhar reativando conta já ativa (teste negativo)', async () => {
  const { accountController } = setupTest();
  const mockRequest = { params: { id: '607f1f77bcf86cd799439021' } } as any as Request;
  let errorCaught: any = null;
  await accountController.reactivate(mockRequest, MockResponser, (error: any) => { errorCaught = error; });
  assertExists(errorCaught);
});
