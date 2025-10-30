import { Responserror } from '../middlewares/ResponserrorMiddle.ts';
import express from 'npm:express';
import { AbstractEnvironment } from './AbstractEnvironments.ts';
import { Env } from '../config/Env.ts'
import { AccountRouter } from '../features/account/AccountRouter.ts'
import { TransactionRouter } from '../features/transaction/TransactionRouter.ts'
import { UserRouter } from '../features/user/UserRouter.ts'
import { AuthRouter } from '../features/auth/AuthRouter.ts'

export class ApiEnvironment extends AbstractEnvironment {
  constructor() {
    const port = Env.port;
    super(port);
  }

  public run = () => {
    const apiServer = express();

    this.initializeDefaultMiddlewares(apiServer);

    apiServer.get('/', (_req, res) => {
			res.send({
				status: 'OK',
				enviroment: Env.name,
				message: 'Servidor de produção rolando...'
			});
		});

    apiServer.use(AuthRouter);
    apiServer.use(UserRouter);
    apiServer.use(AccountRouter);
    apiServer.use(TransactionRouter);

    const responseError = new Responserror({ promptErrors: Env.local });
    apiServer.use(responseError.errorHandler);
    
    this.listen(apiServer);
  }
}