import {
  HomebaseFile,
  NewHomebaseFile,
  AccessControlList,
  NewMediaFile,
} from '@youfoundation/js-lib/core';
import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import { ChannelDefinition, BlogConfig, ReactAccess } from '@youfoundation/js-lib/public';
import { t } from 'feed-app-common';
import React, { useState, useMemo, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChannels } from '../../../hooks/feed/channels/useChannels';
import { usePostComposer } from '../../../hooks/feed/post/usePostComposer';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';
import { Plus, Ellipsis } from '../../ui/Icons/icons';
import { FileOverview } from '../../Files/FileOverview';
import { Select, Option } from '../../ui/Form/Select';
import { AclIcon, AclSummary } from './AclSummary';
import { Colors } from '../../../app/Colors';

export const PostComposer = () => {
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
  const [assets, setAssets] = useState<Asset[]>([]);

  const [reactAccess, setReactAccess] = useState<ReactAccess | undefined>(undefined);

  const isPosting = useMemo(
    () => postState === 'uploading' || postState === 'encrypting',
    [postState]
  );

  const doPost = useCallback(async () => {
    if (isPosting) return;
    await savePost(caption, files, undefined, channel, reactAccess, customAcl);
    resetUi();
  }, [isPosting, caption, files, channel, reactAccess, customAcl]);

  const resetUi = useCallback(() => {
    setCaption('');
    setFiles(undefined);
    setStateIndex((i) => i + 1);
  }, []);

  const handleImageIconPress = useCallback(async () => {
    const imagePickerResult = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 10,
    });
    if (imagePickerResult.didCancel) return;
    setAssets(imagePickerResult.assets ?? []);
  }, [setAssets]);

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

          <FileOverview assets={assets} setAssets={setAssets} />
          <ProgressIndicator
            postState={postState}
            processingProgress={processingProgress}
            files={files?.length || 0}
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
            <TouchableOpacity onPress={handleImageIconPress}>
              <Plus size={'sm'} />
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

export const ProgressIndicator = ({
  postState,
  processingProgress,
  files,
}: {
  postState: 'uploading' | 'encrypting' | 'error' | undefined;
  processingProgress: number;
  files: number;
}) => {
  const { isDarkMode } = useDarkMode();
  if (!postState) return null;

  let progressText = '';
  if (postState === 'uploading')
    if (processingProgress < 1)
      if (files > 1) progressText = t('Generating thumbnails');
      else progressText = t('Generating thumbnail');
    else progressText = t(postState);

  return (
    <View style={{ marginTop: 4, display: 'flex', flexDirection: 'row-reverse' }}>
      {postState === 'error' ? (
        <Text>{t('Error')}</Text>
      ) : (
        <Text
          style={{ fontSize: 12, color: isDarkMode ? Colors.white : Colors.black, opacity: 0.4 }}
        >
          {progressText}
        </Text>
      )}
    </View>
  );
};
