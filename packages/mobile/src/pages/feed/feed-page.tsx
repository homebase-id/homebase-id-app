import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ReactElement, memo, useEffect, useMemo, useRef, useState } from 'react';

import { TabStackParamList } from '../../app/App';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { stringGuidsEqual, uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';
import {
  RefreshControl,
  StyleProp,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ScrollView } from 'react-native-gesture-handler';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { FEED_APP_ID } from '../../app/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GetTargetDriveFromProfileId, BuiltInProfiles } from '@youfoundation/js-lib/profile';
import {
  ArrowDown,
  Bars,
  Ellipsis,
  IconProps,
  Lock,
  Lol,
  OpenLock,
  Plus,
} from '../../components/ui/Icons/icons';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { useProfile } from '../../hooks/profile/useProfile';
import {
  AccessControlList,
  HomebaseFile,
  NewHomebaseFile,
  NewMediaFile,
  SecurityGroupType,
} from '@youfoundation/js-lib/core';
import { BlogConfig, ChannelDefinition, ReactAccess } from '@youfoundation/js-lib/public';
import { useChannels } from '../../hooks/feed/channels/useChannels';
import React from 'react';
import { useCircles } from '../../hooks/circles/useCircles';
import { ellipsisAtMaxChar, t } from 'feed-app-common';
import { usePostComposer } from '../../hooks/feed/post/usePostComposer';
import { ErrorNotification } from '../../components/ui/Alert/ErrorNotification';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

export const FeedPage = memo((_props: FeedProps) => {
  const { isDarkMode } = useDarkMode();
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();

  const [hideHeader, setHideHeader] = useState<boolean>();

  useRemoveNotifications({ appId: FEED_APP_ID });

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret ? uint8ArrayToBase64(sharedSecret) : '';

  const uri = useMemo(() => `https://${identity}/apps/feed`, [identity]);
  const originWhitelist = useMemo(() => [`https://${identity}`], [identity]);

  // const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta);
  // @2002Bishwajeet: this ☝️ ain't right.. It breaks the injected_javascript fully (I assume as the JS is set to load before the content);
  //  To be honest Not sure if we want it, and if we do, it should be part of the feed-app itself, enabling it based on the "client_type" key in the localStorage

  const INJECTED_JAVASCRIPT = useMemo(() => {
    return `(function() {
        const APP_SHARED_SECRET_KEY = 'APPS_feed';
        const APP_AUTH_TOKEN_KEY = 'BX0900_feed';
        const IDENTITY_KEY = 'identity';
        const APP_CLIENT_TYPE_KEY = 'client_type';
        const PREFERS_DARK_MODE = 'prefersDark'

        const APP_SHARED_SECRET = '${base64SharedSecret}';
        const APP_AUTH_TOKEN = '${authToken}';
        const IDENTITY = '${identity}';
        const APP_CLIENT_TYPE = 'react-native';

        window.localStorage.setItem(APP_SHARED_SECRET_KEY, APP_SHARED_SECRET);
        window.localStorage.setItem(APP_AUTH_TOKEN_KEY, APP_AUTH_TOKEN);
        window.localStorage.setItem(IDENTITY_KEY, IDENTITY);
        window.localStorage.setItem(APP_CLIENT_TYPE_KEY, APP_CLIENT_TYPE);
        window.localStorage.setItem(PREFERS_DARK_MODE, '${isDarkMode ? '1' : '0'}');
      })();`;
  }, [authToken, base64SharedSecret, identity, isDarkMode]);

  const [refreshing, setRefreshing] = useState(false);
  const [refresherEnabled, setEnableRefresher] = useState(true);
  const webviewRef = useRef<WebView>(null);

  //Code to get scroll position
  const handleScroll = (event: any) => {
    const yOffset = Number(event.nativeEvent.contentOffset.y);
    if (yOffset === 0) {
      setEnableRefresher(true);
    } else if (refresherEnabled) {
      setEnableRefresher(false);
    }

    if (yOffset > 20) setHideHeader(true);
    else setHideHeader(false);
  };

  return (
    <SafeAreaView>
      {hideHeader ? null : <PostComposer />}
      {identity && uri ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              enabled={refresherEnabled}
              onRefresh={() => webviewRef.current?.reload()}
            />
          }
        >
          <WebView
            ref={webviewRef}
            source={{ uri }}
            injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
            pullToRefreshEnabled={true}
            containerStyle={{
              paddingTop: 0,
            }}
            style={{ backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50] }}
            originWhitelist={originWhitelist} // Keeps the WebView from navigating away from the feed-app; Any links that don't match will be opened by the system.. Eg: open in the browser
            // onMessage={(event) => console.warn(event)}
            onScroll={handleScroll}
            onLoadEnd={() => setRefreshing(false)}
            forceDarkOn={isDarkMode}
          />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
});

const PostComposer = () => {
  const { isDarkMode } = useDarkMode();
  const insets = useSafeAreaInsets();
  const [stateIndex, setStateIndex] = useState(0); // Used to force a re-render of the component, to reset the input

  const { savePost, postState, processingProgress, error } = usePostComposer();

  const [caption, setCaption] = useState<string>('');
  const [channel, setChannel] = useState<
    HomebaseFile<ChannelDefinition> | NewHomebaseFile<ChannelDefinition>
  >(BlogConfig.PublicChannelNewDsr);
  const [customAcl, setCustomAcl] = useState<AccessControlList | undefined>(undefined);
  const [files, setFiles] = useState<NewMediaFile[]>();

  const [reactAccess, setReactAccess] = useState<ReactAccess | undefined>(undefined);

  const isPosting = postState === 'uploading' || postState === 'encrypting';

  const doPost = async () => {
    if (isPosting) return;
    await savePost(caption, files, undefined, channel, reactAccess, customAcl);
    resetUi();
  };

  const resetUi = () => {
    setCaption('');
    setFiles(undefined);
    setStateIndex((i) => i + 1);
  };

  const canPost = caption?.length || files?.length;

  return (
    <>
      <ErrorNotification error={error} />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top,
          paddingHorizontal: 8,
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          zIndex: 10,
        }}
      >
        <View
          style={{
            padding: 16,
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            borderWidth: 1,
            borderColor: Colors.gray[100],
            borderRadius: 6,
          }}
        >
          <TextInput
            placeholder="What's up?"
            style={{ paddingVertical: 5, lineHeight: 20, fontSize: 16, minHeight: 45 }}
            multiline={true}
            onChange={(event) => setCaption(event.nativeEvent.text)}
            key={stateIndex}
          />
          <View
            style={{
              marginVertical: 12,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <TouchableOpacity>
              <Plus size={'sm'} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Lol size={'sm'} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ellipsis size={'sm'} />
            </TouchableOpacity>

            <ChannelOrAclSelector
              defaultChannelValue={
                channel?.fileMetadata?.appData?.uniqueId || BlogConfig.PublicChannelId
              }
              defaultAcl={customAcl}
              onChange={(channel, acl) => {
                channel && setChannel(channel);
                setCustomAcl(acl);
              }}
            />
          </View>
          {canPost ? (
            <TouchableOpacity
              style={{
                backgroundColor: Colors.indigo[500],

                padding: 8,
                borderRadius: 5,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
              onPress={doPost}
            >
              {channel.serverMetadata?.accessControlList && canPost ? (
                <AclIcon
                  color={Colors.white}
                  size={'sm'}
                  acl={customAcl || channel.serverMetadata?.accessControlList}
                />
              ) : null}

              <View>
                <Text style={{ color: Colors.white, fontSize: 16 }}>Post</Text>
                {channel.serverMetadata?.accessControlList ? (
                  <Text style={{ color: Colors.white, fontSize: 12 }}>
                    <AclSummary acl={customAcl || channel.serverMetadata?.accessControlList} />
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </>
  );
};

const ChannelOrAclSelector = ({
  className,
  defaultChannelValue,
  defaultAcl,
  onChange,
  disabled,
  excludeCustom,
}: {
  className?: string;
  defaultChannelValue?: string;
  defaultAcl?: AccessControlList;
  onChange: (
    channel: HomebaseFile<ChannelDefinition> | undefined,
    acl: AccessControlList | undefined
  ) => void;
  disabled?: boolean;
  excludeCustom?: boolean;
}) => {
  const { data: channels, isLoading } = useChannels({ isAuthenticated: true, isOwner: true });
  const [isChnlMgmtOpen, setIsChnlMgmtOpen] = useState(false);
  const [isCustomAclOpen, setIsCustomAclOpen] = useState(false);

  const publicChannel = useMemo(
    () =>
      channels?.find((chnl) =>
        stringGuidsEqual(chnl.fileMetadata.appData.uniqueId, BlogConfig.PublicChannelId)
      ),
    [channels]
  );

  if (isLoading || !channels) {
    // return a different 'loading-select', so we can still use the defaultChannelValue once the channels are loaded
    return (
      <Select
        // className={`cursor-pointer bg-transparent px-3 py-2 text-sm ${className ?? ''}`}
        defaultValue={defaultChannelValue}
        key={'loading-select'}
      >
        <Option>Public Posts</Option>
      </Select>
    );
  }

  const getPublicChannel = () =>
    publicChannel?.fileMetadata.appData.uniqueId || BlogConfig.PublicChannelId;

  const getDefaultChannel = () =>
    channels.find((chnl) =>
      stringGuidsEqual(chnl.fileMetadata.appData.uniqueId, defaultChannelValue)
    )?.fileMetadata.appData.uniqueId || getPublicChannel();

  const handleChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomAclOpen(true);
      // value = getPublicChannel();
    } else {
      onChange(
        channels.find((chnl) => stringGuidsEqual(chnl.fileMetadata.appData.uniqueId, value)),
        undefined
      );
    }
  };

  return (
    <>
      <Select
        // className={`cursor-pointer bg-transparent px-3 py-2 text-sm ${
        //   disabled ? 'pointer-events-none opacity-50' : ''
        // } ${className ?? ''}`}
        style={{ marginLeft: 'auto' }}
        defaultValue={getDefaultChannel()}
        key={'loaded-select'}
        onChange={handleChange}
        // ref={ref}
        disabled={disabled}
      >
        {channels.map((channel) => (
          <Option
            value={channel.fileMetadata.appData.uniqueId}
            key={channel.fileMetadata.appData.uniqueId}
          >
            {channel.fileMetadata.appData.content.name}
          </Option>
        ))}

        {!excludeCustom ? (
          <Option value={'custom'} key={'custom'}>
            Custom...
          </Option>
        ) : null}
      </Select>
      {/* <AclDialog
        acl={
          defaultAcl ||
          publicChannel?.serverMetadata?.accessControlList || {
            requiredSecurityGroup: SecurityGroupType.Anonymous,
          }
        }
        title={t('Who can see your post?')}
        onConfirm={(acl) => {
          onChange(publicChannel, acl);
          setIsCustomAclOpen(false);
        }}
        isOpen={isCustomAclOpen}
        onCancel={() => setIsCustomAclOpen(false)}
      /> */}
    </>
  );
};

interface SelectProps {
  defaultValue: string | undefined;
  children:
    | ReactElement<OptionProps>
    | null
    | Array<Array<ReactElement<OptionProps>> | ReactElement<OptionProps> | null>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onChange?: (value: string) => void;
}
const Select = ({ defaultValue, children, style, onChange }: SelectProps) => {
  // console.log('Select', Array.isArray(children) ? children.flat() : [children]);
  const [currentVal, setCurrentVal] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const flatOptions: Array<ReactElement<OptionProps>> = useMemo(
    () =>
      (Array.isArray(children) ? children.flat() : [children]).filter(Boolean) as Array<
        ReactElement<OptionProps>
      >,
    [children]
  );

  const currentLabel = useMemo(() => {
    const selected = flatOptions.find((child) => child.props.value === currentVal);
    return selected?.props.children || 'Make a selection';
  }, [flatOptions, currentVal]);

  useEffect(() => {
    if (currentVal && onChange) {
      onChange(currentVal);
    }
  }, [currentVal]);

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={[
          {
            padding: 8,
            borderWidth: 1,
            borderColor: Colors.gray[200],
            borderRadius: 4,
            position: 'relative',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          },
        ]}
      >
        <Text>{currentLabel}</Text>
        <ArrowDown size={'sm'} />
      </TouchableOpacity>

      {isOpen ? (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: Colors.white,
            zIndex: 999999,
          }}
        >
          {flatOptions.map((child) => (
            <TouchableOpacity
              key={child?.key}
              onPress={() => {
                setCurrentVal(child?.props.value);
                setIsOpen(false);
              }}
            >
              {child}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

interface OptionProps {
  value?: string;
  children: string;
}
const Option = ({ children }: OptionProps) => {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text>{children}</Text>
    </View>
  );
};

export const AclSummary = ({
  acl,
  maxLength = 40,
}: {
  acl: AccessControlList;
  maxLength?: number;
}) => {
  const { data: circles } = useCircles().fetch;

  const circlesDetails = acl?.circleIdList?.map(
    (circleId) => circles?.find((circle) => stringGuidsEqual(circle.id || '', circleId))?.name
  );

  return (
    <>
      {!acl || acl.requiredSecurityGroup.toLowerCase() === SecurityGroupType.Anonymous.toLowerCase()
        ? t('Public')
        : acl.requiredSecurityGroup.toLowerCase() === SecurityGroupType.Authenticated.toLowerCase()
          ? t('Authenticated')
          : acl.requiredSecurityGroup.toLowerCase() === SecurityGroupType.Connected.toLowerCase()
            ? acl.circleIdList?.length
              ? `${t('Circles')}: ${ellipsisAtMaxChar(circlesDetails?.join(', '), maxLength)}`
              : t('Connections')
            : acl.requiredSecurityGroup.toLowerCase() === SecurityGroupType.Owner.toLowerCase()
              ? t('Owner')
              : t('Owner')}
    </>
  );
};

export const AclIcon = ({ acl, ...props }: { acl: AccessControlList } & IconProps) => {
  return !acl ||
    acl.requiredSecurityGroup === SecurityGroupType.Anonymous.toLowerCase() ||
    acl.requiredSecurityGroup === SecurityGroupType.Authenticated.toLowerCase() ? (
    <OpenLock {...props} />
  ) : (
    <Lock {...props} />
  );
};
