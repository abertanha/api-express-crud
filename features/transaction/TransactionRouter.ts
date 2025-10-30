import { Router } from 'npm:express';
import { TransactionController } from './TransactionController.ts';
import { PaginationMiddle } from '../../middlewares/PaginationMiddle.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'
import { OwnershipMiddleware } from '../../middlewares/OwnershipMiddleware.ts'

const TransactionRouter = Router();
const transactionController = new TransactionController();

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     summary: Busca transação por ID
 *     tags: [transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da transação
 *     responses:
 *       200:
 *         description: Transação encontrada
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Transação não encontrada
 */
TransactionRouter.get(
  '/api/transactions/:id',
  AuthMiddleware,
  OwnershipMiddleware.transaction(),
  transactionController.findById
);

/**
 * @openapi
 * /api/transactions/account/{accountId}:
 *   get:
 *     summary: Busca todas as transações de uma conta
 *     tags: [transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Quantidade de registros por página
 *     responses:
 *       200:
 *         description: Lista de transações da conta
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
TransactionRouter.get(
  '/api/transactions/account/:accountId',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  transactionController.findByAccountId
);

/**
 * @openapi
 * /api/transactions/account/{accountId}/type:
 *   get:
 *     summary: Busca transações de uma conta filtradas por tipo
 *     tags: [transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdraw, transfer_in, transfer_out]
 *         required: true
 *         description: Tipo de transação
 *     responses:
 *       200:
 *         description: Lista de transações filtradas por tipo
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
TransactionRouter.get(
  '/api/transactions/account/:accountId/type',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  transactionController.findByAccountAndType
);

/**
 * @openapi
 * /api/transactions/transfers/{accountId1}/{accountId2}:
 *   get:
 *     summary: Busca transferências entre duas contas
 *     tags: [transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId1
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da primeira conta
 *       - in: path
 *         name: accountId2
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da segunda conta
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de registros por página
 *     responses:
 *       200:
 *         description: Lista de transferências entre as contas
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Uma ou ambas as contas não foram encontradas
 */
TransactionRouter.get(
  '/api/transactions/transfers/:accountId1/:accountId2',
  AuthMiddleware,
  PaginationMiddle({ pageDefault: 1, limitDefault: 10, maxLimit: 100 }),
  transactionController.findBetweenAccounts
);

/**
 * @openapi
 * /api/transactions/account/{accountId}/stats:
 *   get:
 *     summary: Busca estatísticas de transações de uma conta
 *     tags: [transaction]
 *     security:        
 *       - bearerAuth: [] 
 *     parameters:
 *       - in: path
 *         name: accountId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Estatísticas da conta (total de depósitos, saques, transferências, etc.)
 *       401:            
 *         description: Não autenticado  
 *       403:            
 *         description: Sem permissão    
 *       404:
 *         description: Conta não encontrada
 */
TransactionRouter.get(
  '/api/transactions/account/:accountId/stats',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  transactionController.findAccountStats
);

export { TransactionRouter };