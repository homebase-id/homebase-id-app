import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from '../../components/ui/Text/Text';
import { getVersion, getBuildNumber } from 'react-native-device-info';
import { version } from '../../../package.json';

import { ProfileStackParamList } from '../../app/App';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';
import {
  AddressBook,
  Download,
  People,
  Profile,
  RecycleBin,
} from '../../components/ui/Icons/icons';
import codePush from 'react-native-code-push';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { BuiltInProfiles, GetTargetDriveFromProfileId } from '@youfoundation/js-lib/profile';
import { useProfile } from '../../hooks/profile/useProfile';
import { useDarkMode } from '../../hooks/useDarkMode';
import { openURL } from '../../utils/utils';

type SettingsProps = NativeStackScreenProps<ProfileStackParamList, 'Overview'>;

export const ProfilePage = (_props: SettingsProps) => {
  const { isDarkMode } = useDarkMode();
  const { logout, getIdentity } = useAuth();
  const [logoutPending, setLogoutPending] = useState(false);

  const { data: profile } = useProfile();

  const doLogout = async () => {
    setLogoutPending(true);
    logout();
  };

  const navigate = (target: keyof ProfileStackParamList) => _props.navigation.navigate(target);
  return (
    <SafeAreaView>
      <Container>
        <View style={{ display: 'flex', flexDirection: 'column', paddingVertical: 12 }}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: isDarkMode ? Colors.slate[700] : Colors.slate[200],
              width: '100%',
              height: 200,
            }}
          >
            <OdinImage
              fit="cover"
              targetDrive={GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId)}
              fileId={profile?.profileImageFileId}
              fileKey={profile?.profileImageFileKey}
              imageSize={{ width: 160, height: 160 }}
              style={{ borderRadius: 160 / 2 }}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 8,
                paddingTop: 4,
              }}
            >
              {profile?.firstName || profile?.surName
                ? `${profile.firstName} ${profile.surName}`
                : getIdentity()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigate('Followers')}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}
          >
            <People size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}
            >
              My followers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigate('Following')}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}
          >
            <People size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}
            >
              Who I&apos;m folowing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigate('ConnectionRequests')}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}
          >
            <AddressBook size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}
            >
              Connection requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigate('Connections')}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}
          >
            <AddressBook size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}
            >
              My connections
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => doLogout()}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <Profile size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}
            >
              Logout
            </Text>
            {logoutPending ? <ActivityIndicator style={{ marginLeft: 'auto' }} /> : null}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Delete your account?',
                'Your account is much more than only this app. If you want to remove your account, you can do so by going to your owner console, and requesting account deletion from there.',
                [
                  {
                    text: 'Open owner console',
                    onPress: async () => {
                      openURL(`https://${getIdentity()}/owner/settings/delete`);
                    },
                    style: 'destructive',
                  },
                  {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                  },
                ]
              );
            }}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}
          >
            <RecycleBin size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}
            >
              Delete my account
            </Text>
          </TouchableOpacity>
          <CheckForUpdates
            style={{
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}
          />
          <VersionInfo />
        </View>
      </Container>
    </SafeAreaView>
  );
};

const getVersionInfo = async () => {
  const appVersion = `v${getVersion()} (${getBuildNumber()})`;
  const update = await codePush.getUpdateMetadata();

  if (!update) return `${appVersion}`;

  const label = update.label.substring(1);
  return `${appVersion} rev.${label}`;
};

export const VersionInfo = () => {
  const [fullVersion, setFullVersion] = useState<string | undefined>(undefined);

  const doLoadFullVersion = async () => {
    const fullVersion = await getVersionInfo();
    setFullVersion(fullVersion);
  };

  return (
    <TouchableOpacity onPress={doLoadFullVersion}>
      <Text style={{ paddingTop: 10 }}>{fullVersion || version}</Text>
    </TouchableOpacity>
  );
};

export const CheckForUpdates = ({
  style,
  hideIcon,
}: {
  style: StyleProp<ViewStyle>;
  hideIcon?: boolean;
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [codePushResult, setCodePushResult] = useState<codePush.SyncStatus>();
  const doCheckForUpdate = async () => {
    setIsSyncing(true);
    const state = await codePush.sync({
      updateDialog: {
        title: 'You have an update',
        optionalUpdateMessage: 'There is an update available. Do you want to install?',
        optionalIgnoreButtonLabel: 'No',
        optionalInstallButtonLabel: 'Yes',
      },
      installMode: codePush.InstallMode.IMMEDIATE,
    });
    setCodePushResult(state);
    setIsSyncing(false);
  };

  return (
    <TouchableOpacity
      onPress={() => doCheckForUpdate()}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 5,
        ...(style as any),
      }}
    >
      {hideIcon ? null : <Download size={'lg'} />}
      <Text
        style={{
          marginLeft: hideIcon ? 0 : 11,
        }}
      >
        Check for app updates
      </Text>
      {isSyncing ? (
        <ActivityIndicator size="small" color="#000" style={{ marginLeft: 'auto' }} />
      ) : codePushResult !== undefined ? (
        <Text style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
          {codePushResult === codePush.SyncStatus.UP_TO_DATE
            ? 'Up to date'
            : codePushResult === codePush.SyncStatus.UPDATE_INSTALLED
              ? 'Installed'
              : codePushResult === codePush.SyncStatus.SYNC_IN_PROGRESS
                ? 'Unknown'
                : null}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};
