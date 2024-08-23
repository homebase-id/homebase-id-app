import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { Container } from '../../components/ui/Container/Container';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import TextButton from '../../components/ui/Text/Text-Button';
import Toast from 'react-native-toast-message';

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
          style={{
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
          style={{
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
          style={{
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
          style={{
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
      </Container>
    </SafeAreaView>
  );
};
