import { getTransferHistory, SystemFileType, TargetDrive } from '@homebase-id/js-lib/core';
import { useQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from 'homebase-id-app-common';

export const useTransferHistory = (props?: {
  fileId: string;
  targetDrive: TargetDrive;
  systemFileType?: SystemFileType;
}) => {
  const { fileId, targetDrive, systemFileType } = props || {};

  const dotYouClient = useDotYouClientContext();

  const fetchTransferHistory = async () => {
    if (!fileId || !targetDrive) return null;

    return getTransferHistory(dotYouClient, targetDrive, fileId, {
      systemFileType,
    });
  };

  return {
    fetch: useQuery({
      queryFn: fetchTransferHistory,
      queryKey: ['transferHistory', targetDrive?.alias, fileId],
      enabled: !!props,
    }),
  };
};
