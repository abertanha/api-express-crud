import { TransactionController } from "./TransactionController.ts";
import { MockTransactionService } from "./mocks/MockTransactionService.ts";
import { TransactionRules } from "./TransactionRules.ts";
import { Print } from "../../utilities/Print.ts";
import { MockResponser, MockNextFunction } from "../../globals/Stubs.ts";
import { assertExists } from "@std/assert";
import { Database } from "../../database/Database.ts";

function setupTest() {
  const mockTransactionService = new MockTransactionService();
  const mockTransactionRules = new TransactionRules();
  const mockPrint = new Print();
  const transactionController = new TransactionController(
    mockTransactionService,
    mockTransactionRules,
    mockPrint
  );

  mockTransactionService.shouldThrowError = false;

  return { transactionController, mockTransactionService, mockTransactionRules, mockPrint };
}

// ===== FIND BY ID =====
Deno.test({
  name: "TransactionController - findById - sucesso",
  sanitizeOps: false,
  sanitizeResources: false,
  fn:async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { id: "607f1f4f5f1b2c0012345678" }
  } as any;

  await transactionController.findById(req, MockResponser as any, MockNextFunction);

  assertExists(MockResponser.send_ok);
}});

Deno.test({
  name: "TransactionController - findById - ID inválido",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const { transactionController } = setupTest();
    
    const req = {
      params: { id: "invalid-id" }
    } as any;

    let errorCaught: any = null;
    await transactionController.findById(req, MockResponser as any, (error: any) => {
      errorCaught = error;
    });

    assertExists(errorCaught);
  }
});

Deno.test("TransactionController - findById - ID vazio", async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { id: "" }
  } as any;

  let errorCaught: any = null;
  await transactionController.findById(req, MockResponser as any, (error: any) => {
    errorCaught = error;
  });

  assertExists(errorCaught);
});

Deno.test("TransactionController - findById - transação não encontrada", async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { id: "507f1f77bcf86cd799439999" }
  } as any;

  await transactionController.findById(req, MockResponser as any, MockNextFunction);

  assertExists(MockResponser.send_ok);
});

// ===== FIND BY ACCOUNT ID =====
Deno.test({
  name: "TransactionController - findByAccountId - sucesso",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { accountId: "607f191e5f1b2c9234567021" },
    query: { page: "1", limit: "10" }
  } as any;

  await transactionController.findByAccountId(req, MockResponser as any, MockNextFunction);

  assertExists(MockResponser.send_ok);
  }
});

Deno.test({
  name: "TransactionController - findByAccountId - sem query params usa defaults",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const { transactionController } = setupTest();
    
    const req = {
      params: { accountId: "607f191e5f1b2c9234567021" },
      query: {}
    } as any;

    await transactionController.findByAccountId(req, MockResponser as any, MockNextFunction);

    assertExists(MockResponser.send_ok);
  }
});

Deno.test("TransactionController - findByAccountId - erro no service", async () => {
  const { transactionController, mockTransactionService } = setupTest();
  
  mockTransactionService.shouldThrowError = true;
  
  const req = {
    params: { accountId: "607f191e5f1b2c9234567021" },
    query: { page: "1", limit: "10" }
  } as any;

  let errorCaught: any = null;
  await transactionController.findByAccountId(req, MockResponser as any, (error: any) => {
    errorCaught = error;
  });

  assertExists(errorCaught);
});

// ===== FIND BY ACCOUNT AND TYPE =====
Deno.test("TransactionController - findByAccountAndType - sucesso", async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { accountId: "607f191e5f1b2c9234567021" },
    query: { type: "deposit" }
  } as any;

  await transactionController.findByAccountAndType(req, MockResponser as any, MockNextFunction);

  assertExists(MockResponser.send_ok);
});

Deno.test("TransactionController - findByAccountAndType - todos os tipos válidos", async () => {
  const { transactionController } = setupTest();
  
  const types = ["deposit", "withdraw", "transfer_out", "transfer_in", "initial_balance"];
  
  for (const type of types) {
    const req = {
      params: { accountId: "607f191e5f1b2c9234567021" },
      query: { type }
    } as any;

    await transactionController.findByAccountAndType(req, MockResponser as any, MockNextFunction);
    assertExists(MockResponser.send_ok);
  }
});

Deno.test("TransactionController - findByAccountAndType - erro no service", async () => {
  const { transactionController, mockTransactionService } = setupTest();
  
  mockTransactionService.shouldThrowError = true;
  
  const req = {
    params: { accountId: "607f191e5f1b2c9234567021" },
    query: { type: "deposit" }
  } as any;

  let errorCaught: any = null;
  await transactionController.findByAccountAndType(req, MockResponser as any, (error: any) => {
    errorCaught = error;
  });

  assertExists(errorCaught);
});

// ===== FIND BETWEEN ACCOUNTS =====
Deno.test("TransactionController - findBetweenAccounts - sucesso", async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { 
      accountId1: "607f191e5f1b2c9234567021",
      accountId2: "607f191e5f1b2c9234567022"
    }
  } as any;

  await transactionController.findBetweenAccounts(req, MockResponser as any, MockNextFunction);

  assertExists(MockResponser.send_ok);
});

Deno.test("TransactionController - findBetweenAccounts - erro no service", async () => {
  const { transactionController, mockTransactionService } = setupTest();
  
  mockTransactionService.shouldThrowError = true;
  
  const req = {
    params: { 
      accountId1: "607f191e5f1b2c9234567021",
      accountId2: "607f191e5f1b2c9234567022"
    }
  } as any;

  let errorCaught: any = null;
  await transactionController.findBetweenAccounts(req, MockResponser as any, (error: any) => {
    errorCaught = error;
  });

  assertExists(errorCaught);
});

// ===== FIND ACCOUNT STATS =====
Deno.test("TransactionController - findAccountStats - sucesso", async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { accountId: "607f191e5f1b2c9234567021" }
  } as any;

  await transactionController.findAccountStats(req, MockResponser as any, MockNextFunction);

  assertExists(MockResponser.send_ok);
});

Deno.test("TransactionController - findAccountStats - conta sem transações", async () => {
  const { transactionController } = setupTest();
  
  const req = {
    params: { accountId: "507f1f77bcf86cd799439999" }
  } as any;

  await transactionController.findAccountStats(req, MockResponser as any, MockNextFunction);

  assertExists(MockResponser.send_ok);
});

Deno.test("TransactionController - findAccountStats - erro no service", async () => {
  const { transactionController, mockTransactionService } = setupTest();
  
  mockTransactionService.shouldThrowError = true;
  
  const req = {
    params: { accountId: "607f191e5f1b2c9234567021" },
    account: { _id: "607f191e5f1b2c9234567021" }  // Adiciona account para evitar validação extra
  } as any;

  let errorCaught: any = null;
  await transactionController.findAccountStats(req, MockResponser as any, (error: any) => {
    errorCaught = error;
  });

  assertExists(errorCaught);
});