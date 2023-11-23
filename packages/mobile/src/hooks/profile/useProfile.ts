import { useQuery } from '@tanstack/react-query';
import useAuth from '../auth/useAuth';
import {
  BuiltInAttributes,
  BuiltInProfiles,
  getAttributeVersions,
} from '@youfoundation/js-lib/profile';

const useProfile = () => {
  const dotYouClient = useAuth().getDotYouClient();

  const fetchProfile = async () => {
    const attributes = await getAttributeVersions(
      dotYouClient,
      BuiltInProfiles.StandardProfileId,
      undefined,
      [BuiltInAttributes.Name, BuiltInAttributes.Photo],
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
      firstName: nameAttr?.data.givenName,
      surName: nameAttr?.data.surname,
      profileImageFileId: photoDsr?.fileId,
      profileImageFileKey: photoAttr?.data.profileImageKey,
    };
  };

  return useQuery({ queryKey: ['profile-data'], queryFn: fetchProfile });
};

export { useProfile };
