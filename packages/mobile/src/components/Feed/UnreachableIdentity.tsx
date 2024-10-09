import { HomebaseFile } from '@homebase-id/js-lib/core';
import { PostContent } from '@homebase-id/js-lib/public';
import { t } from 'homebase-id-app-common';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { View } from 'react-native';
import { memo } from 'react';

interface UnreachableIdentityProps {
  className?: string;
  postFile: HomebaseFile<PostContent>;
  odinId: string;
}

//TODO: UI improvs
export const UnreachableIdentity = memo((_props: UnreachableIdentityProps) => {
  const { isDarkMode } = useDarkMode();

  // const {
  //   removeFromFeed: { mutateAsync: removeFromMyFeed },
  // } = useManageSocialFeed({ odinId });

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
        {t("Can't reach this identity atm")}{' '}
      </Text>
    </View>
  );
});
