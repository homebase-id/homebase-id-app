import { PayloadDescriptor } from '@youfoundation/js-lib/core';
import { useRecorder } from '../../hooks/audio/useRecorder';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { memo } from 'react';
import { Play, Stop } from '../ui/Icons/icons';
import useImage from '../ui/OdinImage/hooks/useImage';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import Slider from '@react-native-community/slider';
import { Text } from '../ui/Text/Text';
import { millisToMinutesAndSeconds } from '../../utils/utils';

interface OdinAudioProps {
  fileId: string;
  payload: PayloadDescriptor;
}

export const OdinAudio = memo((props: OdinAudioProps) => {
  const { playRecording, stopPlaying, playing, currDuration, duration } = useRecorder();

  // TODO: Build useAudio hook instead of relying on useImage
  const { data: audioData, isLoading } = useImage({
    imageDrive: ChatDrive,
    imageFileId: props.fileId,
    imageFileKey: props.payload.key,
    lastModified: props.payload.lastModified,
  }).fetch;

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
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
              } else {
                console.log('audioData?.url', audioData?.url);
                await playRecording(audioData?.url as string);
              }
            }}
            key={'audio'}
          >
            {playing ? <Stop /> : <Play />}
          </Pressable>
          <Slider
            minimumValue={0}
            value={currDuration}
            maximumValue={duration}
            style={{
              flex: 1,
            }}
          />
        </View>
      )}

      <Text>{millisToMinutesAndSeconds(duration || 0)}</Text>
    </View>
  );
});
