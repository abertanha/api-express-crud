import mongoose, { type Connection } from 'mongoose'
import { Env, env, EnvTypes } from '../config/Env.ts'
import is from '@zarco/isness'

export interface IDatabaseConnection {
  username: string;
  hostname: string;
  database: string;
}

export class Database {
	private readonly username: string;
	private readonly password: string;
	private readonly hostname: string;
	private readonly database: string;
	private readonly printConnectionStringOnConnect = true;
	private static instance: mongoose.Connection


	constructor(databaseConnection: IDatabaseConnection) {
			console.info('[Database] Connection Params: ', databaseConnection);
			
			this.hostname = databaseConnection.hostname
			this.database = databaseConnection.database
			this.username = databaseConnection.username
			this.password = Env.getDatabasePasswordByUsername(this.username)
			this.validate()
	}
	private validate = (): void => {
		if (!this.username) {
			throw Error('[Database] Please provide a database username!')
		}
		if (!this.hostname) {
			throw Error('[Database] Please provide a database hostname!')
		}
		if (!this.database) {
			throw Error('[Database] Please provide a database name!')
		}
		if (!this.password) {
			throw Error(`[Database] Please provide a database password for ${this.username}! Check .env file.`)
		}
	}

	public get connectionString(): string {
		return `mongodb+srv://${this.username}:${this.password}@${this.hostname}${this.database}`;
	}
	
	public connect = (): mongoose.Connection => {
		try {
			if (this.printConnectionStringOnConnect) {
				const safeString = `mongodb+srv://${this.username}:[PASSWORD]@${this.hostname}${this.database}`
        console.info(`[Database] Connecting to: ${safeString}`)
			}

		mongoose.set('strictQuery', false);
		
		// como faço para não ter que definir todos essas variáveis undefined? 
		const options = {
      maxPoolSize: this.getMaxPoolSize(),
			dbName: this.database,
    };

		const connection: Connection = mongoose.createConnection(this.connectionString, options as any);

		connection.on('connected', () => {
			console.log(`[Database] Successfully connected to ${this.database} at ${this.hostname}`);
		});

		connection.on('error', (err: unknown) => {
      console.error(`[Database] Connection error: ${err}`)
    });			
		
		return connection;
		
		} catch (error) {
			console.error(`[Database] Error connecting to database: ${error}`);
			throw error;
		} 
	}

	private getMaxPoolSize = (): number => {
    if (Env.mongodbMaxPoolSize) return Env.mongodbMaxPoolSize

    const defaultMaxPoolSize = env({
      [EnvTypes.developmentLike]: 10,
      [EnvTypes.productionLike]: 100,
    })

    if (!is.number(defaultMaxPoolSize as any) || Number(defaultMaxPoolSize) <= 0) {
      console.info(`[Database] Invalid default maxPoolSize value: ${defaultMaxPoolSize}, using 10.`)
      return 10
    }

    return Number(defaultMaxPoolSize)
  }
	public static get connection(): mongoose.Connection {
    if (!Database.instance) {
      throw new Error(
        "[Database] Connection not initialized. Call Database.initialize() first.",
      );
    }
    return Database.instance;
  }

	public static async initialize(): Promise<mongoose.Connection> {
		if (Database.instance) {
      return await Database.instance
    };

		const db = new Database({
      username: Env.dbUser!,
      hostname: Env.dbHost!,
      database: Env.dbName!,
    });
		
		Database.instance = db.connect();

		return Database.instance;
	}
}



