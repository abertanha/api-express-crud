import { Router } from 'npm:express';
import { AccountController } from './AccountController.ts';
import { PaginationMiddle } from '../../middlewares/PaginationMiddle.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'
import { OwnershipMiddleware } from '../../middlewares/OwnershipMiddleware.ts'

const AccountRouter = Router();
const accountController = new AccountController();

/**
 * @openapi
 * /account:
 *   post:
 *     summary: Cria uma nova conta
 *     tags: [account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - accountType
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário proprietário da conta
 *               accountType:
 *                 type: string
 *                 enum: [checking, savings]
 *                 description: Tipo da conta
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 */
AccountRouter.post(
  '/',
  AuthMiddleware,
  accountController.create
);

/**
 * @openapi
 * /account:
 *   get:
 *     summary: Lista todas as contas
 *     tags: [account]
 *     parameters:
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
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir contas inativas
 *     responses:
 *       200:
 *         description: Lista de contas
 */
AccountRouter.get(
  '/',
  AuthMiddleware,
  PaginationMiddle({ pageDefault: 1, limitDefault: 10, maxLimit: 100 }),
  accountController.findAll
);

/**
 * @openapi
 * /account/user/{userId}:
 *   get:
 *     summary: Busca todas as contas de um usuário
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista de contas do usuário
 *       404:
 *         description: Usuário não encontrado
 */
AccountRouter.get(
  '/user/:userId',
  accountController.findByUserId
);

/**
 * @openapi
 * /account/user/{userId}/total-balance:
 *   get:
 *     summary: Busca o saldo total de todas as contas de um usuário
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Saldo total do usuário
 *       404:
 *         description: Usuário não encontrado
 */
AccountRouter.get(
  '/user/:userId/total-balance',
  accountController.getUserTotalBalance
);

/**
 * @openapi
 * /account/transfer:
 *   post:
 *     summary: Realiza uma transferência entre contas
 *     tags: [account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccountId
 *               - toAccountId
 *               - amount
 *             properties:
 *               fromAccountId:
 *                 type: string
 *                 description: ID da conta de origem
 *               toAccountId:
 *                 type: string
 *                 description: ID da conta de destino
 *               amount:
 *                 type: number
 *                 description: Valor a ser transferido
 *     responses:
 *       200:
 *         description: Transferência realizada com sucesso
 *       400:
 *         description: Dados inválidos ou saldo insuficiente
 *       404:
 *         description: Uma ou ambas as contas não foram encontradas
 */
AccountRouter.post(
  '/transfer',
  AuthMiddleware,
  OwnershipMiddleware.transferAccounts(),
  accountController.transfer
);

/**
 * @openapi
 * /account/{id}:
 *   get:
 *     summary: Busca uma conta por ID
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Conta encontrada
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.get(
  '/:id',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.findById
);

/**
 * @openapi
 * /account/{id}/balance:
 *   get:
 *     summary: Busca o saldo de uma conta
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Saldo da conta
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.get(
  '/:id/balance',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.getBalance
);

/**
 * @openapi
 * /account/{id}:
 *   put:
 *     summary: Atualiza os dados de uma conta
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [checking, savings]
 *                 description: Tipo da conta
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.put(
  '/:id',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.update
);

/**
 * @openapi
 * /account/{id}/deposit:
 *   post:
 *     summary: Realiza um depósito em uma conta
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Valor a ser depositado
 *     responses:
 *       200:
 *         description: Depósito realizado com sucesso
 *       400:
 *         description: Valor inválido
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.post(
  '/:id/deposit',
  accountController.deposit
);

/**
 * @openapi
 * /account/{id}/withdraw:
 *   post:
 *     summary: Realiza um saque de uma conta
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Valor a ser sacado
 *     responses:
 *       200:
 *         description: Saque realizado com sucesso
 *       400:
 *         description: Valor inválido ou saldo insuficiente
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.post(
  '/:id/withdraw',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.withdraw
);

/**
 * @openapi
 * /account/{id}/deactivate:
 *   patch:
 *     summary: Desativa uma conta
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Conta desativada com sucesso
 *       400:
 *         description: Conta possui saldo e não pode ser desativada
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.patch(
  '/:id/deactivate',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.deactivate
);

/**
 * @openapi
 * /account/{id}/reactivate:
 *   patch:
 *     summary: Reativa uma conta desativada
 *     tags: [account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Conta reativada com sucesso
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.patch(
  '/:id/reactivate',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.reactivate
);

export { AccountRouter };