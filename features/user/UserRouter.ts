import { Router } from 'npm:express';
import { UserController } from './UserController.ts';
import { PaginationMiddle } from '../../middlewares/PaginationMiddle.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'
import { OwnershipMiddleware } from '../../middlewares/OwnershipMiddleware.ts'

const UserRouter = Router();
const userController = new UserController();


/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - cpf
 *               - birthDate
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               cpf:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Usuário criado
 */
UserRouter.post(
  '/api/users',
  userController.create
);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Busca todos os usuários com paginação
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Número da página (default = 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         required: false
 *         description: Quantidade de usuários por página (default = 10)
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 */
UserRouter.get(
  '/api/users',
  AuthMiddleware,
  PaginationMiddle({ maxLimit: 10 }),
  userController.findAll
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Busca usuário por ID
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.get(
  '/api/users/:id',
  AuthMiddleware,
  userController.findById
);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza usuário por ID
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       206:
 *         description: Usuário atualizado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.put(
  '/api/users/:id',
  AuthMiddleware,
  OwnershipMiddleware.user(),
  userController.update
);

/**
 * @openapi
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Desativa o usuário por ID
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Forçar desativação mesmo com saldo
 *     responses:
 *       200:
 *         description: Usuário desativado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.patch(
  '/api/users/:id/deactivate',
  AuthMiddleware,
  OwnershipMiddleware.user(),
  userController.deactivate
);

/**
 * @openapi
 * /api/users/{id}/reactivate:
 *   patch:
 *     summary: Reativa o usuário por ID
 *     tags: [user]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário reativado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.patch(
  '/api/users/:id/reactivate',
  // AuthMiddleware,
  // OwnershipMiddleware.user(),
  userController.reactivate
);

export { UserRouter };