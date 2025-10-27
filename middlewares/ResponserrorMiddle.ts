import { NextFunction, Request, Response } from 'npm:express'
import HttpStatus from 'npm:http-status-codes'

const camelCase = (str: string) => 
  str.toLowerCase().replace(/(\_\w)/g, (c) => c[1].toUpperCase())

type IOptions = {
  promptErrors: boolean | (() => boolean)
}

type IResponserrorObject = {
  code: number
  status: string
  message: string
  success: boolean
  errors: { [key: string]: any } | undefined
  [key: string]: unknown
}

export class Responserror {
  private preFunctions: Function[] = []
  private posFunctions: Function[] = []

  public pre = (fn: Function) => this.preFunctions.push(fn)
  public pos = (fn: Function) => this.posFunctions.push(fn)

  private options: IOptions
  private mapStatusByCode: { [code: number]: string } = {}
  
  private responserror: IResponserrorObject = {
    code: 500,
    status: 'INTERNAL_SERVER_ERROR',
    message: 'Internal Server Error',
    success: false,
    errors: undefined,
  }

  constructor(options: IOptions = { promptErrors: false }) {
    this.options = options
    this.setMapStatusByCode()
  }

  private setMapStatusByCode = () => {
    for (const [httpStatus, httpCode] of Object.entries(HttpStatus)) {
      if (
        !httpStatus.startsWith('get') &&
        typeof httpCode !== 'function' &&
        !['1', '2'].includes(String(httpCode).charAt(0))
      ) {
        Object.assign(this.mapStatusByCode, { [String(httpCode)]: httpStatus })
      }
    }
  }

  private setDefaultValuesForResponserror = () => {
    if (!['code', 'status', 'message'].some((prop) => this.responserror[prop])) {
      this.responserror.code = 500
      this.responserror.status = 'INTERNAL_SERVER_ERROR'
      this.responserror.message = 'Internal Server Error'
    }
    if (!this.responserror.success) this.responserror.success = false
    if (!this.responserror.errors) this.responserror.errors = undefined
  }

  public getMessageByCode = (code: string | number) => {
    try {
      return HttpStatus.getStatusText(code)
    } catch (e: unknown) {
      console.warn(e)
      return undefined
    }
  }

  public getStatusByCode = (code: number): string | undefined => 
    this.mapStatusByCode[code]

  public getCodeByStatus = (status: string): number | undefined => {
    for (const [httpStatus, httpCode] of Object.entries(HttpStatus)) {
      if (
        !httpStatus.startsWith('get') &&
        typeof httpCode !== 'function' &&
        !['1', '2'].includes(String(httpCode).charAt(0))
      ) {
        if (String(httpStatus).trim().toUpperCase() === String(status).trim().toUpperCase()) {
          return httpCode as number
        }
      }
    }
  }

  errorHandler = (
    error: any,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    this.preFunctions.forEach((fn) => fn.apply(null))

    // Extrai status do erro
    if (error.status) {
      this.responserror.status = error.status
      const code = this.getCodeByStatus(error.status)
      if (code) this.responserror.code = code
    }

    // Extrai código do erro
    if (error.code) {
      this.responserror.code = error.code
      const status = this.getStatusByCode(error.code)
      if (status) this.responserror.status = status
    }

    this.responserror.message = error.message || 
      this.getMessageByCode(this.responserror.code)
    this.responserror.errors = error.errors || error.content

    // Tratamento de erros de validação do Mongoose
    const isValidationSchemaError = this.responserror.errors &&
      JSON.stringify(this.responserror.errors).includes('ValidatorError')

    // Tratamento de erros de índice único do MongoDB
    const isUniqueIndexError = this.responserror.message?.includes('E11000')

    if (isUniqueIndexError) {
      this.responserror.message = this.responserror.message.replace(
        /.*index: (.*) dup key: { (.*) }/g,
        (_, index, key) => {
          const indexParts = index.split('.')
          let indexName = indexParts[indexParts.length - 1]
          const keyParts = key.split(',')
          const indexAndValue = keyParts
            .map((keyPart: string) => {
              const keyPartParts = keyPart.split(':')
              const keyName = keyPartParts[0].trim()
              const keyValue = keyPartParts[1].trim()
              return `${keyName}: ${keyValue}`
            })
            .join(', ')
          if (indexName.endsWith('_1')) indexName = indexName.slice(0, -2)
          return `Já existe registro cadastrado com ${indexName} (${indexAndValue})!`
        }
      )
      this.responserror.status = 'CONFLICT'
      this.responserror.code = 409
    }

    this.setDefaultValuesForResponserror()

    const responserrorObject = { ...this.responserror, ...error }

    if (isValidationSchemaError) {
      responserrorObject.errors = Object.entries(this.responserror.errors!).map(
        ([field, { message }]: [string, any]) => ({
          field,
          message,
        })
      )

      if (responserrorObject.errors.length) {
        responserrorObject.status = 'BAD_REQUEST'
        responserrorObject.code = 400
      }
    }

    // Log de erros se habilitado
    if (
      this.options.promptErrors === true ||
      (typeof this.options.promptErrors === 'function' && this.options.promptErrors())
    ) {
      console.error('Error:', error)
    }

    this.posFunctions.forEach((fn) => fn.apply(null))

    delete responserrorObject?._message

    const responserLikeStatus = camelCase(this.responserror.status)

    // Tenta usar método do responser (send_ok, send_badRequest, etc)
    if (typeof (response as any)[`send_${responserLikeStatus}`] === 'function') {
      return (response as any)[`send_${responserLikeStatus}`](
        this.responserror.message,
        responserrorObject?.errors
      )
    }

    // Fallback para response padrão
    const defineResponseErrorCode = (obj: { code?: number }) => {
      if (obj?.code && !isNaN(obj.code)) {
        const code = Number(obj.code)
        if (code >= 100 && code < 600) return code
      }
      return this.responserror.code ?? 500
    }

    const responseErrorCode = defineResponseErrorCode(responserrorObject)
    return response.status(responseErrorCode).json(responserrorObject)
  }
}