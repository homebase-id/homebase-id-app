import { t } from 'feed-app-common';
import { CanReactInfo, CantReact } from '../../hooks/reactions';
import { Text } from '../ui/Text/Text';
import { ActivityIndicator, View } from 'react-native';
import { memo } from 'react';

export const CantReactInfo = memo(
  ({ cantReact, intent }: { cantReact: CanReactInfo | undefined; intent: 'emoji' | 'comment' }) => {
    const copy = {
      determining:
        intent === 'comment' ? 'Determining if you can comment' : 'Determining if you can react',
      anonymous:
        intent === 'comment'
          ? 'Comments are disabled for anonymous users'
          : 'Reactions are disabled for anonymous users',
      'missing-access':
        intent === 'comment'
          ? 'You do not have the necessary access to comment on this post'
          : 'You do not have the necessary access to react on this post',
      disabled:
        intent === 'comment'
          ? 'Comments are disabled on this post'
          : 'Reactions are disabled on this post',
      impossible:
        intent === 'comment'
          ? "We couldn't determine if you can comment on this post"
          : "We couldn't determine if you can react on this post",
    };

    if (cantReact === undefined) {
      return (
        <View
          style={{
            gap: 4,
            flexDirection: 'row',
            marginHorizontal: 4,
          }}
        >
          <ActivityIndicator size={'small'} />
          <Text>{t(copy.determining)}</Text>
        </View>
      );
    }

    const details = (cantReact as CantReact)?.details;

    let infoMessage = '';
    // If we can react.. Then it's just partial
    if (cantReact?.canReact === 'emoji' || cantReact?.canReact === 'comment') {
      infoMessage = t(copy['missing-access']);
    } else {
      infoMessage =
        details === 'NOT_AUTHENTICATED'
          ? t(copy.anonymous)
          : details === 'NOT_AUTHORIZED'
            ? t(copy['missing-access'])
            : details === 'DISABLED_ON_POST'
              ? t(copy.disabled)
              : details === 'UNKNOWN'
                ? t(copy.impossible)
                : '';
    }

    return (
      <Text
        style={{
          fontSize: 12,
          fontWeight: '400',
          opacity: 0.5,
        }}
      >
        {infoMessage}
      </Text>
    );
  }
);
