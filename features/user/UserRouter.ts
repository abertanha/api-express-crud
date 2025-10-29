import { Router } from 'npm:express';
import { UserController } from './UserController.ts';
import { PaginationMiddle } from '../../middlewares/PaginationMiddle.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'

const UserRouter = Router();
const getUserController = () => new UserController();


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
  (req, res, next) => getUserController()
  .create(req, res, next)
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
  (req, res, next) => getUserController()
  .findAll(req, res, next)
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
  (req, res, next) => getUserController()
  .findById(req, res, next)
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
  (req, res, next) => getUserController()
  .update(req, res, next)
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
  (req, res, next) => getUserController()
  .deactivate(req, res, next)
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
  (req, res, next) => getUserController()
  .reactivate(req, res, next)
);

export { UserRouter };