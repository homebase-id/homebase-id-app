import { PayloadDescriptor } from '@youfoundation/js-lib/core';
import { useRecorder } from '../../../hooks/audio/useRecorder';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { memo } from 'react';
import { Play, Stop } from '../Icons/icons';
import { ChatDrive } from '../../../provider/chat/ConversationProvider';
import Slider from '@react-native-community/slider';
import { Text } from '../Text/Text';
import { millisToMinutesAndSeconds } from '../../../utils/utils';
import { useAudio } from './hooks/useAudio';

interface OdinAudioProps {
  fileId: string;
  payload: PayloadDescriptor;
}

export const OdinAudio = memo((props: OdinAudioProps) => {
  const { playRecording, stopPlaying, playing, currDuration, duration } = useRecorder();

  const { data: audioData, isLoading } = useAudio({
    drive: ChatDrive,
    fileId: props.fileId,
    payloadKey: props.payload.key,
    lastModified: props.payload.lastModified,
  }).fetch;

  return (
    <View
      style={{
        width: 150,
      }}
    >
      <>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              style={{
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
              }}
            />
          ) : (
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
                  await playRecording(audioData?.url as string);
                }
              }}
              key={'audio'}
            >
              {playing ? <Stop /> : <Play />}
            </Pressable>
          )}

          <Slider
            minimumValue={0}
            value={currDuration}
            maximumValue={duration}
            style={{
              flex: 1,
            }}
          />
        </View>
        <Text
          style={{
            marginLeft: 12,
          }}
        >
          {millisToMinutesAndSeconds(duration || 0)}
        </Text>
      </>
    </View>
  );
});
