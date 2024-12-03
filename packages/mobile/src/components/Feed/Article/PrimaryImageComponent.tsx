import { HomebaseFile, MediaFile, NewHomebaseFile } from '@homebase-id/js-lib/core';
import { ImageSource } from '../../../provider/image/RNImageProvider';
import {
  Article,
  ChannelDefinition,
  getChannelDrive,
  RemoteCollaborativeChannelDefinition,
} from '@homebase-id/js-lib/public';
import { useRawImage } from '../../../hooks/image/useRawImage';
import { Dimensions, Image, TouchableOpacity, View } from 'react-native';
import { CircleExclamation, Trash } from '../../ui/Icons/icons';
import { Text } from '../../ui/Text/Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { useCallback, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { assetsToImageSource, calculateScaledDimensions } from '../../../utils/utils';
import { t } from 'homebase-id-app-common';
import { Colors } from '../../../app/Colors';
import { IconButton } from '../../ui/Buttons';

const POST_MEDIA_RTE_PAYLOAD_KEY = 'pst_rte';

export const PrimaryImageComponent = ({
  odinId,
  postFile,
  channel,
  files,
  onChange,
  disabled,
  setFiles,
}: {
  odinId?: string;
  postFile: HomebaseFile<Article> | NewHomebaseFile<Article>;
  channel: NewHomebaseFile<ChannelDefinition>;
  files: (ImageSource | MediaFile)[];

  onChange: (e: {
    target: {
      name: string;
      value: string | { fileKey: string; type: string } | undefined;
    };
  }) => void;
  disabled?: boolean;
  setFiles: (newFiles: (ImageSource | MediaFile)[]) => void;
}) => {
  const channelId =
    (channel as HomebaseFile<RemoteCollaborativeChannelDefinition>).fileMetadata.appData.content
      .uniqueId || (channel.fileMetadata.appData.uniqueId as string);
  const { data: imageData } = useRawImage({
    odinId,
    imageFileId: postFile.fileId,
    imageFileKey: postFile.fileMetadata.appData.content.primaryMediaFile?.fileKey,
    imageDrive: getChannelDrive(channelId),
    lastModified: (postFile as HomebaseFile<unknown>)?.fileMetadata?.updated,
  }).fetch;
  const { isDarkMode } = useDarkMode();
  const pendingFile = files.find(
    (f) => 'uri' in f && f.key === postFile.fileMetadata.appData.content.primaryMediaFile?.fileKey
  ) as ImageSource | null;

  const [defaultFile, setDefaultFile] = useState(pendingFile?.uri || imageData?.url);

  const dimensions = Dimensions.get('window');

  const size = pendingFile
    ? calculateScaledDimensions(pendingFile.width, pendingFile.height, {
        width: dimensions.width * 0.8,
        height: 200,
      })
    : imageData
      ? calculateScaledDimensions(
          imageData?.naturalSize?.pixelWidth || 300,
          imageData.naturalSize?.pixelHeight || 300,
          {
            width: dimensions.width * 0.8,
            height: 200,
          }
        )
      : { width: 0, height: 0 };

  const onPrimaryImageSelected = useCallback(async () => {
    const imagePickerResult = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
    });
    if (imagePickerResult.didCancel || imagePickerResult.errorCode) return;

    const fileKey = `${POST_MEDIA_RTE_PAYLOAD_KEY}i${files.length}`;
    const assets = assetsToImageSource(
      imagePickerResult.assets?.filter(Boolean).filter((file) => Object.keys(file)?.length) ?? [],
      fileKey
    );
    setFiles(assets);
    onChange({
      target: {
        name: 'primaryMediaFile',
        value: { fileKey: assets[0].key || fileKey, type: assets[0].type || 'image' },
      },
    });
  }, [files.length, onChange, setFiles]);

  if (defaultFile) {
    return (
      <View
        style={{
          borderRadius: 6,
          ...size,
        }}
      >
        <Image
          key={postFile.fileMetadata.appData.content.primaryMediaFile?.fileKey}
          source={{ uri: typeof defaultFile === 'string' ? defaultFile : defaultFile.uri }}
          style={{ ...size, position: 'absolute' }}
          onError={(_) => {
            // console.log('error', e.nativeEvent.error);
            // Happens when after uploading , we delete the cache and try to load the image
            setDefaultFile(imageData?.url);
          }}
        />
        <IconButton
          style={{
            top: 5,
            right: 10,
            zIndex: 100,
            position: 'absolute',
          }}
          icon={<Trash color={Colors.red[300]} />}
          onPress={() => {
            setFiles(
              files.filter(
                (f) => f.key !== postFile.fileMetadata.appData.content.primaryMediaFile?.fileKey
              )
            );

            onChange({
              target: {
                name: 'primaryMediaFile',
                value: undefined,
              },
            });
            return;
          }}
        />
      </View>
    );
  }
  return (
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
  );
};
