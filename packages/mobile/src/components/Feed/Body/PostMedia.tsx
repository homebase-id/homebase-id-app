import { DEFAULT_PAYLOAD_KEY, HomebaseFile } from '@homebase-id/js-lib/core';
import { getChannelDrive, PostContent } from '@homebase-id/js-lib/public';
import { memo } from 'react';
import { calculateScaledDimensions } from '../../../utils/utils';
import { Dimensions, View } from 'react-native';
import { MediaGallery, MediaItem } from '../../ui/Media/MediaGallery';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { FeedStackParamList } from '../../../app/FeedStack';
import { GestureType } from 'react-native-gesture-handler';

type PostMediaProps = {
  post: HomebaseFile<PostContent>;
  gestureRefs?: React.RefObject<GestureType | undefined>[];
};

export const PostMedia = memo(({ post, gestureRefs }: PostMediaProps) => {
  const payloads = post?.fileMetadata.payloads?.filter((p) => p.key !== DEFAULT_PAYLOAD_KEY);
  const fileId = post.fileId;
  const previewThumbnail = post.fileMetadata.appData.previewThumbnail;
  const odinId = post.fileMetadata.senderOdinId;
  const authorOdinId = post.fileMetadata.originalAuthor || odinId;
  const { width, height } = Dimensions.get('screen');
  const hasContent = !!post.fileMetadata.appData.content.caption;
  const navigation = useNavigation<NavigationProp<FeedStackParamList>>();
  if (!payloads || payloads?.length === 0) return null;
  if (payloads?.length === 1) {
    const payload = payloads[0];
    const aspectRatio = (previewThumbnail?.pixelWidth || 1) / (previewThumbnail?.pixelHeight || 1);

    const { width: newWidth, height: newHeight } = calculateScaledDimensions(
      previewThumbnail?.pixelWidth || 300,
      previewThumbnail?.pixelHeight || 300,
      { width: width * 0.9, height: height * 0.9 }
    );
    return (
      <View
        style={{
          marginTop: hasContent ? 10 : 0,
        }}
      >
        <MediaItem
          fileId={fileId}
          payload={payload}
          globalTransitId={post.fileMetadata.globalTransitId}
          probablyEncrypted={post.fileMetadata.isEncrypted}
          odinId={odinId}
          targetDrive={getChannelDrive(post.fileMetadata.appData.content.channelId)}
          fit={'cover'}
          previewThumbnail={previewThumbnail}
          imageSize={{
            width: newWidth,
            height: newHeight,
          }}
          style={{
            aspectRatio,
          }}
          gestureRefs={gestureRefs}
          onClick={() => {
            navigation.navigate('PreviewMedia', {
              fileId: fileId,
              payloads: payloads,
              senderOdinId: authorOdinId,
              transitOdinId: authorOdinId,
              createdAt: post.fileMetadata.created,
              previewThumbnail: previewThumbnail,
              currIndex: 0,
              targetDrive: getChannelDrive(post.fileMetadata.appData.content.channelId),
              globalTransitId: post.fileMetadata.globalTransitId,
              probablyEncrypted: post.fileMetadata.isEncrypted,
            });
          }}
          onLongPress={undefined}
        />
      </View>
    );
  }

  return (
    <MediaGallery
      fileId={fileId}
      targetDrive={getChannelDrive(post.fileMetadata.appData.content.channelId)}
      globalTransitId={post.fileMetadata.globalTransitId}
      payloads={payloads}
      odinId={odinId}
      probablyEncrypted={post.fileMetadata.isEncrypted}
      previewThumbnail={previewThumbnail}
      style={{
        marginTop: hasContent ? 10 : 0,
      }}
      gestureRefs={gestureRefs}
      onClick={(index) => {
        navigation.navigate('PreviewMedia', {
          fileId: fileId,
          payloads: payloads,
          senderOdinId: authorOdinId,
          transitOdinId: authorOdinId,
          createdAt: post.fileMetadata.created,
          previewThumbnail: previewThumbnail,
          currIndex: index,
          targetDrive: getChannelDrive(post.fileMetadata.appData.content.channelId),
          globalTransitId: post.fileMetadata.globalTransitId,
          probablyEncrypted: post.fileMetadata.isEncrypted,
        });
      }}
      onLongPress={undefined}
    />
  );
});
