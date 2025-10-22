import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const MONGODB_URI = Deno.env.get("MONGODB_URI")!;
        if (!MONGODB_URI){
            throw new Error('Não foi encontrada a string de conexão ao MongoDB');
        }

        await mongoose.connect(MONGODB_URI);
        console.log("Conexão com a base de dados bem sucedida");
    } catch (error) {
        console.error(`Houve algum erro na conexão com o Banco de dados: ${error}`);
        Deno.exit(1);
    }
}



