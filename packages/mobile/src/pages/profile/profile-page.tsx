import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Text } from '../../components/ui/Text/Text';
import { getVersion, getBuildNumber } from 'react-native-device-info';
import { version } from '../../../package.json';

import { ProfileStackParamList } from '../../app/ProfileStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';
import {
  AddressBook,
  ChatIcon,
  Download,
  Gear,
  Logout,
  People,
  RecycleBin,
  Sun,
} from '../../components/ui/Icons/icons';
import codePush from 'react-native-code-push';
import { useAuth } from '../../hooks/auth/useAuth';
import { openURL } from '../../utils/utils';
import { useAuthenticatedPushNotification } from '../../hooks/push-notification/useAuthenticatedPushNotification';

import { ProfileInfo } from '../../components/Profile/ProfileInfo';
import { t } from 'homebase-id-app-common';
import { getLogs } from '../../provider/log/logger';
import Toast from 'react-native-toast-message';
import { ListTile } from '../../components/ui/ListTile';

type SettingsProps = NativeStackScreenProps<ProfileStackParamList, 'Overview'>;

export const ProfilePage = (_props: SettingsProps) => {
  const { logout, getIdentity } = useAuth();
  const { removeDeviceToken } = useAuthenticatedPushNotification();
  // const [notficationRegistering, setNotficationRegistering] = useState(false);

  const doLogout = async () => {
    await removeDeviceToken();
    return logout();
  };

  const onShareLogs = async () => {
    const path = await getLogs();
    if (!path) {
      Toast.show({
        type: 'info',
        text1: 'No Logs recorded',
        position: 'bottom',
      });
      return;
    }
    Share.share({
      url: path,
    });
  };

  const onDeleteAccount = async () => {
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
  };

  const navigate = (target: keyof ProfileStackParamList) => _props.navigation.navigate(target);
  return (
    <SafeAreaView>
      <Container>
        <ScrollView
          style={{ display: 'flex', flexDirection: 'column', paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <ProfileInfo />
          <ListTile title={t('Followers')} icon={People} onPress={() => navigate('Followers')} />
          <ListTile title={t('Following')} icon={People} onPress={() => navigate('Following')} />
          <ListTile
            title={t('Connection requests')}
            icon={AddressBook}
            onPress={() => navigate('ConnectionRequests')}
          />
          <ListTile
            title={t('My connections')}
            icon={AddressBook}
            onPress={() => navigate('Connections')}
          />
          <ListTile title={t('Appearance')} icon={Sun} onPress={() => navigate('Appearance')} />
          <ListTile
            title={t('Chat Settings')}
            icon={ChatIcon}
            onPress={() => navigate('ChatSettings')}
          />
          {/* <TouchableOpacity
            onPress={() => doReregisterNotifcation()}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <Bell size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}
            >
              Re Register Push Notifications
            </Text>
            {notficationRegistering ? <ActivityIndicator style={{ marginLeft: 'auto' }} /> : null}
          </TouchableOpacity> */}
          <ListTile title={t('Logout')} icon={Logout} onPress={doLogout} showLoader />
          <ListTile title={t('Share Debug Logs')} icon={Gear} showLoader onPress={onShareLogs} />
          <ListTile title={t('Delete my account')} icon={RecycleBin} onPress={onDeleteAccount} />
          <CheckForUpdates
            style={{
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}
          />
          {/* <ListTile
            title={t('Drive Status')}
            icon={HardDisk}
            onPress={() => navigate('DriveStatus')}
          />*/}
          {/*<ListTile title={t('Debug')} icon={Gear} onPress={() => navigate('Debug')} /> */}
          <VersionInfo />
        </ScrollView>
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
      style={[
        {
          display: 'flex',
          flexDirection: 'row',
          gap: 5,
        },
        style,
      ]}
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

// Keeping it commented if needed in future
// const DeleteCache = () => {
//   const query = useQueryClient();
//   const [done, setDone] = useState(false);
//   const doDeleteCache = async () => {
//     query.removeQueries({
//       queryKey: ['chat-messages'],
//       exact: false,
//     });
//     query.removeQueries({
//       queryKey: ['conversations'],
//       exact: false,
//     });
//     query.removeQueries({
//       queryKey: ['contacts'],
//       exact: false,
//     });
//     setDone(true);
//     setTimeout(() => {
//       setDone(false);
//     }, 5000);
//   };
//   return (
//     <TouchableOpacity
//       onPress={doDeleteCache}
//       style={{
//         display: 'flex',
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: 12,
//         width: '100%',
//       }}
//     >
//       <Cog size={'lg'} />
//       <Text
//         style={{
//           marginLeft: 16,
//         }}
//       >
//         Delete Cache
//       </Text>
//       {done ? (
//         <View style={{ marginLeft: 'auto' }}>
//           <CheckCircle />
//         </View>
//       ) : null}
//     </TouchableOpacity>
//   );
// };
