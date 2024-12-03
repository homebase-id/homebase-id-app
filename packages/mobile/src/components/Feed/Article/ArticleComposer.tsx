import {
  DEFAULT_TOOLBAR_ITEMS,
  RichText,
  Toolbar,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../app/Colors';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { AclIcon, AclSummary } from '../Composer/AclSummary';
import { Article, BlogConfig, ChannelDefinition, ReactAccess } from '@homebase-id/js-lib/public';
import { AccessControlList, HomebaseFile } from '@homebase-id/js-lib/core';
import { launchImageLibrary } from 'react-native-image-picker';
import { CircleExclamation, Ellipsis, FloppyDisk, Globe, Lock, Pencil } from '../../ui/Icons/icons';
import { ActionGroup } from '../../ui/Form/ActionGroup';
import { ChannelOrAclSelector } from '../../../pages/feed/post-composer';
import { assetsToImageSource, openURL } from '../../../utils/utils';
import { Input } from '../../ui/Form/Input';
import { useArticleComposer } from '../../../hooks/feed/article/useArticleComposer';
import { Text } from '../../ui/Text/Text';
import TextButton from '../../ui/Text/Text-Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FeedStackParamList } from '../../../app/FeedStack';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';
import { ActionButton } from '../Meta/Actions';
import { SaveStatus } from '../../ui/SaveStatus';
import { Header } from '@react-navigation/elements';
import { BackButton } from '../../ui/Buttons';

const POST_MEDIA_RTE_PAYLOAD_KEY = 'pst_rte';

export const ArticleComposer = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<FeedStackParamList, 'Compose'>;
}) => {
  const { isDarkMode } = useDarkMode();
  const [content, setContent] = useState<string | undefined>();
  const [customAcl, setCustomAcl] = useState<AccessControlList | undefined>(undefined);
  const [reactAccess, setReactAccess] = useState<ReactAccess | undefined>(undefined);
  const [needsSaving, setNeedsSaving] = useState(false);
  const [willSave, setWillSave] = useState(false);
  const {
    // Actions
    doSave,
    doRemovePost,

    // Data
    channel,
    postFile,
    isInvalidPost,
    isPublished,
    files,

    // Data updates
    setPostFile,
    setOdinId,
    setChannel,
    setFiles,

    // Status
    saveStatus,

    // Errors
    error,

    isLoadingServerData,
  } = useArticleComposer({});

  // Delay needSaving to willSave; Auto save every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      setNeedsSaving((needsSaving) => {
        setWillSave(needsSaving);
        return needsSaving;
      });
    }, 1000 * 15);
    return () => clearInterval(interval);
  }, [setNeedsSaving, setWillSave]);

  useEffect(() => {
    if (willSave) {
      setNeedsSaving(false);
      setWillSave(false);
      doSave(postFile, isPublished ? 'publish' : undefined);
    }
  }, [willSave, setWillSave, postFile, isPublished, doSave]);

  const handleImageIconPress = useCallback(async () => {
    const imagePickerResult = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 10,
    });
    if (imagePickerResult.didCancel || imagePickerResult.errorCode) return;

    setFiles(
      assetsToImageSource(
        imagePickerResult.assets
          ?.filter(Boolean)
          .filter((file) => Object.keys(file)?.length && file.type) ?? []
      )
    );
  }, [setFiles]);

  const handleChange = useCallback(
    (channel: HomebaseFile<ChannelDefinition> | undefined, acl: AccessControlList | undefined) => {
      channel && setChannel(channel);
      setCustomAcl(acl);
    },
    [setChannel]
  );
  const identity = useDotYouClientContext().getIdentity();
  const [isEditTeaser, setIsEditTeaser] = useState(true);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    editable: true,
    dynamicHeight: true,
    theme: {
      toolbar: {
        toolbarBody: {
          borderTopColor: '#C6C6C6B3',
          borderBottomColor: '#C6C6C6B3',
        },
        // Check the ToolbarTheme type for all options
      },

      colorKeyboard: {
        keyboardRootColor: isDarkMode ? Colors.black : Colors.white, // IOS only the background color of rootView of the custom keyboard
        colorSelection: [
          // Custom colors in color keyboard
          {
            name: 'Custom Color',
            value: '#E5112B',
            displayColor: '#E5112B', // Optional - the color that will be displayed on ui (if left empty will default to use value)
          },
        ],
      },
      webview: {
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
      },
    },
  });
  const editorContent = useEditorContent(editor);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (editorContent) {
      setContent(editorContent?.toString());
    }
  }, [editorContent]);
  const canPost = useMemo(
    () =>
      !postFile.fileId ||
      isInvalidPost(postFile) ||
      !postFile.fileMetadata.appData.content.caption ||
      !postFile.fileMetadata.appData.content.caption.length,
    [isInvalidPost, postFile]
  );

  const handleRTEChange = useCallback(
    (e: {
      target: {
        name: string;
        value: string | { fileKey: string; type: string } | undefined;
      };
    }) => {
      setNeedsSaving(true);
      setPostFile((oldPostFile) => {
        const dirtyPostFile = { ...oldPostFile };

        if (e.target.name === 'abstract') {
          dirtyPostFile.fileMetadata.appData.content.abstract = (e.target.value as string)?.trim();
        } else if (e.target.name === 'caption') {
          dirtyPostFile.fileMetadata.appData.content.caption = (e.target.value as string)?.trim();
        } else if (e.target.name === 'primaryMediaFile') {
          if (typeof e.target.value === 'object' && 'fileKey' in e.target.value) {
            dirtyPostFile.fileMetadata.appData.content.primaryMediaFile = {
              fileId: undefined,
              fileKey: e.target.value.fileKey,
              type: e.target.value.type,
            };
          } else {
            dirtyPostFile.fileMetadata.appData.content.primaryMediaFile = undefined;
          }
        } else if (e.target.name === 'body') {
          dirtyPostFile.fileMetadata.appData.content.body = e.target.value as string;
        }

        return {
          ...dirtyPostFile,
          fileMetadata: {
            ...dirtyPostFile.fileMetadata,
            versionTag: oldPostFile.fileMetadata.versionTag,
          },
        };
      });
    },
    [setNeedsSaving, setPostFile]
  );

  const onPrimaryImageSelected = useCallback(async () => {
    const imagePickerResult = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
    });
    if (imagePickerResult.didCancel || imagePickerResult.errorCode) return;

    const fileKey = `${POST_MEDIA_RTE_PAYLOAD_KEY}i${files.length}`;

    setFiles(
      assetsToImageSource(
        imagePickerResult.assets
          ?.filter(Boolean)
          .filter((file) => Object.keys(file)?.length && file.type) ?? [],
        fileKey
      )
    );
    handleRTEChange({
      target: {
        name: 'primaryMediaFile',
        value: { fileKey: fileKey, type: 'image' },
      },
    });
  }, [files.length, handleRTEChange, setFiles]);

  const renderHeaderLeft = useCallback(() => {
    return (
      <BackButton
        label="Cancel"
        style={{
          marginLeft: 8,
        }}
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
      />
    );
  }, [navigation]);

  const renderHeaderRight = useCallback(() => {
    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          flex: 1,
          gap: 8,
        }}
      >
        <ActionButton
          icon={<FloppyDisk />}
          onPress={() => {
            doSave(undefined, isPublished ? 'publish' : undefined);
            setNeedsSaving(false);
          }}
          label="Save"
        />
        <TouchableOpacity
          style={{
            backgroundColor: Colors.indigo[500],
            opacity: !canPost ? 1 : 0.5,
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 5,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: -1,
          }}
          disabled={!canPost}
          onPress={() => {
            doSave(postFile, 'publish', undefined);
            setNeedsSaving(false);
          }}
        >
          <Text style={{ color: Colors.white, fontSize: 16 }}>{t('Publish')}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [canPost, doSave, isPublished, postFile]);

  if (isLoadingServerData) return null;

  return (
    <Animated.View
      style={{
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 8,
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        flex: 1,
      }}
    >
      <Header
        title=""
        headerLeft={renderHeaderLeft}
        headerRight={renderHeaderRight}
        headerShadowVisible={false}
        headerStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        headerRightContainerStyle={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          flex: 1,
          gap: 8,
        }}
      />
      <ErrorNotification error={error} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
        }}
      >
        <Animated.ScrollView>
          <View
            style={{
              justifyContent: 'flex-end',
              flexDirection: 'row',
              padding: 16,
              marginBottom: 8,
            }}
          >
            {!isEditTeaser && (
              <Text style={{ fontSize: 16, fontWeight: '500', flex: 1 }}>
                {postFile.fileMetadata.appData.content.caption}
              </Text>
            )}
            <TextButton
              title={isEditTeaser ? t('Collapse') : t('Expand')}
              onPress={() => setIsEditTeaser(!isEditTeaser)}
            />
          </View>
          {isEditTeaser && (
            <>
              <View
                style={{
                  padding: 16,
                  marginBottom: 8,
                  backgroundColor: isDarkMode ? Colors.black : Colors.white,
                  borderWidth: 1,
                  borderColor: isDarkMode ? Colors.slate[800] : Colors.gray[100],
                  borderRadius: 6,
                }}
              >
                <Text style={styles.heading}>{t('Title')}</Text>
                <Input
                  defaultValue={postFile.fileMetadata.appData.content.caption}
                  onChangeText={(e) => handleRTEChange({ target: { name: 'caption', value: e } })}
                  viewStyle={{
                    paddingLeft: 0,
                    backgroundColor: 'transparent',
                    borderBottomWidth: 1,
                    borderColor: isDarkMode ? Colors.slate[800] : Colors.gray[200],
                  }}
                  style={{
                    marginLeft: 6,
                  }}
                />
              </View>
              <View
                style={{
                  padding: 16,
                  marginBottom: 8,
                  backgroundColor: isDarkMode ? Colors.black : Colors.white,
                  borderWidth: 1,
                  borderColor: isDarkMode ? Colors.slate[800] : Colors.gray[100],
                  borderRadius: 6,
                }}
              >
                <Text style={styles.heading}>{t('Summary')}</Text>
                <Input
                  placeholder="Summary"
                  defaultValue={(postFile.fileMetadata.appData.content as Article).abstract}
                  onChangeText={(e) => handleRTEChange({ target: { name: 'abstract', value: e } })}
                  viewStyle={{
                    paddingLeft: 0,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderRadius: 5,
                    borderColor: isDarkMode ? Colors.slate[800] : Colors.gray[200],
                    minHeight: '20%',
                  }}
                  style={{
                    marginLeft: 6,
                  }}
                />
              </View>
              <View
                style={{
                  padding: 16,
                  marginBottom: 8,
                  backgroundColor: isDarkMode ? Colors.black : Colors.white,
                  borderWidth: 1,
                  borderColor: isDarkMode ? Colors.slate[800] : Colors.gray[100],
                  borderRadius: 6,
                }}
              >
                <Text style={styles.heading}>{t('Hero')}</Text>
                <TouchableOpacity
                  onPress={onPrimaryImageSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 8,
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                    borderRadius: 6,
                    marginVertical: 12,
                  }}
                >
                  <CircleExclamation size={'md'} />
                  <Text>{t('No Primary Image selected')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <View
            style={{
              padding: 16,
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
              borderWidth: 1,
              borderColor: isDarkMode ? Colors.slate[800] : Colors.gray[100],
              borderRadius: 6,
              minHeight: '35%',
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{
                flex: 1,
              }}
            >
              <RichText editor={editor} />
            </KeyboardAvoidingView>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 8,
                zIndex: -1,
                marginVertical: 8,
              }}
            >
              {channel.serverMetadata?.accessControlList ? (
                <AclIcon size={'sm'} acl={customAcl || channel.serverMetadata?.accessControlList} />
              ) : null}

              {channel.serverMetadata?.accessControlList ? (
                <Text style={{ fontSize: 12 }}>
                  <AclSummary acl={customAcl || channel.serverMetadata?.accessControlList} />
                </Text>
              ) : null}
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {/* <TouchableOpacity onPress={handleImageIconPress}>
              <Plus size={'sm'} />
            </TouchableOpacity> */}
              <ActionGroup
                options={[
                  reactAccess === false
                    ? {
                        label: t('Enable reactions'),
                        icon: Globe,
                        onPress: () => setReactAccess(true),
                      }
                    : {
                        label: t('Disable reactions'),
                        icon: Lock,
                        onPress: () => setReactAccess(false),
                      },

                  {
                    label: t('See my drafts'),
                    onPress: () => openURL(`https://${identity}/apps/feed/articles`),
                    icon: Pencil,
                  },
                ]}
              >
                <Ellipsis size={'sm'} />
              </ActionGroup>

              <ChannelOrAclSelector
                defaultChannelValue={
                  channel?.fileMetadata?.appData?.uniqueId || BlogConfig.PublicChannelId
                }
                defaultAcl={customAcl}
                onChange={handleChange}
                excludeCustom
              />
            </View>
          </View>
          <View
            style={{
              alignContent: 'flex-end',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              marginVertical: 14,
              marginRight: 16,
            }}
          >
            <SaveStatus state={saveStatus} error={error} />
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          position: 'absolute',
          width: '100%',
          bottom: 0,
        }}
      >
        <Toolbar editor={editor} items={DEFAULT_TOOLBAR_ITEMS.filter((_, i) => i !== 3)} />
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontWeight: '500',
  },
});
