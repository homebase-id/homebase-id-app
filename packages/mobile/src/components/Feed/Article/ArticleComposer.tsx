import {
  DEFAULT_TOOLBAR_ITEMS,
  RichText,
  Toolbar,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../../app/Colors';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { AclIcon, AclSummary } from '../Composer/AclSummary';
import { BlogConfig, ChannelDefinition, ReactAccess } from '@homebase-id/js-lib/public';
import { AccessControlList, HomebaseFile, NewHomebaseFile } from '@homebase-id/js-lib/core';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { Ellipsis, Globe, Lock, Pencil, Plus } from '../../ui/Icons/icons';
import { ActionGroup } from '../../ui/Form/ActionGroup';
import { ChannelOrAclSelector } from '../../../pages/feed/post-composer';
import { openURL } from '../../../utils/utils';

export const ArticleComposer = () => {
  const { isDarkMode } = useDarkMode();
  const [content, setContent] = useState<string | undefined>();
  const [channel, setChannel] = useState<
    HomebaseFile<ChannelDefinition> | NewHomebaseFile<ChannelDefinition>
  >(BlogConfig.PublicChannelNewDsr);
  const [customAcl, setCustomAcl] = useState<AccessControlList | undefined>(undefined);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [reactAccess, setReactAccess] = useState<ReactAccess | undefined>(undefined);
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
  const identity = useDotYouClientContext().getIdentity();

  const editor = useEditorBridge({
    autofocus: true,
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
        keyboardRootColor: 'white', // IOS only the background color of rootView of the custom keyboard
        colorSelection: [
          // Custom colors in color keyboard
          {
            name: 'Custom Color',
            value: '#E5112B',
            displayColor: '#E5112B', // Optional - the color that will be displayed on ui (if left empty will default to use value)
          },
        ],
      },
      webviewContainer: {},
    },
  });
  const editorContent = useEditorContent(editor);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (editorContent) {
      setContent(editorContent?.toString());
    }
  }, [editorContent]);
  const canPost = !!content?.length;
  return (
    <React.Fragment>
      <Animated.View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 8,
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          zIndex: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 8,
          }}
        >
          <TouchableOpacity
            style={{
              paddingHorizontal: 8,
              paddingTop: 8,
              paddingBottom: 12,
            }}
            onPress={() => {}}
          >
            <Text style={{ fontSize: 16 }}>{t('Cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: Colors.indigo[500],
              opacity: canPost ? 1 : 0.5,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 5,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: -1,
            }}
            disabled={!canPost}
            onPress={() => {}}
          >
            <Text style={{ color: Colors.white, fontSize: 16 }}>{t('Post')}</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            padding: 16,
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            borderWidth: 1,
            borderColor: isDarkMode ? Colors.slate[800] : Colors.gray[100],
            borderRadius: 6,
            minHeight: '30%',
          }}
        >
          <RichText editor={editor} />
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
            <TouchableOpacity onPress={handleImageIconPress}>
              <Plus size={'sm'} />
            </TouchableOpacity>
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
            />
          </View>
        </View>

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
    </React.Fragment>
  );
};
