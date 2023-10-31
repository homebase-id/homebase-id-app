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

    const nameAttr = attributes?.filter(
      attr => attr.type === BuiltInAttributes.Name,
    )[0];
    const photoAttr = attributes?.filter(
      attr => attr.type === BuiltInAttributes.Photo,
    )[0];

    return {
      firstName: nameAttr?.data.givenName,
      surName: nameAttr?.data.surname,
      profileImageId: photoAttr?.data.profileImageId,
    };
  };

  return useQuery({ queryKey: ['profile-data'], queryFn: fetchProfile });
};

export { useProfile };
