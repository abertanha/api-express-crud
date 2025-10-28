import { Router } from 'npm:express';
import { Swagger } from '../docs/Swagger.ts'

const DocsRouter = Router();

const bankingApi = new Swagger({
  title: 'Banking API',
  version: '0.0.1',
  routerPaths: [
    './features/user/UserRouter.ts',
    //'./features/api/auth/AuthRouter.ts',
    './features/account/AccountRouter',
    './features/transaction/TransactionRouter.ts',
    './config/Swagger.ts',
  ],
})

DocsRouter.use(
  '/docs/api/banking-api',
  bankingApi.setupAndServe(),
)

export { DocsRouter }