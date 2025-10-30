import { Router } from 'npm:express';
import { AccountController } from './AccountController.ts';
import { PaginationMiddle } from '../../middlewares/PaginationMiddle.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'
import { OwnershipMiddleware } from '../../middlewares/OwnershipMiddleware.ts'

const AccountRouter = Router();
const accountController = new AccountController();

/**
 * @openapi
 * /api/accounts:
 *   post:
 *     summary: Cria uma nova conta
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário proprietário da conta
 *               type:
 *                 type: string
 *                 enum: [corrente, poupança]
 *                 description: Tipo da conta
 *               balance:
 *                 type: number
 *                 description: Saldo inicial (opcional)
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Usuário não encontrado
 */
AccountRouter.post(
  '/api/accounts',
  AuthMiddleware,
  accountController.create
);

/**
 * @openapi
 * /api/accounts:
 *   get:
 *     summary: Lista todas as contas
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Não autenticado
 */
AccountRouter.get(
  '/api/accounts',
  AuthMiddleware,
  PaginationMiddle({ pageDefault: 1, limitDefault: 10, maxLimit: 100 }),
  accountController.findAll
);

/**
 * @openapi
 * /api/accounts/user/{userId}:
 *   get:
 *     summary: Busca todas as contas de um usuário
 *     tags: [account]
 *     security:              
 *       - bearerAuth: []     
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir contas inativas
 *     responses:
 *       200:
 *         description: Lista de contas do usuário
 *       401:                 
 *         description: Não autenticado
 *       403:                 
 *         description: Sem permissão
 *       404:
 *         description: Usuário não encontrado
 */
AccountRouter.get(
  '/api/accounts/user/:userId',
  AuthMiddleware,
  OwnershipMiddleware.user(),
  accountController.findByUserId
);

/**
 * @openapi
 * /api/accounts/user/{userId}/total-balance:
 *   get:
 *     summary: Busca o saldo total de todas as contas de um usuário
 *     tags: [account]
 *     security:        
 *       - bearerAuth: [] 
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
 *       401:            
 *         description: Não autenticado
 *       403:           
 *         description: Sem permissão
 *       404:
 *         description: Usuário não encontrado
 */
AccountRouter.get(
  '/api/accounts/user/:userId/total-balance',
  AuthMiddleware,
  OwnershipMiddleware.user(),
  accountController.getUserTotalBalance
);

/**
 * @openapi
 * /api/accounts/transfer:
 *   post:
 *     summary: Realiza uma transferência entre contas
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
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
 *               description:
 *                 type: string
 *                 description: Descrição da transferência (opcional)
 *     responses:
 *       200:
 *         description: Transferência realizada com sucesso
 *       400:
 *         description: Dados inválidos ou saldo insuficiente
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Uma ou ambas as contas não foram encontradas
 */
AccountRouter.post(
  '/api/accounts/transfer',
  AuthMiddleware,
  OwnershipMiddleware.transferAccounts(),
  accountController.transfer
);

/**
 * @openapi
 * /api/accounts/{id}:
 *   get:
 *     summary: Busca uma conta por ID
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.get(
  '/api/accounts/:id',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.findById
);

/**
 * @openapi
 * /api/accounts/{id}/balance:
 *   get:
 *     summary: Busca o saldo de uma conta
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.get(
  '/api/accounts/:id/balance',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.getBalance
);

/**
 * @openapi
 * /api/accounts/{id}:
 *   put:
 *     summary: Atualiza os dados de uma conta
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
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
 *               type:
 *                 type: string
 *                 enum: [corrente, poupança]
 *                 description: Tipo da conta
 *     responses:
 *       206:
 *         description: Conta atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.put(
  '/api/accounts/:id',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.update
);

/**
 * @openapi
 * /api/accounts/{id}/deposit:
 *   post:
 *     summary: Realiza um depósito em uma conta
 *     tags: [account]
 *     security:              
 *       - bearerAuth: []     
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
 *               description:
 *                 type: string
 *                 description: Descrição do depósito (opcional)
 *     responses:
 *       200:
 *         description: Depósito realizado com sucesso
 *       400:
 *         description: Valor inválido
 *       401:                 
 *         description: Não autenticado
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.post(
  '/api/accounts/:id/deposit',
  AuthMiddleware,
  accountController.deposit
);

/**
 * @openapi
 * /api/accounts/{id}/withdraw:
 *   post:
 *     summary: Realiza um saque de uma conta
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
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
 *               description:
 *                 type: string
 *                 description: Descrição do saque (opcional)
 *     responses:
 *       200:
 *         description: Saque realizado com sucesso
 *       400:
 *         description: Valor inválido ou saldo insuficiente
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.post(
  '/api/accounts/:id/withdraw',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.withdraw
);

/**
 * @openapi
 * /api/accounts/{id}/deactivate:
 *   patch:
 *     summary: Desativa uma conta
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da conta
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Forçar desativação mesmo com saldo
 *     responses:
 *       200:
 *         description: Conta desativada com sucesso
 *       400:
 *         description: Conta possui saldo e não pode ser desativada
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.patch(
  '/api/accounts/:id/deactivate',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.deactivate
);

/**
 * @openapi
 * /api/accounts/{id}/reactivate:
 *   patch:
 *     summary: Reativa uma conta desativada
 *     tags: [account]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Conta não encontrada
 */
AccountRouter.patch(
  '/api/accounts/:id/reactivate',
  AuthMiddleware,
  OwnershipMiddleware.account(),
  accountController.reactivate
);

export { AccountRouter };