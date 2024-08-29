import { useMutation } from '@tanstack/react-query';
import { ApiType } from '@homebase-id/js-lib/core';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { BuiltInAttributes } from '@homebase-id/js-lib/profile';
import {
  publishProfile,
  publishProfileCard,
  publishProfileImage,
} from '@homebase-id/js-lib/public';
import { useDotYouClientContext } from 'feed-app-common';

export const useStaticFiles = () => {
  const dotYouClient = useDotYouClientContext();

  const publishData = async (dataType?: 'channel' | typeof BuiltInAttributes.Name) => {
    console.debug('[STARTED] Static file publish', dataType);

    const publishActions: Promise<unknown>[] = [publishProfile(dotYouClient, dataType)];

    if (dotYouClient.getType() === ApiType.Owner) {
      if (!dataType || stringGuidsEqual(dataType, BuiltInAttributes.Photo)) {
        publishActions.push(publishProfileImage(dotYouClient));
      }

      if (!dataType || stringGuidsEqual(dataType, BuiltInAttributes.Name)) {
        publishActions.push(publishProfileCard(dotYouClient));
      }
    }

    await Promise.all(publishActions);

    console.debug('[COMPLETED] Static file publish');
  };

  return {
    publish: useMutation({
      mutationFn: publishData,
      onError: (ex) => {
        console.error(ex);
      },
    }),
  };
};
