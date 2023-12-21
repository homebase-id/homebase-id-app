import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Button,
  View,
  Linking,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '../components/ui/Text/Text';
import { AuthStackParamList } from '../app/App';
import { useYouAuthAuthorization } from '../hooks/auth/useAuth';
import { Container } from '../components/ui/Container/Container';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { Colors } from '../app/Colors';
import { stringifyToQueryParams } from '@youfoundation/js-lib/helpers';
import { doCheckIdentity } from '../hooks/checkIdentity/useCheckIdentity';
import { CheckForUpdates, VersionInfo } from './profile-page';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

import logo from './homebase-feed.png';
import { YouAuthorizationParams } from '@youfoundation/js-lib/auth';
import { Input } from '../components/ui/Form/Input';

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginPage = (_props: LoginProps) => {
  return (
    <SafeAreaView>
      <Container style={{ flex: 1, flexDirection: 'column' }}>
        <View
          style={{
            padding: 20,
            alignItems: 'center',
            gap: 10,
            minHeight: 120,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Image source={logo} style={{ width: 40, height: 40 }} />
          <Text style={{ fontSize: 25 }}>Homebase Feed</Text>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 15,
            marginTop: 'auto',
          }}
        >
          <LoginComponent />
        </View>

        <View
          style={{
            padding: 20,
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: 120,
          }}
        >
          <VersionInfo />
          <CheckForUpdates
            hideIcon={true}
            style={{
              alignItems: 'center',
              paddingBottom: 12,
            }}
          />
        </View>
      </Container>
    </SafeAreaView>
  );
};

const FINALIZE_PATH = 'homebase-feed://auth/finalize/';
const useFinalize = () => {
  const [state, setState] = useState<'preparing' | 'loading' | 'success' | 'error' | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUrlAsync = async () => {
      setState('preparing');
      // Get the deep link used to open the app
      const initialUrl = await Linking.getInitialURL();
      setUrl(initialUrl);
      if (!initialUrl) setState(null);
      setState(null);
    };

    getUrlAsync();

    Linking.addEventListener('url', ({ url }) => setUrl(url));
  }, []);

  const { finalizeAuthentication } = useYouAuthAuthorization();

  useEffect(() => {
    // Finalize
    (async () => {
      if (state === 'preparing' || state === 'success' || state === 'loading') return;
      try {
        if (url?.startsWith(FINALIZE_PATH)) {
          setState('loading');

          const dataParams = url?.split(FINALIZE_PATH)[1];
          const params = new URLSearchParams(dataParams);

          const identity = params.get('identity');
          const public_key = params.get('public_key');
          const salt = params.get('salt');

          if (!identity || !public_key || !salt) return;
          await finalizeAuthentication(identity, public_key, salt);

          setState('success');
        }
      } catch (e) {
        setState('error');
        setUrl(null);
      }
    })();
  }, [url, finalizeAuthentication, state]);

  return state;
};

const useParams = () => {
  const [params, setParams] = useState<YouAuthorizationParams | null>(null);
  const { getRegistrationParams } = useYouAuthAuthorization();

  useEffect(() => {
    (async () => {
      if (params) return;
      setParams(await getRegistrationParams());
    })();
  }, [getRegistrationParams, params]);

  return { data: params };
};

const LoginComponent = () => {
  // LoginPage is the only page where you can be when unauthenticated; So only page where we listen for a finalize return link
  const finalizeState = useFinalize();

  const [invalid, setInvalid] = useState<boolean>(false);
  const [odinId, setOdinId] = useState<string>('');
  const { data: authParams } = useParams();

  useEffect(() => setInvalid(false), [odinId]);

  const onLogin = async () => {
    if (!odinId) {
      setInvalid(true);
      return;
    }

    const identityReachable = await doCheckIdentity(odinId);
    if (!identityReachable) {
      setInvalid(true);
      return;
    }

    const url = `https://${odinId}/api/owner/v1/youauth/authorize?${stringifyToQueryParams(
      authParams as any
    )}`;
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.openAuth(url, '', {
        enableUrlBarHiding: false,
        enableDefaultShare: false,
        forceCloseOnRedirection: true,
        // Specify full animation resource identifier(package:anim/name)
        // or only resource name(in case of animation bundled with app).
        animations: {
          startEnter: 'slide_in_right',
          startExit: 'slide_out_left',
          endEnter: 'slide_in_left',
          endExit: 'slide_out_right',
        },
      });

      if (result.type === 'success' && result.url) Linking.openURL(result.url);
    } else await Linking.openURL(url);
  };

  if (finalizeState === 'loading' || finalizeState === 'preparing') return <ActivityIndicator />;

  return (
    <>
      <Text style={{ fontSize: 18 }}>Your Homebase id</Text>
      <Input
        placeholder="Homebase id"
        style={{
          height: 40,
        }}
        onChangeText={setOdinId}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={onLogin}
      />

      {invalid ? <Text style={{ color: Colors.red[500] }}>Invalid homebase id</Text> : null}

      {finalizeState === 'error' ? (
        <Text style={{ color: Colors.red[500] }}>Something went wrong, please try again</Text>
      ) : null}

      <Button title="Login" disabled={!odinId} onPress={onLogin} />

      <View
        style={{
          flexDirection: 'row',
          marginTop: 12,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Don't have an account yet?",
              'Your account is much more than just this app. You own your account. Find out more about Homebase and create your account.',
              [
                {
                  text: 'Homebase.id',
                  onPress: async () => {
                    if (await InAppBrowser.isAvailable()) {
                      await InAppBrowser.open('https://homebase.id', {
                        enableUrlBarHiding: false,
                        enableDefaultShare: false,
                      });
                    } else Linking.openURL('https://homebase.id');
                  },
                },
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel',
                },
              ]
            );
          }}
        >
          <Text style={{ textDecorationLine: 'underline' }}>Don't have an account?</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default LoginPage;
