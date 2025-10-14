import { stringifyToQueryParams } from '@homebase-id/js-lib/helpers';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { AuthStackParamList } from '../../app/App';
import { Colors } from '../../app/Colors';
import { Container } from '../../components/ui/Container/Container';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Text } from '../../components/ui/Text/Text';
import { useAuth, useYouAuthAuthorization } from '../../hooks/auth/useAuth';
import { doCheckIdentity } from '../../hooks/checkIdentity/useCheckIdentity';
import { VersionInfo } from '../profile/profile-page';

import { YouAuthorizationParams } from '@homebase-id/js-lib/auth';
import { t } from 'homebase-id-app-common';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import logo from '../../assets/homebase.png';
import { PublicAvatar } from '../../components/ui/Avatars/Avatar';
import { Divider } from '../../components/ui/Divider';
import { Input } from '../../components/ui/Form/Input';
import { AuthorName } from '../../components/ui/Name';
import TextButton from '../../components/ui/Text/Text-Button';
import { useDarkMode } from '../../hooks/useDarkMode';
import { cleanDomainString, cleanInteractiveDomainString } from '../../utils/utils';

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginPage = (_props: LoginProps) => {
  return (
    <SafeAreaView>
      <Container style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={{ height: Math.max(0, Dimensions.get('window').height / 3 - 40) }} />
          <Image source={logo} style={styles.logo} />
          <Text style={styles.logoText}>Homebase</Text>
        </View>
        <Animated.View
          style={[
            styles.formContainer,
            { marginTop: Math.max(0, Dimensions.get('window').height / 6 - 82) },
          ]}
        >
          <LoginComponent />
        </Animated.View>

        <View style={styles.footer}>
          <VersionInfo />
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
    const modifiedText = cleanInteractiveDomainString(text);
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
    // Determine the final domain: use odinId if provided, otherwise fall back to lastIdentity
    const finalDomain = odinId ? cleanDomainString(odinId) : lastIdentity;

    if (!finalDomain) {
      setInvalid(true);
      return;
    }

    setOdinId(finalDomain);

    const identityReachable = await doCheckIdentity(finalDomain);
    if (!identityReachable) {
      setInvalid(true);
      return;
    }

    const url = `https://${finalDomain}/api/owner/v1/youauth/authorize?${stringifyToQueryParams(
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
      <Text style={styles.label}>Your Homebase id</Text>
      <Input
        placeholder="Homebase id"
        style={{ fontSize: Platform.OS === 'ios' ? 16 : 14 }}
        value={odinId}
        onChangeText={onChangeOdinId}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={onLogin}
      />

      {invalid ? (
        <Animated.Text entering={FadeIn} style={styles.errorText}>
          {t('Invalid homebase id')}
        </Animated.Text>
      ) : null}

      {finalizeState === 'error' ? (
        <Text style={styles.errorText}>{t('Something went wrong, please try again')}</Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <TextButton
          title="Login"
          onPress={onLogin}
          showLoaderOnPress={true}
          filled={true}
          lightColor={Colors.indigo[400]}
          darkColor={Colors.indigo[800]}
          underlayColor={isDarkMode ? Colors.indigo[900] : Colors.indigo[300]}
          disabled={!odinId}
          filledStyle={styles.loginButtonFilled}
          textStyle={styles.loginButtonText}
        />
      </View>
      {lastIdentity && !odinId && (
        <Animated.View style={styles.dividerContainer} layout={LinearTransition} exiting={FadeOut}>
          <Divider text="OR" />
          <TouchableOpacity
            onPress={onLogin}
            style={[
              styles.continueAsButton,
              { backgroundColor: isDarkMode ? Colors.indigo[700] : Colors.indigo[100] },
            ]}
          >
            <View style={styles.continueAsRow}>
              <PublicAvatar odinId={lastIdentity} style={styles.continueAsAvatar} />
              <Text style={styles.continueAsText}>
                Continue as {<AuthorName odinId={lastIdentity} />}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.signUpContainer}>
        <TouchableOpacity onPress={showSignUpAlert}>
          <Text style={styles.signUpLink}>Don&apos;t have an account?</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  logoContainer: {
    minHeight: 120,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
    top: 60,
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 25,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  footer: {
    padding: 20,
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 120,
  },
  label: {
    fontSize: 18,
  },
  errorText: {
    color: Colors.red[500],
    marginBottom: 4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  loginButtonFilled: {
    marginVertical: 8,
  },
  loginButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  dividerContainer: {
    marginTop: 24,
    marginBottom: 4,
  },
  continueAsButton: {
    flexShrink: 1,
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  continueAsRow: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    padding: 8,
  },
  continueAsAvatar: {
    width: 30,
    height: 30,
  },
  continueAsText: {
    textAlign: 'center',
    fontSize: 16,
    marginLeft: 8,
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  signUpLink: {
    textDecorationLine: 'underline',
    fontSize: 14,
    lineHeight: 24,
  },
});
