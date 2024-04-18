import {
  HomebaseFile,
  NewHomebaseFile,
  AccessControlList,
  SecurityGroupType,
} from '@youfoundation/js-lib/core';
import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import { ChannelDefinition, BlogConfig, ReactAccess } from '@youfoundation/js-lib/public';
import { t } from 'feed-app-common';
import { useState, useMemo, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
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
import { ImageSource } from '../../../provider/image/RNImageProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCircles } from '../../../hooks/circles/useCircles';
import { ScrollView } from 'react-native-gesture-handler';

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
  const [assets, setAssets] = useState<Asset[]>([]);

  const [reactAccess, setReactAccess] = useState<ReactAccess | undefined>(undefined);

  const isPosting = useMemo(
    () => postState === 'uploading' || postState === 'encrypting',
    [postState]
  );

  const resetUi = useCallback(() => {
    setCaption('');
    setAssets([]);
    setStateIndex((i) => i + 1);
  }, []);

  const doPost = useCallback(async () => {
    if (isPosting) return;
    await savePost(
      caption,
      assets.map<ImageSource>((value) => {
        return {
          height: value.height || 0,
          width: value.width || 0,
          name: value.fileName,
          type: value.type && value.type === 'image/jpg' ? 'image/jpeg' : value.type,
          uri: value.uri,
          filename: value.fileName,
          date: Date.parse(value.timestamp || new Date().toUTCString()),
          filepath: value.originalPath,
          id: value.id,
          fileSize: value.fileSize,
        };
      }),
      undefined,
      channel,
      reactAccess,
      customAcl
    );
    resetUi();
  }, [isPosting, savePost, caption, assets, channel, reactAccess, customAcl, resetUi]);

  const handleImageIconPress = useCallback(async () => {
    const imagePickerResult = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 10,
    });
    if (imagePickerResult.didCancel || imagePickerResult.errorCode) return;

    setAssets(
      imagePickerResult.assets
        ?.filter(Boolean)
        .filter((file) => Object.keys(file)?.length && file.type) ?? []
    );
  }, [setAssets]);

  const handleChange = useCallback(
    (channel: HomebaseFile<ChannelDefinition> | undefined, acl: AccessControlList | undefined) => {
      channel && setChannel(channel);
      setCustomAcl(acl);
    },
    []
  );

  const canPost = caption?.length || assets?.length;

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
          zIndex: 0,
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
            files={assets?.length || 0}
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
              onChange={handleChange}
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
                zIndex: -1,
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
  defaultChannelValue,
  defaultAcl,
  onChange,
  disabled,
  excludeCustom,
}: {
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
  const [isCustomAclOpen, setIsCustomAclOpen] = useState(false);
  const [stateIndex, setStateIndex] = useState(0);

  const publicChannel = useMemo(
    () =>
      channels?.find((chnl) =>
        stringGuidsEqual(chnl.fileMetadata.appData.uniqueId, BlogConfig.PublicChannelId)
      ),
    [channels]
  );

  const handleChange = useCallback(
    (value: string) => {
      if (value === 'custom') {
        setIsCustomAclOpen(true);
      } else {
        onChange(
          channels?.find((chnl) => stringGuidsEqual(chnl.fileMetadata.appData.uniqueId, value)),
          undefined
        );
      }
    },
    [channels, onChange]
  );

  if (isLoading || !channels) {
    // return a different 'loading-select', so we can still use the defaultChannelValue once the channels are loaded
    return (
      <Select
        // className={`cursor-pointer bg-transparent px-3 py-2 text-sm ${className ?? ''}`}
        defaultValue={defaultChannelValue}
        key={'loading-select'}
        style={{ zIndex: 20, elevation: 20, position: 'relative' }}
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

  return (
    <>
      <Select
        style={{ marginLeft: 'auto', zIndex: 20, elevation: 20, position: 'relative' }}
        defaultValue={getDefaultChannel()}
        key={stateIndex || 'loaded-select'}
        onChange={handleChange}
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
      <AclDialog
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
        onCancel={() => {
          setIsCustomAclOpen(false);
          setStateIndex((i) => i + 1);
        }}
      />
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
  if (postState === 'uploading') {
    if (processingProgress < 1) {
      if (files > 1) progressText = t('Generating thumbnails');
      else progressText = t('Generating thumbnail');
    } else progressText = t(postState);
  }

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

const AclDialog = ({
  title,
  isOpen,

  acl,

  onConfirm,
  onCancel,
}: {
  title: string;
  isOpen: boolean;

  acl: AccessControlList;

  onConfirm: (acl: AccessControlList) => void;
  onCancel: () => void;
}) => {
  const { isDarkMode } = useDarkMode();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useLayoutEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => bottomSheetRef.current?.present());
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['95%']}
      backgroundStyle={{
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.white,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
      }}
      onDismiss={onCancel}
      enableDismissOnClose={true}
      style={{
        zIndex: 20,
        elevation: 20,
      }}
    >
      <ScrollView
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ marginBottom: 12, fontSize: 20 }}>{title}</Text>
        <AclWizard acl={acl} onConfirm={onConfirm} onCancel={onCancel} />
      </ScrollView>
    </BottomSheetModal>
  );
};

export const AclWizard = ({
  acl,
  onConfirm,
  onCancel,
}: {
  acl: AccessControlList;
  onConfirm: (acl: AccessControlList) => void;
  onCancel?: () => void;
}) => {
  const [currentAcl, setCurrentAcl] = useState(
    acl ?? { requiredSecurityGroup: SecurityGroupType.Owner }
  );

  const doConfirm = useCallback(() => {
    onConfirm(currentAcl);
  }, [currentAcl, onConfirm]);

  const doChange = useCallback((newCircleIds: string[]) => {
    setCurrentAcl((currentAcl) => ({ ...currentAcl, circleIdList: newCircleIds }));
  }, []);

  return (
    <>
      <View style={{ marginBottom: 16 }}>
        <RequiredSecurityGroupRadioGroup
          defaultAcl={currentAcl}
          onChange={(newAcl) => setCurrentAcl({ ...newAcl })}
        />
      </View>
      {currentAcl.requiredSecurityGroup.toLowerCase() ===
        SecurityGroupType.Connected.toLowerCase() && Array.isArray(currentAcl.circleIdList) ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 4, fontSize: 18 }}>
            {t('Do you want to only allow certain circles?')}
          </Text>
          <CircleSelector defaultValue={currentAcl.circleIdList} onChange={doChange} />
        </View>
      ) : null}

      <View style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8, paddingBottom: 16 }}>
        <TouchableOpacity
          onPress={doConfirm}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: Colors.slate[200],
            borderRadius: 6,

            backgroundColor: Colors.indigo[500],
          }}
        >
          <Text style={{ color: Colors.white }}>{t('Continue')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: Colors.slate[200],
            borderRadius: 6,
          }}
        >
          <Text>{t('Cancel')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const RequiredSecurityGroupRadioGroup = ({
  defaultAcl,
  onChange,
}: {
  defaultAcl?: AccessControlList;
  onChange: (acl: AccessControlList) => void;
}) => {
  return (
    <>
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <GroupOption
          name={t('Owner')}
          description={t('Only you')}
          value={{ requiredSecurityGroup: SecurityGroupType.Owner }}
          checked={
            SecurityGroupType.Owner.toLowerCase() ===
            defaultAcl?.requiredSecurityGroup.toLowerCase()
          }
          onChange={onChange}
        />

        <GroupOption
          name={t('Circles')}
          description={t('Only people that are member of a circle')}
          value={{ requiredSecurityGroup: SecurityGroupType.Connected, circleIdList: [] }}
          checked={
            SecurityGroupType.Connected.toLowerCase() ===
              defaultAcl?.requiredSecurityGroup.toLowerCase() &&
            Array.isArray(defaultAcl.circleIdList) === true
          }
          onChange={onChange}
        />

        <GroupOption
          name={t('Connected')}
          description={t('Only people that are connected to you')}
          value={{ requiredSecurityGroup: SecurityGroupType.Connected }}
          checked={
            SecurityGroupType.Connected.toLowerCase() ===
              defaultAcl?.requiredSecurityGroup.toLowerCase() &&
            Array.isArray(defaultAcl.circleIdList) === false
          }
          onChange={onChange}
        />

        <GroupOption
          name={t('Authenticated')}
          description={t('Only people that are authenticated')}
          value={{ requiredSecurityGroup: SecurityGroupType.Authenticated }}
          checked={
            SecurityGroupType.Authenticated.toLowerCase() ===
            defaultAcl?.requiredSecurityGroup.toLowerCase()
          }
          onChange={onChange}
        />

        <GroupOption
          name={t('Public')}
          description={t('Accessible by everyone on the internet')}
          value={{ requiredSecurityGroup: SecurityGroupType.Anonymous }}
          checked={
            SecurityGroupType.Anonymous.toLowerCase() ===
            defaultAcl?.requiredSecurityGroup.toLowerCase()
          }
          onChange={onChange}
        />
      </View>
    </>
  );
};

const GroupOption = (props: {
  name: string;
  description: string;
  value: AccessControlList;
  checked: boolean;
  onChange: (value: AccessControlList) => void;
}) => {
  return (
    <TouchableOpacity
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        borderRadius: 4,
        padding: 8,
        backgroundColor: props.checked ? Colors.indigo[500] : Colors.slate[100],
      }}
      onPress={() => props.onChange && props.onChange(props.value)}
    >
      <Text style={{ color: props.checked ? Colors.white : Colors.black }}>{props.name}</Text>
      <Text style={{ fontSize: 12, color: props.checked ? Colors.slate[300] : Colors.slate[500] }}>
        {props.description}
      </Text>
    </TouchableOpacity>
  );
};

const CircleSelector = ({
  defaultValue,
  onChange,
  excludeSystemCircles = false,
}: {
  defaultValue: string[];
  onChange: (value: string[]) => void;
  excludeSystemCircles?: boolean;
}) => {
  const { isDarkMode } = useDarkMode();
  const {
    fetch: { data: circles, isLoading: isCirclesLoading },
  } = useCircles(excludeSystemCircles);
  const [selection, setSelection] = useState<string[]>([...(defaultValue ?? [])]);

  useEffect(() => {
    onChange([...selection]);
  }, [selection, onChange]);

  return (
    <>
      {!circles?.length && !isCirclesLoading && (
        <Text
          style={{
            padding: 16,
            borderRadius: 6,
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            borderWidth: 1,
            borderColor: isDarkMode ? Colors.slate[800] : Colors.slate[200],
          }}
        >
          {t('No circles found on your identity')}
        </Text>
      )}
      <View style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {circles?.map((circle) => {
          const isChecked = selection.some((circleGrant) =>
            stringGuidsEqual(circleGrant, circle.id || '')
          );
          const clickHandler = () => {
            if (!circle.id) {
              return;
            }
            const clickedCircleId = circle.id;

            if (!selection.some((circleGrant) => stringGuidsEqual(circleGrant, clickedCircleId))) {
              setSelection([...selection, clickedCircleId]);
            } else {
              setSelection(
                selection.filter((circleId) => !stringGuidsEqual(circleId, clickedCircleId))
              );
            }
          };

          return (
            <TouchableOpacity
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
                padding: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: isDarkMode ? Colors.slate[800] : Colors.slate[200],
                backgroundColor: isChecked ? Colors.indigo[500] : 'transparent',
              }}
              key={circle.id}
              onPress={clickHandler}
            >
              <Text style={{ color: isChecked ? Colors.white : Colors.black }}>{circle.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};
