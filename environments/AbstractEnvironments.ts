import express, { Express } from 'npm:express'
import cors from 'npm:cors'
import morgan from 'npm:morgan'
import helmet from 'npm:helmet'
import responser from 'responser'
import { Responserror } from '../middlewares/ResponserrorMiddle.ts'

export abstract class AbstractEnvironment {
  public port: number
  public ip: string = ''

  constructor(port: number) {
    if (isNaN(port)) {
      throw new Error(`Port is not a number: PORT=<${port}>`)
    }
    this.port = port
    console.log(`✅ Environment initialized on port ${port}`)
  }

  protected initializeDefaultMiddlewares(server: Express): void {
    server.use(cors({
      origin: '*',
      credentials: true,
    }))

    server.use(helmet());
    server.use(responser.default);

    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    server.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
    server.use(express.static('public'));
  }

  protected listen(server: Express): void {
    // const responserror = new Responserror({ promptErrors: true })
    // server.use(responserror.errorHandler)

    server.listen(this.port, this.ip, () => {
      const where = this.ip ? `${this.ip}:${this.port}` : String(this.port)
      console.log(`🚀 Server listening at ${where}`)
    })
  }
}