type ColorName = keyof typeof ColorsProxy['colorCodes'];

export class ColorsProxy {
  static colorCodes = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',
  }
  static colorize(message: string, color: ColorName): string {
    const colorCode = this.colorCodes[color]
    return `${colorCode}${message}${this.colorCodes.reset}`
  }
}

type ColorFunctions =
  & {
    [K in ColorName]: (message: string) => string
  }
  & typeof ColorsProxy

export const Colors: ColorFunctions = new Proxy(ColorsProxy, {
  get(target, prop: string) {
    if (prop in target) {
      return (target as any)[prop]
    }

    if (prop in target.colorCodes) {
      return (message: string) => target.colorize(message, prop as ColorName)
    }

    throw new Error(`Color "${prop}" is not defined`)
  },
}) as ColorFunctions