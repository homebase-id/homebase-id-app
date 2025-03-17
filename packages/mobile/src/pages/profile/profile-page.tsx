import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Share, TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/ui/Text/Text';
import { getVersion, getBuildNumber } from 'react-native-device-info';
import { version } from '../../../package.json';

import { ProfileStackParamList } from '../../app/ProfileStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';
import {
  AddressBook,
  ChatIcon,
  CheckCircle,
  Cog,
  Copy,
  Gear,
  Logout,
  People,
  RecycleBin,
  Sun,
  Trash,
} from '../../components/ui/Icons/icons';
import { useAuth } from '../../hooks/auth/useAuth';
import { openURL } from '../../utils/utils';
import { useAuthenticatedPushNotification } from '../../hooks/push-notification/useAuthenticatedPushNotification';

import { ProfileInfo } from '../../components/Profile/ProfileInfo';
import { t } from 'homebase-id-app-common';
import { addLogs, clearLogs, getLogs, shareLogs } from '../../provider/log/logger';
import Toast from 'react-native-toast-message';
import { ListTile } from '../../components/ui/ListTile';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Backdrop } from '../../components/ui/Modal/Backdrop';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { readFile } from 'react-native-fs';
import Clipboard from '@react-native-clipboard/clipboard';
import { useQueryClient } from '@tanstack/react-query';

type SettingsProps = NativeStackScreenProps<ProfileStackParamList, 'Overview'>;

export const ProfilePage = (_props: SettingsProps) => {
  const { logout, getIdentity } = useAuth();
  const { removeDeviceToken } = useAuthenticatedPushNotification();
  // const [notficationRegistering, setNotficationRegistering] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const doLogout = async () => {
    await removeDeviceToken();
    return logout();
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
          <ListTile
            title={t('Debug Logs')}
            icon={Gear}
            showLoader
            onPress={() => setModalVisible(true)}
          />
          <DeleteCache />
          <ListTile title={t('Delete my account')} icon={RecycleBin} onPress={onDeleteAccount} />
          {/* <ListTile
            title={t('Drive Status')}
            icon={HardDisk}
            onPress={() => navigate('DriveStatus')}
          />*/}
          {/*<ListTile title={t('Debug')} icon={Gear} onPress={() => navigate('Debug')} /> */}
          <VersionInfo />
        </ScrollView>
        <LogsModal visible={modalVisible} onDismiss={() => setModalVisible(false)} />
      </Container>
    </SafeAreaView>
  );
};

const getVersionInfo = async () => {
  const appVersion = `v${getVersion()} (${getBuildNumber()})`;
  return `${appVersion}`;
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

const LogsModal = ({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) => {
  const ref = useRef<BottomSheetModalMethods>(null);
  const { isDarkMode } = useDarkMode();
  useLayoutEffect(() => {
    if (visible) {
      requestAnimationFrame(() => ref.current?.present());
    }
  }, [visible]);

  const onShareLogs = async () => {
    const shareContent = await shareLogs();
    if (!shareContent) {
      Toast.show({
        type: 'info',
        text1: 'No Logs recorded',
        position: 'bottom',
      });
      return;
    }

    await Share.share(shareContent);

    ref.current?.dismiss();
    onDismiss();
  };

  const copyLogs = async () => {
    const path = await getLogs();
    if (!path) {
      Toast.show({
        type: 'info',
        text1: 'No Logs recorded',
        position: 'bottom',
      });
      return;
    }
    const fileData = await readFile(path);
    // convert fileData to array of strings. get the last 1000 lines
    const data = fileData.split('\n').slice(-1000).join('\n');
    Clipboard.setString(data);
    Toast.show({
      type: 'success',
      text1: 'Logs copied to clipboard',
      position: 'bottom',
    });
    ref.current?.dismiss();
    onDismiss();
  };

  const emptyLogs = async () => {
    await clearLogs();

    ref.current?.dismiss();
    onDismiss();
  };

  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={Backdrop}
      snapPoints={['20%']}
      enableDynamicSizing={true}
      enableDismissOnClose={true}
      enablePanDownToClose
      bottomInset={insets.bottom}
      onDismiss={onDismiss}
      backgroundStyle={{
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.white,
      }}
      handleIndicatorStyle={{
        backgroundColor: 'transparent',
      }}
      style={{
        zIndex: 20,
        elevation: 20,
      }}
    >
      <BottomSheetView
        style={{
          marginHorizontal: 16,
          paddingBottom: 20,
        }}
      >
        <ListTile
          style={{
            backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[200],
            paddingLeft: 16,
            borderTopStartRadius: 12,
            borderTopEndRadius: 12,
          }}
          title={t('Share logs')}
          icon={Gear}
          onPress={onShareLogs}
        />
        <ListTile
          style={{
            backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[200],
            borderTopColor: isDarkMode ? Colors.gray[900] : Colors.gray[300],
            borderTopWidth: 2,

            paddingLeft: 16,
            paddingRight: 16,
          }}
          title={t('Copy to Clipboard')}
          showLoader
          icon={Copy}
          onPress={copyLogs}
        />
        <ListTile
          style={{
            backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[200],
            borderTopColor: isDarkMode ? Colors.gray[900] : Colors.gray[300],
            borderTopWidth: 2,
            borderBottomLeftRadius: 12,
            borderEndEndRadius: 12,
            paddingLeft: 16,
            paddingRight: 16,
          }}
          title={t('Clear logs')}
          showLoader
          icon={Trash}
          onPress={emptyLogs}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

// Keeping it commented if needed in future
const DeleteCache = () => {
  const query = useQueryClient();
  const [done, setDone] = useState(false);
  const doDeleteCache = async () => {
    query.removeQueries({
      queryKey: ['chat-messages'],
      exact: false,
    });
    query.removeQueries({
      queryKey: ['conversations'],
      exact: false,
    });
    query.removeQueries({
      queryKey: ['contacts'],
      exact: false,
    });
    query.removeQueries({
      queryKey: ['image'],
      exact: false,
    });
    setDone(true);
    const cache = query.getQueryCache().findAll();
    const validQueries = cache.filter((query) => query.state.data !== undefined);
    const validQueryKeys = validQueries.map((query) => query.queryKey);
    const jsonData = validQueryKeys.map((query) => {
      return {
        key: query,
      };
    });
    addLogs({
      message: 'Cache cleared. Leftover cache data',
      type: 'info',
      title: 'Cache',
      details: {
        title: 'Cache keys left',
        stackTrace: JSON.stringify(jsonData),
      },
    });
    setTimeout(() => {
      setDone(false);
    }, 5000);
  };
  return (
    <TouchableOpacity
      onPress={doDeleteCache}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        width: '100%',
      }}
    >
      <Cog size={'lg'} />
      <Text
        style={{
          marginLeft: 16,
        }}
      >
        Delete Cache
      </Text>
      {done ? (
        <View style={{ marginLeft: 'auto' }}>
          <CheckCircle />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};
