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

	private static connections = new Map<string, mongoose.Connection>();

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
		return `mongodb+srv://${this.username}:${this.password}@${this.hostname}/${this.database}`;
	}
	
	public connect = (): mongoose.Connection => {
		try {
		
			if (this.printConnectionStringOnConnect) {
				const safeString = `mongodb+srv://${this.username}:[PASSWORD]@${this.hostname}/${this.database}`
      	console.info(`[Database] Connecting to: ${safeString}`)
			}		
		
			mongoose.set('strictQuery', false);
			 
			const options = {
				maxPoolSize: this.getMaxPoolSize(),
				dbName: this.database,
			};

			const connection: Connection = mongoose.createConnection(this.connectionString, options);
			
			connection.on('connected', () => {
				console.log(`[Database] Successfully connected to ${this.database} at ${this.hostname}`);
			});

			connection.on('error', (err: unknown) => {
				console.error(`[Database] Connection error: ${err}`);
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
      return 10;
    }

    return Number(defaultMaxPoolSize);
  }
	public static registerConnection(name: string, connection: mongoose.Connection): void {
		if (Database.connections.has(name)) {
			console.warn(`[Database] Connection '${name}' already registered. Skipping.`);
			return;
		}
		Database.connections.set(name, connection);
		console.info(`[Database] Connection '${name}' registered successfully.`);
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
			console.info(`[Database] Connection '${name}' already initialized.`);
			return Database.connections.get(name)!;
		}

		console.info(`[Database] Initializing connection '${name}'...`);
		const db = new Database(config);
		const connection: Connection = db.connect();
		
		await new Promise<void>((resolve, reject) => {
			connection.once('connected', () => resolve());
			connection.once('error', (err) => reject(err));
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
		console.info('[Database] Closing all connections...');
		const closePromises = Array.from(Database.connections.entries()).map(
			([name, connection]) => {
				return connection.close().then(() => {
					console.info(`[Database] Connection '${name}' closed.`);
				});
			}
		);
		await Promise.all(closePromises);
		Database.connections.clear();
		console.info('[Database] All connections closed.');
	}
}
