import { View } from 'react-native';
import { Text } from '../../../ui/Text/Text';
import { t } from 'feed-app-common';
import { Colors } from '../../../../app/Colors';

export const EmptyComment = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        {t('No Comments yet')}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '400',
          color: Colors.gray[500],
        }}
      >
        Be the first to comment on this post.
      </Text>
    </View>
  );
};
