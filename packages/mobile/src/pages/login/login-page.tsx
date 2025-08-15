import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Linking,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '../../components/ui/Text/Text';
import { AuthStackParamList } from '../../app/App';
import { useAuth, useYouAuthAuthorization } from '../../hooks/auth/useAuth';
import { Container } from '../../components/ui/Container/Container';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Colors } from '../../app/Colors';
import { stringifyToQueryParams } from '@homebase-id/js-lib/helpers';
import { doCheckIdentity } from '../../hooks/checkIdentity/useCheckIdentity';
import { VersionInfo } from '../profile/profile-page';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

import logo from '../../assets/homebase.png';
import { Input } from '../../components/ui/Form/Input';
import { YouAuthorizationParams } from '@homebase-id/js-lib/auth';
import { AuthorName } from '../../components/ui/Name';
import { PublicAvatar } from '../../components/ui/Avatars/Avatar';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Divider } from '../../components/ui/Divider';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import TextButton from '../../components/ui/Text/Text-Button';
import { t } from 'homebase-id-app-common';
import { cleanDomainString } from '../../utils/utils';

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginPage = (_props: LoginProps) => {
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
          <Text style={{ fontSize: 25 }}>Homebase</Text>
        </View>
        <Animated.View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 15,
            marginTop: 'auto',
          }}
        >
          <LoginComponent />
        </Animated.View>

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
          {/* <CheckForUpdates
            hideIcon={true}
            style={{
              alignItems: 'center',
              paddingBottom: 12,
            }}
          /> */}
        </View>
      </Container>
    </SafeAreaView>
  );
};

const FINALIZE_PATH = 'homebase-fchat://auth/finalize/';
const useFinalize = () => {
  const [state, setState] = useState<'preparing' | 'loading' | 'success' | 'error' | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Get the deep link used to open the app
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        setUrl(initialUrl);
        setState('preparing');
      }
    })();

    Linking.addEventListener('url', ({ url }) => setUrl(url));
  }, []);

  useEffect(() => {
    // State is only reset when the url is updated; If it failed last time.. it will still fail
    setState(null);
  }, [url]);

  const { finalizeAuthentication } = useYouAuthAuthorization();

  useEffect(() => {
    // Finalize
    (async () => {
      if (
        state === 'error' ||
        state === 'preparing' ||
        state === 'success' ||
        state === 'loading'
      ) {
        return;
      }
      try {
        if (url?.startsWith(FINALIZE_PATH)) {
          setState('loading');

          const dataParams = url?.split(FINALIZE_PATH)[1];
          const params = new URLSearchParams(dataParams);

          const error = params.get('error');
          if (error) {
            setState(null);
            return;
          }
          const identity = params.get('identity');
          const public_key = params.get('public_key');
          const salt = params.get('salt');

          if (!identity || !public_key || !salt) return;
          const success = await finalizeAuthentication(identity, public_key, salt);
          setState(success ? 'success' : 'error');
        }
      } catch (e) {
        console.error('Failed to finalize the authorization flow', e);
        setState('error');
        setUrl(null);
      }
    })();
  }, [url, state, finalizeAuthentication]);

  return state;
};

const useParams = () => {
  const { getRegistrationParams } = useYouAuthAuthorization();

  const [params, setParams] = useState<YouAuthorizationParams | null>(null);
  useEffect(() => {
    (async () => setParams(await getRegistrationParams()))();
  }, [getRegistrationParams]);

  const refetch = useCallback(() => {
    (async () => setParams(await getRegistrationParams()))();
  }, [getRegistrationParams]);

  return {
    data: params,
    refetch,
  };
};

const LoginComponent = () => {
  // LoginPage is the only page where you can be when unauthenticated; So only page where we listen for a finalize return link
  const finalizeState = useFinalize();

  const [invalid, setInvalid] = useState<boolean>(false);
  const [odinId, setOdinId] = useState<string>('');

  const onChangeOdinId = useCallback((text: string) => {
    const modifiedText = cleanDomainString(text);
    setOdinId(modifiedText);
  }, []);

  const { data: authParams, refetch } = useParams();
  const lastIdentity = useAuth().getLastIdentity();
  const { isDarkMode } = useDarkMode();
  useEffect(() => {
    if (finalizeState === 'error') {
      refetch();
    }
  }, [finalizeState, refetch]);

  useEffect(() => setInvalid(false), [odinId]);

  const onLogin = useCallback(async () => {
    if (!odinId && !lastIdentity) {
      setInvalid(true);
      return;
    }

    const identityReachable = await doCheckIdentity(odinId || (lastIdentity as string));
    if (!identityReachable) {
      setInvalid(true);
      return;
    }

    const url = `https://${odinId || lastIdentity}/api/owner/v1/youauth/authorize?${stringifyToQueryParams(
      authParams as unknown
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
  }, [authParams, lastIdentity, odinId]);

  const showSignUpAlert = useCallback(() => {
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
  }, []);

  if (finalizeState === 'loading' || finalizeState === 'preparing') return <ActivityIndicator />;

  return (
    <>
      <Text style={{ fontSize: 18 }}>Your Homebase id</Text>
      <Input
        placeholder="Homebase id"
        style={{
          // height: 40,
          fontSize: Platform.OS === 'ios' ? 16 : 14,
          // marginBottom: 16,
        }}
        onChangeText={onChangeOdinId}
        value={odinId}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={onLogin}
      />

      {invalid ? (
        <Animated.Text entering={FadeIn} style={{ color: Colors.red[500], marginBottom: 4 }}>
          {t('Invalid homebase id')}
        </Animated.Text>
      ) : null}

      {finalizeState === 'error' ? (
        <Text style={{ color: Colors.red[500], marginBottom: 4 }}>
          {t('Something went wrong, please try again')}
        </Text>
      ) : null}

      <View
        style={{
          alignItems: 'center',
        }}
      >
        <TextButton
          title="Login"
          onPress={onLogin}
          showLoaderOnPress={true}
          filled={true}
          lightColor={Colors.indigo[400]}
          darkColor={Colors.indigo[800]}
          underlayColor={isDarkMode ? Colors.indigo[900] : Colors.indigo[300]}
          disabled={!odinId}
          filledStyle={{
            marginVertical: 8,
          }}
          textStyle={{
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '600',
            color: Colors.white,
          }}
        />
      </View>
      {lastIdentity && !odinId && (
        <Animated.View
          style={{
            marginTop: 24,
            marginBottom: 4,
          }}
          layout={LinearTransition}
          exiting={FadeOut}
        >
          {/* Render -----OR----- */}
          <Divider text="OR" />
          <TouchableOpacity
            onPress={onLogin}
            style={{
              flexShrink: 1,
              backgroundColor: isDarkMode ? Colors.indigo[700] : Colors.indigo[100],
              marginLeft: 'auto',
              marginRight: 'auto',
              borderRadius: 10,
              paddingHorizontal: 8,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                flexShrink: 1,
                alignItems: 'center',
                padding: 8,
              }}
            >
              <PublicAvatar odinId={lastIdentity} style={{ width: 30, height: 30 }} />
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                Continue as {<AuthorName odinId={lastIdentity} />}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View
        style={{
          flexDirection: 'row',
          marginTop: 12,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <TouchableOpacity onPress={showSignUpAlert}>
          <Text style={{ textDecorationLine: 'underline', fontSize: 14, lineHeight: 24 }}>
            Don&apos;t have an account?
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};
