import mongoose, { type Connection } from 'mongoose'
import { Env, env, EnvTypes } from '../config/Env.ts'
import is from '@zarco/isness'
import { Print } from '../utilities/Print.ts'
import { throwlhos } from '../globals/Throwlhos.ts'

const print = new Print();

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

	private static connections = new Map<string, mongoose.Connection>();

	constructor(
		databaseConnection: IDatabaseConnection,
		print: Print = new Print()
		) {
			console.info('[Database] Connection Params: ', databaseConnection);
			this.print = print;
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
				throw throwlhos.err_internalServerError(`[Database] Please provide a database password for ${this.username}! Check .env file.`)
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
			 
			const options = {
				maxPoolSize: this.getMaxPoolSize(),
				dbName: this.database,
			};

			const connection: Connection = mongoose.createConnection(this.connectionString, options as any);
			
			connection.on('connected', () => {
				this.print.sucess(`[Database] Successfully connected to ${this.database} at ${this.hostname}`);
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
      this.print.info(`[Database] Invalid default maxPoolSize value: ${defaultMaxPoolSize}, using 10.`)
      return 10;
    }

    return Number(defaultMaxPoolSize);
  }
	public static registerConnection(name: string, connection: mongoose.Connection): void {
		if (Database.connections.has(name)) {
			print.warn(`[Database] Connection '${name}' already registered. Skipping.`);
			return;
		}
		Database.connections.set(name, connection);
		print.info(`[Database] Connection '${name}' registered successfully.`);
  }
	public static getConnection(name: string): mongoose.Connection {
		const connection = Database.connections.get(name);
		if (!connection) {
			throw new Error(
				`[Database] Connection '${name}' not found. Available connections: ${Array.from(Database.connections.keys()).join(', ')}`
			);
		}
		return connection;
	}

	public static async initializeNamed(
		name: string, 
		config: IDatabaseConnection
	): Promise<mongoose.Connection> {

		if (Database.connections.has(name)) {
			print.info(`[Database] Connection '${name}' already initialized.`);
			return Database.connections.get(name)!;
		}

		print.info(`[Database] Initializing connection '${name}'...`);
		const db = new Database(config);
		const connection: Connection = db.connect();
		
		await new Promise<void>((resolve, reject) => {
			connection.once('connected', () => resolve());
			connection.once('error', (err: unknown) => reject(err));
		});

		Database.registerConnection(name, connection);

		return connection;
	}

	public static hasConnection(name: string): boolean {
		return Database.connections.has(name);
	}

	public static listConnections(): string[] {
		return Array.from(Database.connections.keys());
	}

	public static async closeAllConnections(): Promise<void> {
		print.info('[Database] Closing all connections...');
		const closePromises = Array.from(Database.connections.entries()).map(
			([name, connection]) => {
				return connection.close().then(() => {
					print.info(`[Database] Connection '${name}' closed.`);
				});
			}
		);
		await Promise.all(closePromises);
		Database.connections.clear();
		print.info('[Database] All connections closed.');
	}
}
