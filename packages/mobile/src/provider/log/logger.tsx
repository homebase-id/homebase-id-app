import { appendFile, CachesDirectoryPath, exists, writeFile } from 'react-native-fs';
import { Error } from '../../hooks/errors/useErrors';

const path = `${CachesDirectoryPath}/homebase-id-app-logs.txt`;

export async function addLogs(error: Error) {
  const err = `${new Date().toISOString()}: ${error.title} - ${error.message}\n Details: ${JSON.stringify(error.details)}\n\n`;
  if (!(await exists(path))) {
    return writeFile(path, err);
  }
  return appendFile(path, err);
}

export async function getLogs() {
  if (await exists(path)) {
    return `file://${path}`;
  }
  return;
}
