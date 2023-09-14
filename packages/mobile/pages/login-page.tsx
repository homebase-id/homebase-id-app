import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, TextInput, View, Linking } from 'react-native';
import { Text } from '../components/ui/Text/Text';
import { AuthStackParamList } from '../app/App';
import useAuth from 'rn-template-app/hooks/auth/useAuth';
import { Container } from '../components/ui/Container/Container';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { Colors } from '../app/Colors';
import { stringifyToQueryParams } from '@youfoundation/js-lib/helpers';

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const useFinalize = () => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUrlAsync = async () => {
      // Get the deep link used to open the app
      const initialUrl = await Linking.getInitialURL();
      setUrl(initialUrl);
    };

    getUrlAsync();

    Linking.addEventListener('url', ({ url }) => setUrl(url));
  }, []);

  const { finalizeAuthentication, canFinzalizeAuthentication } = useAuth();

  useEffect(() => {
    if (!canFinzalizeAuthentication) return;

    // Finalize
    (async () => {
      if (url?.startsWith('rn-template://auth/finalize/')) {
        const dataParams = url?.split('rn-template://auth/finalize/')[1];
        const params = new URLSearchParams(dataParams);

        const identity = params.get('identity');
        const public_key = params.get('public_key');
        const salt = params.get('salt');
        // const returnUrl = params.get('state');

        if (!identity || !public_key || !salt) return;
        await finalizeAuthentication(identity, public_key, salt);
      }
    })();
  }, [canFinzalizeAuthentication, url, finalizeAuthentication]);
};

const LoginPage = (_props: LoginProps) => {
  // LoginPage is the only page where you can be when unauthenticated; So only page where we listen for a finalize return link
  useFinalize();

  const [odinId, setOdinId] = useState<string>('');
  const { getRegistrationParams } = useAuth();

  const onLogin = useCallback(async () => {
    const params = await getRegistrationParams();

    stringifyToQueryParams(params as any);

    const url = `https://${
      odinId || ''
    }/api/owner/v1/youauth/authorize?${stringifyToQueryParams(params as any)}`;
    await Linking.openURL(url);
  }, [odinId, getRegistrationParams]);

  return (
    <SafeAreaView>
      <Container style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 15 }}>
          <Text style={{ fontSize: 18 }}>Homebase id</Text>
          <TextInput
            placeholder="Odin id"
            style={{
              height: 40,
              marginVertical: 12,
              borderWidth: 1,
              borderColor: Colors.slate[300],
              borderRadius: 4,
              padding: 10,
            }}
            onChangeText={setOdinId}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={onLogin}
          />
          <Button title="Login" disabled={!odinId} onPress={onLogin} />
        </View>
      </Container>
    </SafeAreaView>
  );
};

export default LoginPage;
