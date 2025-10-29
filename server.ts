import { Env } from './config/Env.ts';
import { initializeBankingDB } from './database/db/bankingDB.ts';
import { Database } from './database/Database.ts';
import { ApiEnvironment } from './environments/ApiEnvironment.ts';
import { DevelopmentEnvironment } from './environments/DevelopmentEnvironment.ts'
import { Print } from './utilities/Print.ts'
import { initializeModels } from './database/initializeModels.ts'

const server = async () => { 
  const print = new Print();

  try {
    print.sucess('Initializing configuration...');
    print.info(`Environment set to env.${Env.name}`);
    print.info(`Is Devlopment: ${Env.isDevLike}`);
    print.info(`Is Production: ${Env.isProductionLike}`);

    print.info('Connecting to Database...');
    await initializeBankingDB();

    print.info('[Server] 📦 Registering models...')
    initializeModels()
    
    print.sucess('Database connection established.');

    
    if (Env.isProductionLike) {
      print.info('Starting production environment...');
      const apiEnv = new ApiEnvironment();
      apiEnv.run();
      
    } else if (Env.isDevLike) {
      print.info('Starting development environment...');
      const devEnv = new DevelopmentEnvironment();
      devEnv.run();
    }
    
    const shutdown = async () => {
      print.info('\nGraceful shutdown initiated...');
      await Database.closeAllConnections();
      print.sucess('Shutdown complete.');
      Deno.exit(0);
    }

    Deno.addSignalListener('SIGINT', shutdown);
    Deno.addSignalListener('SIGTERM', shutdown);

  } catch (error) {
    print.error('Failed to start server:');
    print.error(error as unknown as string);
    Deno.exit(1);
  }
};

await server();
