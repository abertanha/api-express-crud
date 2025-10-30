import { Router } from 'npm:express';
import { Swagger } from '../docs/Swagger.ts'

const DocsRouter = Router();

const bankingApi = new Swagger({
  title: 'Banking API',
  version: '0.0.1',
  routerPaths: [
    './features/user/UserRouter.ts',
    './features/auth/AuthRouter.ts',
    './features/account/AccountRouter.ts',
    './features/transaction/TransactionRouter.ts',
  ],
  contact: {
    name: 'Suporte',
    email: 'suporte@banco.com',
    url: 'https://banco.com/suporte'
  },
  routerDescription: 'api de avaliação da trilha back-end AGX'
})

DocsRouter.use(
  '/docs/api/banking-api',
  bankingApi.setupAndServe(),
)

export { DocsRouter }