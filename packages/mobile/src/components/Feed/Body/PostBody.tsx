import { PayloadDescriptor } from '@homebase-id/js-lib/core';
import { Article, getChannelDrive, PostContent } from '@homebase-id/js-lib/public';
import { memo, useMemo, useState } from 'react';
import { openURL, URL_PATTERN } from '../../../utils/utils';
import { useDarkMode } from '../../../hooks/useDarkMode';
import ParsedText, { ParseShape } from 'react-native-parsed-text';
import { Colors } from '../../../app/Colors';
import { ellipsisAtMaxChar, t } from 'homebase-id-app-common';
import TextButton from '../../ui/Text/Text-Button';
import { RichTextRenderer } from '../../ui/Text/RichTextRenderer';
import { Text } from '../../ui/Text/Text';
import { Expander } from '../../ui/Container/Expander';

const MAX_CHAR_FOR_SUMMARY = 400;

export const PostBody = memo(
  ({
    post,
    odinId,
    // hideEmbeddedPostMedia,
    fileId,
    globalTransitId,
    payloads,
    lastModified,
  }: {
    post: PostContent;
    odinId?: string;
    hideEmbeddedPostMedia?: boolean;
    fileId: string | undefined;
    globalTransitId: string | undefined;
    payloads?: PayloadDescriptor[];
    lastModified: number | undefined;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { isDarkMode } = useDarkMode();
    const parse: ParseShape[] = useMemo(
      () => [
        {
          pattern: URL_PATTERN,
          onPress: (url) => openURL(url),
          style: {
            color: isDarkMode ? Colors.indigo[200] : Colors.indigo[500],
          },
        },
      ],
      [isDarkMode]
    );

    if (post.type === 'Article') {
      const articlePost = post as Article;

      const hasBody = !!articlePost.body;
      const hasAbstract = !!articlePost.abstract;
      const allowExpand = hasBody || (hasAbstract && articlePost.abstract?.length > 400);
      return (
        <>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '500',
              marginBottom: 6,
            }}
          >
            {post.caption}
          </Text>
          <Expander
            abstract={<Text>{ellipsisAtMaxChar(articlePost.abstract, MAX_CHAR_FOR_SUMMARY)}</Text>}
            allowExpand={allowExpand}
          >
            <RichTextRenderer
              body={articlePost?.body}
              options={
                fileId
                  ? {
                      imageDrive: getChannelDrive(post.channelId),
                      defaultFileId: fileId,
                      defaultGlobalTransitId: globalTransitId,
                      lastModified: lastModified,
                      previewThumbnails: payloads,
                    }
                  : undefined
              }
              odinId={odinId}
            />
          </Expander>
        </>
      );
    }

    return (
      <>
        <ParsedText
          style={{
            fontSize: 16,
            color: isDarkMode ? Colors.white : Colors.black,
          }}
          parse={parse}
        >
          {isExpanded || post.caption.length <= MAX_CHAR_FOR_SUMMARY ? (
            post.captionAsRichText ? (
              <RichTextRenderer body={post.captionAsRichText} odinId={odinId} />
            ) : (
              post.caption
            )
          ) : (
            <>
              {ellipsisAtMaxChar(post.caption, MAX_CHAR_FOR_SUMMARY)}
              <TextButton
                unFilledStyle={{
                  marginLeft: 4,
                  alignItems: 'flex-start',
                }}
                textStyle={{ color: Colors.purple[500], fontSize: 16 }}
                title={t('More')}
                onPress={() => setIsExpanded(true)}
              />
            </>
          )}
        </ParsedText>
      </>
    );
  }
);
