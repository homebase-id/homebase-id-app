import { memo, useCallback } from 'react';
import { useProfile } from '../../hooks/profile/useProfile';
import { useAuth } from '../../hooks/auth/useAuth';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../../app/ChatStack';
import { ConversationWithYourselfId } from '../../provider/chat/ConversationProvider';
import ConversationTile from '../Chat/Conversation-tile';

export const ConversationTileWithYourself = memo(
  ({
    selecMode: selectMode,
    isSelected,
    onPress,
  }: {
    selecMode?: boolean;
    isSelected?: boolean;
    onPress?: () => void;
  }) => {
    const { data: profile } = useProfile();
    const odinId = useAuth().getIdentity();
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    const doOpen = useCallback(
      () =>
        navigation.navigate('ChatScreen', {
          convoId: ConversationWithYourselfId,
        }),
      [navigation]
    );

    return (
      <ConversationTile
        odinId={odinId || ''}
        conversation={{
          title: profile ? `${profile?.firstName} ${profile?.surName} ` : '',
          recipients: [],
        }}
        conversationId={ConversationWithYourselfId}
        conversationUpdated={Date.now()}
        isSelf
        isSelected={isSelected}
        selectMode={selectMode}
        onPress={selectMode ? onPress : doOpen}
      />
    );
  }
);
