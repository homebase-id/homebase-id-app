import { HomebaseFile } from '@homebase-id/js-lib/core';
import { PostContent } from '@homebase-id/js-lib/public';
import { t, useDotYouClientContext } from 'feed-app-common';
import { useManageSocialFeed } from '../../hooks/feed/useManageSocialFeed';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { View } from 'react-native';

interface UnreachableIdentityProps {
  className?: string;
  postFile: HomebaseFile<PostContent>;
  odinId: string;
}

//TODO: UI improvs
export const UnreachableIdentity = ({ postFile, odinId }: UnreachableIdentityProps) => {
  const host = useDotYouClientContext().getRoot();
  const { isDarkMode } = useDarkMode();

  const {
    removeFromFeed: { mutateAsync: removeFromMyFeed },
  } = useManageSocialFeed({ odinId });

  return (
    <View
      style={{
        padding: 10,
        marginHorizontal: 10,
        marginVertical: 5,
        borderRadius: 5,
        elevation: 5,

        backgroundColor: isDarkMode ? 'black' : 'white',
      }}
    >
      <Text
        style={{
          opacity: 0.7,
        }}
      >
        {t('Can&apos;t reach this identity atm')}{' '}
      </Text>
    </View>
  );
};
