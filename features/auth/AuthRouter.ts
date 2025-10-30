import { Router } from 'express'
import { AuthController } from './AuthController.ts'
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.ts'

const AuthRouter = Router()
const authController = new AuthController();

 /**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Realiza login
 *     tags: [auth]
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
  '/api/auth/login',
  authController.login
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Realiza logout
 *     tags: [auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
AuthRouter.post(
  '/api/auth/logout',
  AuthMiddleware,
  authController.logout
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Renova o access token
 *     tags: [auth]
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
  '/api/auth/refresh',
  authController.refresh
)

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Retorna dados do usuário logado
 *     tags: [auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
AuthRouter.get(
  '/api/auth/me',
  AuthMiddleware,
  authController.me
);

export { AuthRouter }