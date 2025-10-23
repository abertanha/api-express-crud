import { load } from '@std/dotenv'
import is from '@zarco/isness'

// na minha aplicação por enquanto name pode ser const.
const name = Deno.env.get('ENV') ?? 'local';

export const EnvironmentName = {
	local: 'local',
	dev: 'dev',
	hml: 'hml',
	server: 'server', // server seria produção?
} as const;

if (Deno.env.get('ENV') === undefined) {
	await load ({
		envPath: `.env.${name}`,
		examplePath: '.env.example',
		allowEmptyValues: false,
		export: true,
	})
}

export const EnvTypes = {
	local: 'local',
	hml: 'hml',
	dev: 'dev',
	server: 'server',
	developmentLike: 'developmentLike',
  productionLike: 'productionLike',
} as const;

type EnvType = keyof typeof EnvTypes;
type EnvObject<T> = { [key in EnvType]?: T } 

// principal classe de ambientação
export class Env {
	static get name() {
		return name;
	}

	static get port() {
		return Number(Deno.env.get('PORT') ?? '');
	}

	static get dev() {
		return name === EnvironmentName.dev;
	}

	static get local() {
		return name === EnvironmentName.local;
	}

	static get isDevLike() {
		return this.local || this.dev;
	}

	static get isProductionLike() { // aqui assumi que server é prod
		return name === EnvironmentName.server;
	}

	// variaveis db
	static get dbHost() {
		return Deno.env.get('DB_HOST');
	}

	static get dbName() {
		return Deno.env.get('DB_NAME');
	}

	static get dbUser() {
		return Deno.env.get('DB_USER');
	}

	static getDatabasePasswordByUsername(databaseUsername: string): string {
  	if (!databaseUsername) throw Error('Forneça o usuário do db!')
		
		// no meu projeto só aceitaria abertanha_agx
    const password = Deno.env.get(`DATABASE_PASSWORD_FOR_${databaseUsername}`) 
    if (!password) throw Error(`Nenhuma senha foi encontrada para o usuário ${databaseUsername}`)
    
		return password
	}

	static get mongodbMaxPoolSize(): number | null {
    const mongodbMaxPoolSize = Deno.env.get('MONGODB_MAX_POOL_SIZE')
    
		if (!mongodbMaxPoolSize) return null
    
		if (!is.number(mongodbMaxPoolSize)) {
      throw new Error(`Invalid MONGODB_MAX_POOL_SIZE: ${mongodbMaxPoolSize}`)
    }
    return Number(mongodbMaxPoolSize)
  }


	
	// variaveis do sistema de autentificação
	static get jwtSecret() {
    const secret = Deno.env.get('JWT_SECRET')
    if (!secret) {
      throw new Error('JWT_SECRET não foi encontrado nas variáveis env!')
    }
    return secret
  }
}

export const env = <T = string>(objectOfEnvs: EnvObject<T>): T | string => {
	const keys: EnvType[] = Object.keys(objectOfEnvs) as EnvType[];
	let result: T | null = null;

	keys.forEach((key) => {
		if (!result && key === name && objectOfEnvs[key]) {
			result = objectOfEnvs[key] as T;
		}
		if (!result && key === EnvTypes.developmentLike && Env.isDevLike) {
      result = objectOfEnvs[EnvTypes.developmentLike] as T
    }
    if (!result && key === EnvTypes.productionLike && Env.isProductionLike) {
      result = objectOfEnvs[EnvTypes.productionLike] as T
    }
	})

	return result ?? '';
}
