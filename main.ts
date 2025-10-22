import express from 'express';
import { connectDB } from './database/Database.ts';
import throwlhos from "throwlhos";


const app = express();

connectDB();

app.use(express.json());

app.get('/', (_req: any, res: { send: (arg0: string) => void; }) => {
  res.send("API está rolando...");
});

const PORT = Deno.env.get("PORT");

if (!PORT) {
  throwlhos.err_internalServerError({message: "Não foi encontrada a porta para o servidor"});
}

app.listen(PORT, () => console.log(`Servidor disponível na porta ${PORT}`));





