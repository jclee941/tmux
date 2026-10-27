type LogMethod = (message: string, ...values: readonly unknown[]) => void;

const write = (level: string, message: string, values: readonly unknown[]): void => {
  console.log(`[${level}] ${message}`, ...values);
};

export const logger: Readonly<{
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}> = {
  debug: (message, ...values) => write("DEBUG", message, values),
  info: (message, ...values) => write("INFO", message, values),
  warn: (message, ...values) => write("WARN", message, values),
  error: (message, ...values) => write("ERROR", message, values),
};
