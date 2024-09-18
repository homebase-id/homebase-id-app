import { PayloadDescriptor } from '@homebase-id/js-lib/core';
import { PostContent } from '@homebase-id/js-lib/public';
import { memo, useMemo, useState } from 'react';
import { openURL, URL_PATTERN } from '../../../utils/utils';
import { useDarkMode } from '../../../hooks/useDarkMode';
import ParsedText, { ParseShape } from 'react-native-parsed-text';
import { Colors } from '../../../app/Colors';
import { ellipsisAtMaxChar, t } from 'feed-app-common';
import TextButton from '../../ui/Text/Text-Button';

const MAX_CHAR_FOR_SUMMARY = 400;

export const PostBody = memo(
  ({
    post,
    odinId,
    hideEmbeddedPostMedia,
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
            post.caption
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
