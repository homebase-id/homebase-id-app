import {
  DEFAULT_TOOLBAR_ITEMS,
  RichText,
  Toolbar,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '../../../app/Colors';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AclIcon, AclSummary } from '../Composer/AclSummary';
import { Article, BlogConfig, ChannelDefinition, ReactAccess } from '@homebase-id/js-lib/public';
import { AccessControlList, HomebaseFile } from '@homebase-id/js-lib/core';
import { Ellipsis, FloppyDisk, Globe, Lock, Pencil } from '../../ui/Icons/icons';
import { ActionGroup } from '../../ui/Form/ActionGroup';
import { ChannelOrAclSelector, ProgressIndicator } from '../../../pages/feed/post-composer';
import { htmlToRecord, openURL } from '../../../utils/utils';
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
import { PrimaryImageComponent } from './PrimaryImageComponent';

export const ArticleComposer = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<FeedStackParamList, 'Compose'>;
}) => {
  const { isDarkMode } = useDarkMode();
  const [customAcl, setCustomAcl] = useState<AccessControlList | undefined>(undefined);
  const [reactAccess, setReactAccess] = useState<ReactAccess | undefined>(undefined);
  const [_, setNeedsSaving] = useState(false);
  const [willSave, setWillSave] = useState(false);
  const {
    // Actions
    doSave,
    // doRemovePost,

    // Data
    channel,
    postFile,
    isInvalidPost,
    isPublished,
    files,

    // Data updates
    setPostFile,
    setChannel,
    setFiles,

    // Status
    saveStatus,

    //progress
    processingProgress,

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

  // const handleImageIconPress = useCallback(async () => {
  //   const imagePickerResult = await launchImageLibrary({
  //     mediaType: 'mixed',
  //     selectionLimit: 10,
  //   });
  //   if (imagePickerResult.didCancel || imagePickerResult.errorCode) return;

  //   setFiles(
  //     assetsToImageSource(
  //       imagePickerResult.assets
  //         ?.filter(Boolean)
  //         .filter((file) => Object.keys(file)?.length && file.type) ?? []
  //     )
  //   );
  // }, [setFiles]);

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
      },
      webview: {
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
      },
    },
  });
  const editorContent = useEditorContent(editor);
  const insets = useSafeAreaInsets();

  const isPosting = useMemo(() => !!processingProgress?.phase, [processingProgress]);

  const cannotPost = useMemo(
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
          const richText = htmlToRecord(e.target.value as string);
          dirtyPostFile.fileMetadata.appData.content.body = richText;
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

  useEffect(() => {
    if (editorContent) {
      handleRTEChange({ target: { name: 'body', value: editorContent?.toString() } });
    }
  }, [editorContent, handleRTEChange]);

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
          alignContent: 'space-between',
          flex: 1,
          gap: 8,
          // backgroundColor: 'red',
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
        <TextButton
          title="Publish"
          unFilledStyle={{
            backgroundColor: isDarkMode ? Colors.indigo[500] : Colors.indigo[400],
            opacity: !cannotPost ? 1 : 0.5,
            borderRadius: 5,
            paddingHorizontal: 16,
            paddingVertical: 8,
            alignItems: 'center',
            zIndex: -1,
            justifyContent: 'flex-end',
          }}
          disabled={cannotPost}
          onPress={async () => {
            if (isPosting) return;
            await doSave(postFile, 'publish', undefined);
            setNeedsSaving(false);
            navigation.navigate('Posts');
          }}
          textStyle={{
            color: Colors.white,
            fontSize: 16,
          }}
        />
      </View>
    );
  }, [cannotPost, doSave, isDarkMode, isPosting, isPublished, navigation, postFile]);

  if (isLoadingServerData) return null;

  return (
    <React.Fragment>
      <View
        style={{
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
            paddingRight: 8,
          }}
        />
        <ErrorNotification error={error} />

        <ScrollView
          style={{
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 8,
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          }}
        >
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
                  key={'caption'}
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
                  key={'abstract'}
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
                <PrimaryImageComponent
                  postFile={postFile}
                  channel={channel}
                  files={files}
                  onChange={handleRTEChange}
                  setFiles={setFiles}
                />
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
        </ScrollView>
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
        {isPosting && <ProgressIndicator processingProgress={processingProgress} />}
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontWeight: '500',
  },
});
