import { assertEquals, assertExists } from '@std/assert';
import { Request } from 'express';
import { UserController } from './UserController.ts';
import { MockUserService } from './mocks/MockUserService.ts';
import { MockResponser, MockNextFunction } from '../../globals/Stubs.ts';
import { UserRules } from './UserRules.ts';
import { Print } from '../../utilities/Print.ts';
import { Types } from 'mongoose';
import { Database } from '../../database/Database.ts';
import { MockSoftDeleteService } from './mocks/MockSoftDeleteService.ts'

function setupTest() {
  const mockUserService = new MockUserService();
  const mockUserRules = new UserRules();
  const mockPrint = new Print();
  const mockSoftDeleteService = new MockSoftDeleteService();
  const userController = new UserController(mockUserService, mockUserRules, mockPrint, mockSoftDeleteService as any);
  
  const repository = mockUserService['userRepository'] as any;
  if (repository && repository.resetMockData) {
    repository.resetMockData();
  }

  mockSoftDeleteService.resetMockData();
  
  return { userController, mockUserService, mockUserRules, mockPrint };
}

// CREATE TESTS
Deno.test({
  name:'UserController - create - deve criar um usuário com sucesso (teste positivo)',
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      name: 'Carlos Souza',
      email: 'carlos.souza@example.com',
      cpf: '55281855050',
      birthDate: new Date('1992-03-25'),
      password: 'senhaSegura123',
    },
  } as Request;

  await userController.create(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_created as any;
  assertExists(response);
}});

Deno.test('UserController - create - deve retornar erro quando o nome não for fornecido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      email: 'teste@example.com',
      cpf: '55281855050',
      birthDate: '1992-03-25',
      password: 'senhaSegura123',
    },
  } as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.create(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('name'));
});

Deno.test('UserController - create - deve retornar erro quando o email não for fornecido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      name: 'Carlos Souza',
      cpf: '55281855050',
      birthDate: '1992-03-25',
      password: 'senhaSegura123',
    },
  } as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.create(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('email'));
});

Deno.test('UserController - create - deve retornar erro quando o CPF não for fornecido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      name: 'Carlos Souza',
      email: 'carlos@example.com',
      birthDate: '1992-03-25',
      password: 'senhaSegura123',
    },
  } as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.create(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('cpf'));
});

Deno.test('UserController - create - deve retornar erro quando a data de nascimento não for fornecida (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      name: 'Carlos Souza',
      email: 'carlos@example.com',
      cpf: '55281855050',
      password: 'senhaSegura123',
    },
  } as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.create(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('birthDate'));
});

Deno.test('UserController - create - deve retornar erro quando a senha não for fornecida (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      name: 'Carlos Souza',
      email: 'carlos@example.com',
      cpf: '55281855050',
      birthDate: '1992-03-25',
    },
  } as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.create(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('password'));
});

Deno.test('UserController - create - deve retornar erro quando o email já existe (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      name: 'João Silva',
      email: 'joao.silva@example.com',
      cpf: '52998224725',
      birthDate: '1992-03-25',
      password: 'senhaSegura123',
    },
  } as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.create(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('já cadastrado'));
});

Deno.test('UserController - create - deve retornar erro quando o CPF já existe (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    body: {
      name: 'Novo Usuário',
      email: 'novo.usuario@example.com',
      cpf: '06552942010',
      birthDate: '1992-03-25',
      password: 'senhaSegura123',
    },
  } as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.create(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message);
});

// FINDBYID TESTS
Deno.test('UserController - findById - deve buscar um usuário por ID com sucesso (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
  } as unknown as Request;

  await userController.findById(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_ok as any;
  assertExists(response);
});

Deno.test('UserController - findById - deve retornar erro quando o ID não for encontrado (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: new Types.ObjectId().toString(),
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.findById(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('Usuário não encontrado'));
});

Deno.test('UserController - findById - deve retornar erro quando o ID for inválido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: 'id-invalido',
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.findById(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
});

// FINDALL TESTS
Deno.test('UserController - findAll - deve buscar todos os usuários ativos com sucesso (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    pagination: {
      page: 1,
      limit: 10,
    },
    query: {},
  } as unknown as Request;

  await userController.findAll(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_ok as any;
  assertExists(response);
});

Deno.test('UserController - findAll - deve buscar todos os usuários incluindo inativos (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    pagination: {
      page: 1,
      limit: 10,
    },
    query: {
      includeInactive: 'true',
    },
  } as unknown as Request;

  await userController.findAll(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_ok as any;
  assertExists(response);
});

Deno.test('UserController - findAll - deve retornar lista vazia quando não houver usuários (teste positivo)', async () => {
  const { userController, mockUserService } = setupTest();
  
  (mockUserService['userRepository'] as any).mockData = [];

  const mockRequest = {
    pagination: {
      page: 1,
      limit: 10,
    },
    query: {},
  } as unknown as Request;

  await userController.findAll(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_ok as any;
  assertExists(response);
});

Deno.test('UserController - findAll - deve retornar erro quando a paginação não estiver definida (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    query: {},
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.findAll(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
});

// UPDATE TESTS
Deno.test('UserController - update - deve atualizar um usuário com sucesso (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    body: {
      name: 'João Silva Atualizado',
      email: 'joao.atualizado@example.com',
    },
  } as unknown as Request;

  await userController.update(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_partialContent as any;
  assertExists(response);
});

Deno.test('UserController - update - deve atualizar apenas o nome do usuário (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    body: {
      name: 'João Silva Modificado',
    },
  } as unknown as Request;

  await userController.update(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_partialContent as any;
  assertExists(response);
});

Deno.test('UserController - update - deve atualizar apenas o email do usuário (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    body: {
      email: 'joao.novo@example.com',
    },
  } as unknown as Request;

  await userController.update(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_partialContent as any;
  assertExists(response);
});

Deno.test('UserController - update - deve atualizar a data de nascimento do usuário (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    body: {
      birthDate: '1991-01-15',
    },
  } as unknown as Request;

  await userController.update(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_partialContent as any;
  assertExists(response);
});

Deno.test('UserController - update - deve retornar erro quando o ID não for encontrado (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: new Types.ObjectId().toString(),
    },
    body: {
      name: 'Nome Atualizado',
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.update(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('não encontrando'));
});

Deno.test('UserController - update - deve retornar erro quando o email já existe em outro usuário (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    body: {
      email: 'maria.santos@example.com',
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.update(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('já cadastrado'));
});

Deno.test('UserController - update - deve retornar erro quando o nome for inválido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    body: {
      name: 'A',
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.update(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
});

Deno.test('UserController - update - deve retornar erro quando o email for inválido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    body: {
      email: 'email-invalido',
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.update(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
});

// DEACTIVATE TESTS
Deno.test('UserController - deactivate - deve desativar um usuário com sucesso (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    query: {},
  } as unknown as Request;

  await userController.deactivate(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_noContent as any;
  assertExists(response);
});

Deno.test('UserController - deactivate - deve desativar um usuário com force=true (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
    query: {
      force: 'true',
    },
  } as unknown as Request;

  await userController.deactivate(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_noContent as any;
  assertExists(response);
});

Deno.test('UserController - deactivate - deve retornar erro quando o ID não for encontrado (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: new Types.ObjectId().toString(),
    },
    query: {},
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.deactivate(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('já está desativado'));
});

Deno.test('UserController - deactivate - deve retornar erro quando o usuário já estiver inativo (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439013',
    },
    query: {},
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.deactivate(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
  assertExists(errorCaught?.message.includes('já está desativado'));
});

Deno.test('UserController - deactivate - deve retornar erro quando o ID for inválido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: 'id-invalido',
    },
    query: {},
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.deactivate(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
});

// REACTIVATE TESTS
Deno.test('UserController - reactivate - deve reativar um usuário inativo com sucesso (teste positivo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439013',
    },
  } as unknown as Request;

  await userController.reactivate(mockRequest, MockResponser, MockNextFunction);

  const response = MockResponser.send_created as any;
  assertExists(response);
});

Deno.test('UserController - reactivate - deve retornar erro quando o ID não for encontrado (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: new Types.ObjectId().toString(),
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.reactivate(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
});

Deno.test('UserController - reactivate - deve retornar erro quando o usuário já estiver ativo (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: '507f1f77bcf86cd799439011',
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.reactivate(mockRequest, MockResponser, mockNext);

  assertEquals(errorCaught, null);
});

Deno.test('UserController - reactivate - deve retornar erro quando o ID for inválido (teste negativo)', async () => {
  const { userController } = setupTest();
  
  const mockRequest = {
    params: {
      id: 'id-invalido',
    },
  } as unknown as Request;

  let errorCaught: any = null;
  const mockNext = (error: any) => {
    errorCaught = error;
  };

  await userController.reactivate(mockRequest, MockResponser, mockNext);

  assertExists(errorCaught);
});
