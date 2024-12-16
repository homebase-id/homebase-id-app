import { useQuery } from '@tanstack/react-query';

import {
  BuiltInAttributes,
  BuiltInProfiles,
  getProfileAttributes,
} from '@homebase-id/js-lib/profile';
import { useDotYouClientContext } from 'homebase-id-app-common';

export const useProfile = () => {
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
      displayName: nameAttr?.data?.displayName || dotYouClient.getLoggedInIdentity(),
      firstName: nameAttr?.data?.givenName,
      surName: nameAttr?.data?.surname,

      profileImageFileId: photoDsr?.fileId,
      profileImageFileKey: photoAttr?.data?.profileImageKey,
      profileImagePreviewThumbnail: photoDsr?.fileMetadata?.appData?.previewThumbnail,
      profileImageLastModified: photoDsr?.fileMetadata.updated,
    };
  };

  return useQuery({
    queryKey: ['profile-data'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 60 * 24, // 1 day,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
