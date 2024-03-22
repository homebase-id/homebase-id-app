import { PayloadDescriptor } from '@youfoundation/js-lib/core';
import { useAudio } from '../../hooks/audio/useAudio';
import { Pressable, View } from 'react-native';
import { useState } from 'react';
import { Play, Stop } from '../ui/Icons/icons';
import useImage from '../ui/OdinImage/hooks/useImage';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { Text } from '../ui/Text/Text';

interface AudioMessageProps {
  fileId: string;
  payload: PayloadDescriptor;
}

export const AudioMessage = (props: AudioMessageProps) => {
  const { playRecording, stopPlaying } = useAudio();
  const [playing, setplaying] = useState(false);
  const { data: audioData, isLoading } = useImage({
    imageDrive: ChatDrive,
    imageFileId: props.fileId,
    imageFileKey: props.payload.key,
    lastModified: props.payload.lastModified,
  }).fetch;
  return (
    <Pressable
      style={{
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      }}
      onPress={async () => {
        if (playing) {
          await stopPlaying();
          setplaying(false);
        } else {
          await playRecording(audioData?.url as string);
          setplaying(true);
        }
      }}
      key={'audio'}
    >
      {isLoading && <Text>Audio Loading</Text>}
      {playing ? <Stop /> : <Play />}
    </Pressable>
  );
};
