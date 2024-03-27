import { PayloadDescriptor } from '@youfoundation/js-lib/core';
import { useAudio } from '../../hooks/audio/useAudio';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { memo, useEffect, useState } from 'react';
import { Play, Stop } from '../ui/Icons/icons';
import useImage from '../ui/OdinImage/hooks/useImage';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import Slider from '@react-native-community/slider';
import { Text } from '../ui/Text/Text';
import { millisToMinutesAndSeconds } from '../../utils/utils';

interface AudioMessageProps {
  fileId: string;
  payload: PayloadDescriptor;
}

export const AudioMessage = memo((props: AudioMessageProps) => {
  const { playRecording, stopPlaying, playListenter } = useAudio();
  const [playing, setplaying] = useState(false);
  const [duration, setDuration] = useState<number>();
  const [currDuration, setCurrDuration] = useState<number>();
  // TODO: Build useAudio hook instead of relying on useImage
  const { data: audioData, isLoading } = useImage({
    imageDrive: ChatDrive,
    imageFileId: props.fileId,
    imageFileKey: props.payload.key,
    lastModified: props.payload.lastModified,
  }).fetch;
  useEffect(() => {
    if (playing) {
      playListenter((playbackType) => {
        setCurrDuration(playbackType.currentPosition);
        setDuration(playbackType.duration);
      });
    }
    if (!playing) {
      setCurrDuration(0);
    }
    if (currDuration === duration) {
      setplaying(false);
    }
  }, [currDuration, duration, playListenter, playing]);
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
                setplaying(false);
              } else {
                console.log('audioData?.url', audioData?.url);
                await playRecording(audioData?.url as string);
                setplaying(true);
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
