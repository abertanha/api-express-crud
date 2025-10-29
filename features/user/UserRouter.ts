import { Router } from 'npm:express';
import { UserController } from './UserController.ts';
import { PaginationMiddle } from '../../middlewares/PaginationMiddle.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'
import { OwnershipMiddleware } from '../../middlewares/OwnershipMiddleware.ts'

const UserRouter = Router();
const userController = new UserController();


/**
 * @openapi
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [User]
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
 *               password:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       201:
 *         description: Usuário criado
 */
UserRouter.post(
  '/',
  userController.create
);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Busca todos os usuários com paginação
 *     tags: [User]
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
 */
UserRouter.get(
  '/',
  AuthMiddleware,
  PaginationMiddle({ maxLimit: 10 }),
  userController.findAll
);

/**
 * @openapi
 * /user/{id}:
 *   get:
 *     summary: Busca usuário por ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.get(
  '/:id',
  AuthMiddleware,
  userController.findById
);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Atualiza usuário por ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.put(
  '/:id',
  AuthMiddleware,
  OwnershipMiddleware.user(),
  userController.update
);

/**
 * @openapi
 * /users/{id}/deactivate:
 *   deactive:
 *     summary: Soft_delete o usuário por ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Usuário removido
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.patch(
  '/:id/deactivate',
  AuthMiddleware,
  OwnershipMiddleware.user(),
  userController.deactivate
);

/**
 * @openapi
 * /users/{id}/reactivate:
 *   delete:
 *     summary: Retira o soft_delete do usuário por ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Usuário removido
 *       404:
 *         description: Usuário não encontrado
 */
UserRouter.patch(
  '/:id/reactivate',
  AuthMiddleware,
  OwnershipMiddleware.user(),
  userController.reactivate
);

export { UserRouter };