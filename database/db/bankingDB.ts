import { ClientSession } from 'mongoose'
import { env, Env, EnvTypes } from '../../config/Env.ts';
import { Database, IDatabaseConnection } from '../Database.ts';

const databaseConfiguration = env<IDatabaseConnection>({
  [EnvTypes.developmentLike]: {
    hostname: Env.dbHost!,
    database: Env.dbName!,
    username: Env.dbUser!,
  },
  [EnvTypes.productionLike]: {
    hostname: Env.dbHost!,
    database: Env.dbName!,
    username: Env.dbUser!,
  },
}) as IDatabaseConnection;

const database = new Database(databaseConfiguration)

export const connectionString = database.connectionString;

const BankingDB = database.connect()

export { BankingDB }

export const startBankingSession = async (): Promise<ClientSession> => {
  const session = await BankingDB.startSession();
  await session.startTransaction()
  return session
}