import { appendFile, CachesDirectoryPath, exists, readFile, writeFile } from 'react-native-fs';
import { Error } from '../../hooks/errors/useErrors';
import { Platform, ShareContent } from 'react-native';

const path = `${CachesDirectoryPath}/homebase-id-app-logs.txt`;

export const addLogs = async (
  error: Error | string,
  logLevel: 'info' | 'warn' | 'error' = 'info'
) => {
  const err = (() => {
    const dateStr = new Date().toISOString();
    if (typeof error === 'string') {
      return `${logLevel.toUpperCase()} ${dateStr}: ${error}\n`;
    }

    return `${logLevel.toUpperCase()} ${dateStr}: ${converErrorToLog(error)}\n`;
  })();

  if (!(await exists(path))) {
    return writeFile(path, err);
  }
  return appendFile(path, err);
};

export const getLogs = async () => {
  if (await exists(path)) {
    return `file://${path}`;
  }
  return;
};

export const shareLogs = async (): Promise<ShareContent | null> => {
  const logsPath = await getLogs();

  if (!logsPath) return null;

  if (Platform.OS === 'ios') {
    return { url: logsPath };
  }

  return { message: await readFile(logsPath) };
};

export const clearLogs = async () => {
  if (await exists(path)) {
    return writeFile(path, '');
  }
};

const converErrorToLog = (error: Error) => {
  if (error.details) {
    return `${error.title} - ${error.message}\n - ${JSON.stringify(error.details)}`;
  }

  return `${error.title} - ${error.message}`;
};

const parseArgsToString = (args: (Error | string | number | object | undefined | unknown)[]) =>
  args.map(parseArgToString).join(' ');

const parseArgToString = (arg: Error | string | number | object | undefined | unknown) => {
  if (!arg || typeof arg === 'string' || typeof arg === 'number') {
    return arg;
  }

  if (typeof arg === 'object' && 'title' in arg && 'message' in arg) {
    return converErrorToLog(arg as Error);
  }

  if (typeof arg === 'object') {
    return JSON.stringify(arg);
  }

  return arg;
};

export default {
  Log: (...args: (string | number | object | undefined)[]) => addLogs(parseArgsToString(args)),
  Warn: (...args: (string | number | object | undefined)[]) =>
    addLogs(parseArgsToString(args), 'warn'),
  Error: (...args: (Error | string | number | object | undefined | unknown)[]) =>
    addLogs(parseArgsToString(args), 'error'),
};
