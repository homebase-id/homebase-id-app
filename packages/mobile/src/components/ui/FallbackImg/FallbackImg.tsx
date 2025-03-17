import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Attribute } from '@homebase-id/js-lib/profile';
import { getInitialsOfNameAttribute, getTwoLettersFromDomain } from '@homebase-id/js-lib/helpers';
import { fallbackProfileImage } from './FallbackHelpers';
import { getOdinIdColor } from '../../../app/Colors';

const getInitials = (
  domain: string | undefined,
  nameData?:
    | Attribute
    | {
        displayName?: string | undefined;
        givenName?: string | undefined;
        surname?: string | undefined;
      }
) => {
  if (nameData && 'id' in nameData) {
    return getInitialsOfNameAttribute(nameData);
  }

  if (nameData?.displayName) {
    return nameData.displayName
      .split(' ')
      .map((part) => part[0] ?? '')
      .join('');
  }

  if (nameData?.givenName || nameData?.surname) {
    return ((nameData.givenName?.[0] ?? '') + (nameData.surname?.[0] ?? '') + '') as string;
  }

  return domain ? getTwoLettersFromDomain(domain) : '';
};

interface FallbackImgProps {
  odinId: string | undefined;
  nameData?:
    | Attribute
    | {
        displayName?: string | undefined;
        givenName?: string | undefined;
        surname?: string | undefined;
      };
  style?: ViewStyle;
}

export const FallbackImg = ({ odinId, nameData, style }: FallbackImgProps) => {
  const backgroundColor = odinId ? getOdinIdColor(odinId).lightTheme : '#000000';
  const initials = getInitials(odinId, nameData);
  const fallbackSvg = `data:image/svg+xml;base64,${fallbackProfileImage(initials, backgroundColor)}`;

  return (
    <View style={[styles.container, style]}>
      <SvgUri uri={fallbackSvg} width="100%" height="100%" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});
