import express, { Express } from 'npm:express'
import cors from 'npm:cors'
import morgan from 'npm:morgan'
import helmet from 'npm:helmet'
import responser from 'responser'
import { Responserror } from '../middlewares/ResponserrorMiddle.ts'
import { Print } from '../utilities/Print.ts'
import { Colors } from '../utilities/Colors.ts'
import dayjs from 'dayjs'

export abstract class AbstractEnvironment {
  public port: number
  public ip: string = ''
  public morganFormatString: string
  private _print: Print;

  constructor(port: number, print?: Print) {
    this._print = print || new Print();
    if (isNaN(port)) {
      throw new Error(`Port is not a number: PORT=<${port}>`)
    }
    this.port = port
    if (!this.port) {
      throw Error(
        `A porta não foi configurada: PORT=<${this.port}>`,
      )
    }

    if (isNaN(Number(this.port))) {
      throw Error(
        `A porta é inválida: PORT=<${this.port}>`,
      )
    }

    this.morganFormatString = ':remote-addr :method :url :status :res[content-length] - :response-time ms'

    this._print.info('Enabled.')
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

    server.use(
      morgan(this.morganFormatString)
    )

    server.use(express.static('public'));

    server.use('/custom', express.static('docs/custom'));
  }

  protected listen(server: Express): void {
    const responserror = new Responserror({ promptErrors: true })
    server.use(responserror.errorHandler)

    const host = this.ip || '0.0.0.0' // não entendi onde definir o ip
    
    server.listen(this.port, host, this.listener)
  }
  public listener = () => {
    const where = this.ip ? `${this.ip}:${this.port}` : String(this.port)
    this._print.success(
      `Successfully listening at ${Colors.blue(where)}`,
    )
  }
}