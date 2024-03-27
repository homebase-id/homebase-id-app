import { useQuery } from '@tanstack/react-query';

import {
  BuiltInAttributes,
  BuiltInProfiles,
  getProfileAttributes,
} from '@youfoundation/js-lib/profile';
import { useDotYouClientContext } from 'feed-app-common';

const useProfile = () => {
  const dotYouClient = useDotYouClientContext();

  const fetchProfile = async () => {
    const attributes = await getProfileAttributes(
      dotYouClient,
      BuiltInProfiles.StandardProfileId,
      undefined,
      [BuiltInAttributes.Name, BuiltInAttributes.Photo]
    );

    const nameDsr = attributes?.find(
      (attr) => attr.fileMetadata.appData.content.type === BuiltInAttributes.Name
    );
    const nameAttr = nameDsr?.fileMetadata.appData.content;

    const photoDsr = attributes?.find(
      (attr) => attr.fileMetadata.appData.content.type === BuiltInAttributes.Photo
    );
    const photoAttr = photoDsr?.fileMetadata.appData.content;

    return {
      firstName: nameAttr?.data?.givenName,
      surName: nameAttr?.data?.surname,
      profileImageFileId: photoDsr?.fileId,
      profileImageFileKey: photoAttr?.data?.profileImageKey,
    };
  };

  return useQuery({ queryKey: ['profile-data'], queryFn: fetchProfile });
};

export { useProfile };
