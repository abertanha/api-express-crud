import { Responserror } from '../middlewares/ResponserrorMiddle.ts';
import express from 'npm:express';
import { AbstractEnvironment } from './AbstractEnvironments.ts';
import { Env } from '../config/Env.ts'
import { AccountRouter } from '../routes/AccountRouter.ts'
import { TransactionRouter } from '../routes/TransactionRouter.ts'
import { UserRouter } from '../routes/UserRouter.ts'

export class ApiEnvironment extends AbstractEnvironment {
  constructor() {
    const port = Env.port;
    super(port);
  }

  public run = () => {
    const apiServer = express();

    this.initializeDefaultMiddlewares(apiServer);

    apiServer.get('/', (_req, res) => {
      res.send('API está rolando...');
    });
    // TODO
    // apiServer.use(DocsRouter);
    // apiServer.use(APIRouter);
    // apiServer.use(AuthRouter);
    apiServer.use('/api/users', UserRouter);
    apiServer.use('/api/accounts', AccountRouter);
    apiServer.use('/api/transactions', TransactionRouter);

    const responseError = new Responserror({ promptErrors: Env.local });
    apiServer.use(responseError.errorHandler);
    
    this.listen(apiServer);
  }
}