import { env, Env, EnvTypes } from '../../config/Env.ts'
import { Database, IDatabaseConnection } from '../Database.ts'


const databaseConfiguration = env<IDatabaseConnection>({
  [EnvTypes.developmentLike]: { // local, dev, hml
    hostname: Env.dbHost!,
    database: Env.dbName!,
    username: Env.dbUser!,
  },
  [EnvTypes.productionLike]: { // server
    hostname: Env.dbHost!,
    database: Env.dbName!,
    username: Env.dbUser!,
  },
}) as IDatabaseConnection

const database = new Database(databaseConfiguration)

export const BankingDB = database.connect()

// TODO
// preciso entender melhor essa camada de definição