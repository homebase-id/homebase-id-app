import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { Container } from '../../components/ui/Container/Container';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import TextButton from '../../components/ui/Text/Text-Button';
import Toast from 'react-native-toast-message';
import { DoubleTapHeart } from '../../components/ui/DoubleTapHeart';
import { Image } from 'react-native';

type DebugProp = NativeStackScreenProps<ProfileStackParamList, 'Debug'>;

export const DebugPage = (_prop: DebugProp) => {
  return (
    <SafeAreaView>
      <Container
        style={{
          padding: 20,
          gap: 20,
        }}
      >
        <TextButton
          unFilledStyle={{
            padding: 12,
            marginHorizontal: 20,
            borderWidth: 1,
            alignItems: 'center',
            borderColor: 'green',
          }}
          onPress={() => {
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'This is some success toast',
              position: 'bottom',
              autoHide: false,
            });
          }}
          title="Send Success Toast"
        />
        <TextButton
          unFilledStyle={{
            padding: 12,
            marginHorizontal: 20,
            borderWidth: 1,
            alignItems: 'center',
            borderColor: 'red',
          }}
          onPress={() => {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Sample error',
              position: 'bottom',
              autoHide: false,
            });
          }}
          title="Send Error Toast"
        />
        <TextButton
          unFilledStyle={{
            padding: 12,
            marginHorizontal: 20,
            borderWidth: 1,
            alignItems: 'center',
            borderColor: 'cyan',
          }}
          onPress={() => {
            Toast.show({
              type: 'info',
              text1: 'Info',
              text2: 'Sample Info',
              position: 'bottom',
            });
          }}
          title="Send Info Toast"
        />
        <TextButton
          unFilledStyle={{
            padding: 12,
            marginHorizontal: 20,
            borderWidth: 1,
            alignItems: 'center',
            borderColor: 'yellow',
          }}
          onPress={() => {
            Toast.show({
              type: 'notification',
              text1: 'Bishwajeet Parhi ',
              text2: 'Sent you a message',
              position: 'top',
              autoHide: false,
              props: {
                odinId: 'bishwajeetparhi.dev',
              },
            });
          }}
          title="Send Notification Toast"
        />
        <DoubleTapHeart onDoubleTap={() => {}}>
          <Image
            height={250}
            resizeMode="cover"
            source={{
              uri: 'https://images.pexels.com/photos/28316692/pexels-photo-28316692/free-photo-of-a-forest-with-a-small-stream-and-trees.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            }}
          />
        </DoubleTapHeart>
      </Container>
    </SafeAreaView>
  );
};
