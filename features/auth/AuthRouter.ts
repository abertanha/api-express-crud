import { Router } from 'express'
import { AuthController } from './AuthController.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'

const AuthRouter = Router()
const authController = new AuthController();

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
  authController.login
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
  authController.logout
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
  authController.refresh
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
  authController.me
);

export { AuthRouter }