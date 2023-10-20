import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Button, TextInput, View, Linking } from 'react-native';
import { Text } from '../components/ui/Text/Text';
import { AuthStackParamList } from '../app/App';
import useAuth from '../hooks/auth/useAuth';
import { Container } from '../components/ui/Container/Container';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { Colors } from '../app/Colors';
import { stringifyToQueryParams } from '@youfoundation/js-lib/helpers';
import { useCheckIdentity } from '../hooks/checkIdentity/useCheckIdentity';
import { useQuery } from '@tanstack/react-query';

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
      if (url?.startsWith('homebase-feed://auth/finalize/')) {
        const dataParams = url?.split('homebase-feed://auth/finalize/')[1];
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

const useParams = () => {
  const { getRegistrationParams } = useAuth();
  return useQuery(['params'], () => getRegistrationParams(), {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

const LoginPage = (_props: LoginProps) => {
  // LoginPage is the only page where you can be when unauthenticated; So only page where we listen for a finalize return link
  useFinalize();

  const [invalid, setInvalid] = useState<boolean>(true);
  const [odinId, setOdinId] = useState<string>('');
  const { data: authParams } = useParams();

  const { data: isValid, refetch: refreshValidCheck } =
    useCheckIdentity(odinId);

  useEffect(() => {
    setInvalid(false);
  }, [odinId]);

  const onLogin = async () => {
    if (!isValid) {
      setInvalid(true);
      refreshValidCheck();
      return;
    }

    const url = `https://${
      odinId || ''
    }/api/owner/v1/youauth/authorize?${stringifyToQueryParams(
      authParams as any,
    )}`;
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView>
      <Container style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 15 }}>
          <Text style={{ fontSize: 18 }}>Homebase id</Text>
          <TextInput
            placeholder="Homebase id"
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
          {invalid ? (
            <Text style={{ color: Colors.red[500] }}>Invalid homebase id</Text>
          ) : null}
          <Button title="Login" disabled={!odinId} onPress={onLogin} />
        </View>
      </Container>
    </SafeAreaView>
  );
};

export default LoginPage;
