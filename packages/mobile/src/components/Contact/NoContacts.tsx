import { TouchableOpacity, View } from 'react-native';
import { Text } from '../ui/Text/Text';

import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { openURL } from '../../utils/utils';
import { People } from '../ui/Icons/icons';
import { Colors } from '../../app/Colors';

export const NoContacts = () => {
  const identity = useDotYouClientContext().getIdentity();
  return (
    <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Text style={{ color: Colors.gray[400], fontStyle: 'italic' }}>
        {t('To chat with someone on Homebase you need to be connected first.')}
      </Text>
      <TouchableOpacity
        style={{
          gap: 8,
          flexDirection: 'row',
          marginLeft: 'auto',
        }}
        onPress={() => openURL(`https://${identity}/owner/connections`)}
      >
        <Text>{t('Connect')}</Text>
        <People />
      </TouchableOpacity>
    </View>
  );
};
