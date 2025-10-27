import { Env } from './config/Env.ts';
import { initializeBankingDB } from './database/db/bankingDB.ts';
import { Database } from './database/Database.ts';
import { ApiEnvironment } from './environments/ApiEnvironment.ts';


const server = async () => { 
  try {
    console.log('[Server] Initializing configuration...');
    console.log(`[Server] Environment set to env.${Env.name}`);

    console.log('[Server] Connecting to Database...');
    await initializeBankingDB();
    console.log('[Server] Database connection established.');

    
    const apiEnv = new ApiEnvironment();
    apiEnv.run();
    
    const shutdown = async () => {
      console.log('\n[Server] Graceful shutdown initiated...');
      await Database.closeAllConnections();
      console.log('[Server] Shutdown complete.');
      Deno.exit(0);
    }

    Deno.addSignalListener('SIGINT', shutdown);
    Deno.addSignalListener('SIGTERM', shutdown);

  } catch (error) {
    console.error('[Server] Failed to start server:');
    console.error(error);
    Deno.exit(1);
  }
};

await server();
