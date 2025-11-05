import { Time } from './Time.ts'

export class Print {
  private fileIdentificator: string;
  private fixedAlternativePrefix: string;
  constructor(
    fileIdentificator?: string,
    fixedAlternativePrefix?: string
  ) {
    this.fileIdentificator = fileIdentificator || 'PRINT';
    this.fixedAlternativePrefix = fixedAlternativePrefix || '';
  }

  private getTimestamp(): string {
    return Time.now().toDate().toISOString();
  }

  private logWithColor(message: string, color: 'green' | 'red' | 'blue' | 'yellow'): void {
    const colorCodes = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      reset: '\x1b[0m',
    }
    console.log(`${colorCodes[color]}${message}${colorCodes.reset}`)
  }

  public info(message: string, content?: unknown): void {
    let fullMessage = `[${this.getTimestamp()}] ℹ️ [${this.fileIdentificator}] ${this.fixedAlternativePrefix}${message}`
    
    if (content) {
      fullMessage += ': ' + Deno.inspect(content, { colors: true, depth: 8 })
    }
    
    this.logWithColor(fullMessage, 'blue')
  }

  success(message: string, content?: unknown) {
    let fullMessage = `[${this.getTimestamp()}] ✅ [${this.fileIdentificator}] ${this.fixedAlternativePrefix}${message}`
    
    if (content) {
      fullMessage += ': ' + Deno.inspect(content, { colors: true, depth: 8 })
    }
    
    this.logWithColor(fullMessage, 'green')
  }

  public warn(message: string, content?: unknown): void {
    let fullMessage = `[${this.getTimestamp()}] ⚠️  [${this.fileIdentificator}] ${this.fixedAlternativePrefix}${message}`
    
    if (content) {
      fullMessage += ': ' + Deno.inspect(content, { colors: true, depth: 8 })
    }
    
    this.logWithColor(fullMessage, 'yellow')
  }

  public error(message: string, content?: unknown): void {
    let fullMessage = `[${this.getTimestamp()}] ❌ [${this.fileIdentificator}] ${this.fixedAlternativePrefix}${message}`
    
    if (content) {
      fullMessage += ': ' + Deno.inspect(content, { colors: true, depth: 8 })
    }
    
    this.logWithColor(fullMessage, 'red')
  }
}