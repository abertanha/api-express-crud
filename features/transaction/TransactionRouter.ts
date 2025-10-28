import { Router } from 'npm:express';
import { TransactionController } from './TransactionController.ts';
import { PaginationMiddle } from '../../middlewares/PaginationMiddle.ts'

const TransactionRouter = Router();
const getTransactionController = () => new TransactionController();

/**
 * @openapi
 * /transaction/{id}:
 *   get:
 *     summary: Busca transação por ID
 *     tags: [transaction]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Transação encontrada
 *       404:
 *         description: Transação não encontrado
 */
TransactionRouter.get('/:id',
  (req, res, next) => getTransactionController()
  .findById(req, res, next)
);

/**
 * @openapi
 * /transaction/account/{accountId}:
 *   get:
 *     summary: Busca todas as transações de uma conta
 *     tags: [transaction]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Lista de transações da conta
 *       404:
 *         description: Conta não encontrada
 */
TransactionRouter.get('/account/:accountId',
  (req, res, next) => getTransactionController()
  .findByAccountId(req, res, next)
);

/**
 * @openapi
 * /transaction/account/{accountId}/type:
 *   get:
 *     summary: Busca transações de uma conta filtradas por tipo
 *     tags: [transaction]
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
 *           enum: [deposit, withdraw, transfer]
 *         required: true
 *         description: Tipo de transação
 *     responses:
 *       200:
 *         description: Lista de transações filtradas por tipo
 *       404:
 *         description: Conta não encontrada
 */
TransactionRouter.get(
  '/account/:accountId/type',
  (req, res, next) => getTransactionController()
  .findByType(req, res, next)
);

/**
 * @openapi
 * /transaction/transfers/{accountId1}/{accountId2}:
 *   get:
 *     summary: Busca transferências entre duas contas
 *     tags: [transaction]
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
 *     responses:
 *       200:
 *         description: Lista de transferências entre as contas
 *       404:
 *         description: Uma ou ambas as contas não foram encontradas
 */
TransactionRouter.get(
  '/transfers/:accountId1/:accountId2',
  PaginationMiddle({ pageDefault: 1, limitDefault: 10, maxLimit: 100 }),
  (req, res, next) => getTransactionController()
  .findTransfersBetweenAccounts(req, res, next)
);

/**
 * @openapi
 * /transaction/account/{accountId}/stats:
 *   get:
 *     summary: Busca estatísticas de transações de uma conta
 *     tags: [transaction]
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
 *       404:
 *         description: Conta não encontrada
 */
TransactionRouter.get(
  '/account/:accountId/stats',
  (req, res, next) => getTransactionController()
  .findAccountStats(req, res, next)
);

export { TransactionRouter };