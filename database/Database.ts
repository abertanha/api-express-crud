import mongoose, { type Connection } from 'mongoose'
import { Env, env, EnvTypes } from '../config/Env.ts'
import is from '@zarco/isness'
import { Print } from '../utilities/Print.ts'
import { throwlhos } from '../globals/Throwlhos.ts'

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
	private readonly print: Print;

	constructor(
		databaseConnection: IDatabaseConnection,
		print: Print = new Print()
		) {
			this.print = print
			this.print.info('[Database] Connection Params: ', databaseConnection);
			
			this.hostname = databaseConnection.hostname
			this.database = databaseConnection.database
			this.username = databaseConnection.username
			
			this.password = Env.getDatabasePasswordByUsername(this.username)
			this.validate()
		}
		private validate = (): void => {
			if (!this.username) {
				throw throwlhos.err_internalServerError('[Database] Please provide a database username!')
			}
			if (!this.hostname) {
				throw throwlhos.err_internalServerError('[Database] Please provide a database hostname!')
			}
			if (!this.database) {
				throw throwlhos.err_internalServerError('[Database] Please provide a database name!')
			}
			if (!this.password) {
				throw throwlhos.err_internalServerError(
					`[Database] Please provide a database password for ${this.username}! Check .env file.`
				)
			}
		}
		
		public get connectionString(): string {
			return `mongodb+srv://${this.username}:${this.password}@${this.hostname}/${this.database}`;
		}
		
		public connect = (): mongoose.Connection => {
			try {
				
			if (this.printConnectionStringOnConnect) {
				const safeString = `mongodb+srv://${this.username}:[PASSWORD]@${this.hostname}/${this.database}`
      	this.print.info(`[Database] Connecting to: ${safeString}`)
			}		
		
			mongoose.set('strictQuery', false);
			 
			const options: mongoose.ConnectOptions = {
				maxPoolSize: this.getMaxPoolSize(),
				dbName: this.database,
			};

			const connection: Connection = mongoose.createConnection(this.connectionString, options);
			
			connection.on('connected', () => {
				this.print.success(
					`[Database] Successfully connected to ${this.database} at ${this.hostname}`
				);
			});

			connection.on('error', (err: unknown) => {
				this.print.error(`[Database] Connection error: ${err}`);
			});			
			
			return connection;
		
		} catch (error) {
			this.print.error(`[Database] Error connecting to database: ${error}`);
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
      this.print.info(
				`[Database] Invalid default maxPoolSize value: ${defaultMaxPoolSize}, using 10.`
			)
      return 10;
    }

    return Number(defaultMaxPoolSize);
  }
}
