import { Router } from 'express'
import { AuthController } from './AuthController.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'

const AuthRouter = Router()
const getAuthController = () => new AuthController();

 /**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Realiza login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
AuthRouter.post(
  '/login',
  (req, res, next) => getAuthController()
  .login(req, res, next)
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Realiza logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
AuthRouter.post(
  '/logout',
  AuthMiddleware,
  (req, res, next) => getAuthController()
  .logout(req, res, next)
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Renova o access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshTokenId
 *             properties:
 *               refreshTokenId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado
 */
AuthRouter.post(
  '/refresh',
  (req, res, next) => getAuthController()
  .refresh(req, res, next)
)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retorna dados do usuário logado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
AuthRouter.get(
  '/me',
  AuthMiddleware,
  (req, res, next) => getAuthController()
  .me(req, res, next)
);

export { AuthRouter }