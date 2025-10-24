import requestCheck from 'request-check';
import npmTthrowlhos, { IThrowlhos } from 'throwlhos';
import is from '@zarco/isness';

const throwlhos = npmTthrowlhos.default;

export type Validator = (...args: ICheckObj[]) => void;

export interface ICheckObj {
  [key: string]: any;
  isRequiredField?: boolean;
};

export interface IInvalidField {
  value: any;
  field: any;
  message: string;
};

export interface BaseRulesConfig {
  requiredMessage?: string;
  invalidFieldsMessage?: string;
};

export class BaseRules {
  protected rc
  private config: BaseRulesConfig;

  constructor(config:BaseRulesConfig = {}) {
    this.config = { 
      requiredMessage:
       'Este campo é obrigatório',
      invalidFieldsMessage:
       'Foram encontrados {count} campo(s) inválido(s): {fields}',
      ...config
    }
    this.rc = requestCheck.default();
    this.rc.addRule('pagination', {
      validator: (value: any) => typeof value === 'object' && is.number(value.page) && is.number(value.limit),
      message: 'Valor para paginação inválido! Deve ser um objeto com as propriedades "page" e "limit".',
    })
  }

  validate = (...args: ICheckObj[]): void => {
    try {
      const arrayOfInvalid = this.rc.check(...args);
      if (arrayOfInvalid?.length) {
        const joinedFieldNames = arrayOfInvalid.map((e: IInvalidField) => e.field).join(', ');
        const errorMessage = this.config.invalidFieldsMessage!
          .replace('{count}', arrayOfInvalid.length.toString())
          .replace('{fields}', joinedFieldNames)
        
        throw throwlhos.err_badRequest(
          errorMessage,
          arrayOfInvalid,
        )
      }
    } catch (err: any) {
      console.warn(err)
      throw {
        code: 422,
        message: err.message ?? err,
        status: err.status,
        errors: err.errors,
      } as IThrowlhos
    }
  }
}