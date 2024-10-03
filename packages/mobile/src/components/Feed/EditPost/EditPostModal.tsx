import {
  DEFAULT_PAYLOAD_KEY,
  HomebaseFile,
  MediaFile,
  SecurityGroupType,
} from '@homebase-id/js-lib/core';
import { PostContent } from '@homebase-id/js-lib/public';
import { memo, useCallback, useEffect, useState } from 'react';
import { useManagePost } from '../../../hooks/feed/post/useManagePost';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { t } from 'homebase-id-app-common';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { Platform, View } from 'react-native';
import TextButton from '../../ui/Text/Text-Button';
import { ImageSource } from '../../../provider/image/RNImageProvider';

export const EditPostModal = memo(
  ({
    postFile: incomingPostFile,
    odinId,
    onConfirm,
    onCancel,
  }: {
    postFile: HomebaseFile<PostContent>;
    odinId?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => {
    const {
      update: { mutate: updatePost, error: updatePostError, status: updatePostStatus },
    } = useManagePost();
    const [postFile, setPostFile] = useState<HomebaseFile<PostContent>>({ ...incomingPostFile });
    const [newMediaFiles, setNewMediaFiles] = useState<(MediaFile | ImageSource)[]>(
      postFile.fileMetadata.payloads?.filter((p) => p.key !== DEFAULT_PAYLOAD_KEY) || []
    );
    const { isDarkMode } = useDarkMode();

    useEffect(() => {
      if (incomingPostFile) {
        setPostFile({ ...incomingPostFile });
        setNewMediaFiles(
          incomingPostFile.fileMetadata.payloads?.filter((p) => p.key !== DEFAULT_PAYLOAD_KEY)
        );
      }
    }, [incomingPostFile]);

    useEffect(() => {
      if (updatePostStatus === 'success') onConfirm();
    }, [onConfirm, updatePostStatus]);

    const doUpdate = useCallback(() => {
      const newPostFile = {
        ...postFile,
        serverMetadata: postFile.serverMetadata || {
          accessControlList: {
            requiredSecurityGroup: SecurityGroupType.Connected,
          },
        },
      };

      updatePost({
        channelId: incomingPostFile.fileMetadata.appData.content.channelId,
        odinId,
        postFile: newPostFile,
        mediaFiles: newMediaFiles,
      });
    }, [incomingPostFile, newMediaFiles, odinId, postFile, updatePost]);

    const onChangeText = useCallback(
      (newCaption: string) => {
        const dirtyPostFile = { ...postFile };
        dirtyPostFile.fileMetadata.appData.content.caption = newCaption;
        setPostFile(dirtyPostFile);
      },
      [postFile]
    );

    if (!postFile?.fileId) return null;
    return (
      <>
        <ErrorNotification error={updatePostError} />
        <BottomSheetScrollView
          style={{
            marginHorizontal: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <BottomSheetTextInput
            style={{
              backgroundColor: isDarkMode ? `${Colors.indigo[700]}3A` : `${Colors.indigo[300]}3C`,
              borderRadius: 8,
              padding: Platform.OS === 'ios' ? 16 : 4,
              paddingLeft: 12,
              color: isDarkMode ? Colors.white : Colors.black,
            }}
            onChangeText={onChangeText}
            defaultValue={postFile.fileMetadata.appData.content.caption}
            placeholder={t("What's up")}
            multiline
            textAlignVertical="center" // Android only
            autoCapitalize="sentences"
          />
          <View
            style={{
              flexDirection: 'row',
              alignSelf: 'flex-end',
              alignItems: 'center',
              gap: 16,
              marginVertical: 12,
              alignContent: 'flex-start',
            }}
          >
            <TextButton onPress={onCancel} title="Cancel" />
            <TextButton
              onPress={doUpdate}
              title="Save"
              textStyle={{
                fontWeight: '600',
              }}
            />
          </View>
        </BottomSheetScrollView>
      </>
    );
  }
);
