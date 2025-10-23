import express from 'express';
import morgan from 'morgan';
import { Env } from './config/Env.ts';
import { Database } from './database/Database.ts';


const server = async () => { 
  try {
    console.log('[Server] Initializing configuration...');
    console.log(`[Server] Environment set to env.${Env.name}`);

    console.log('[Server] Connecting to Database...');
    await Database.initialize();
    console.log('[Server] Database connection established.');

    const app = express();
    app.use(express.json());
    app.use(morgan('dev'));
    

    app.get('/', (_req, res) => {
      res.send('API está rolando...');
    });

    // TODO: Implementar rotas (userRoute, accountRoute)
    // TODO: Implementar middleware de tratamento de erros (Responser/Throwlhos)

    const PORT = Env.port;
    app.listen(PORT, () => {
      console.log(`[Server] Servidor disponível na porta ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:');
    console.error(error);
    Deno.exit(1);
  }
};

await server();
