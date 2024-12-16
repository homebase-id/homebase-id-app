import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import QRCode from 'react-native-qrcode-svg';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { Dimensions, View } from 'react-native';
import { Text } from '../../components/ui/Text/Text';

type ConnectQrProps = NativeStackScreenProps<ProfileStackParamList, 'ConnectQr'>;

export const ConnectQrPage = (_props: ConnectQrProps) => {
  const identity = useDotYouClientContext().getLoggedInIdentity();
  return (
    <SafeAreaView>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <QRCode
          value={`https://anon.homebase.id/redirect/connections/${identity}/connect`}
          size={Dimensions.get('screen').width - 100}
          enableLinearGradient={true}
          linearGradient={['#C68CFF', '#8CD9FF']}
        />
        <Text style={{ marginTop: 10 }}>{t('Scan to connect')}</Text>
      </View>
    </SafeAreaView>
  );
};
