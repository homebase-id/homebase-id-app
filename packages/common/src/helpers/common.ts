import { RichText } from '@homebase-id/js-lib/core';

export const ellipsisAtMaxChar = (str?: string, maxChar?: number) => {
  if (!str || !maxChar) {
    return str;
  }

  if (str.length <= maxChar) {
    return str;
  }

  return `${str.substring(0, maxChar)}...`;
};
