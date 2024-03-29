import { useState, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AVModeIOSOption,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { transcodeAudio } from '../../provider/audio/AudioTranscoder';
import { getNewId } from '@youfoundation/js-lib/helpers';
import { useAudioContext } from '../../components/AudioContext/useAudioContext';

const audioSet: AudioSet = {
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
  AVModeIOS: AVModeIOSOption.measurement,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 2,
  AVFormatIDKeyIOS: AVEncodingOption.aac,
  AVEncoderBitRateKeyIOS: 128000,
};

export const useAudioRecorder = () => {
  const audioRecorder = useMemo(() => new AudioRecorderPlayer(), []);
  const dirs = RNFS.CachesDirectoryPath;
  const runningId = getNewId();
  const path = Platform.select({
    ios: `file://${dirs}/audio-${runningId}.m4a`,
    android: `${dirs}/audio-${runningId}.mp3`,
  });

  const record = async () => {
    try {
      await audioRecorder.startRecorder(path, audioSet);
      setIsRecording(true);
    } catch (error) {
      console.error('error Starting  Recording', error);
    }
  };

  const stop = async () => {
    const result = await audioRecorder.stopRecorder();
    if (Platform.OS === 'ios') {
      const transcodePath = `file://${dirs}/audio-${runningId}.mp3`;
      const tempPath = `file://${dirs}/audio-${runningId}.tmp`;

      await transcodeAudio(result, tempPath, transcodePath, true);
      setIsRecording(false);
      setDuration(0);

      // throw new Error('Transcoding Error');
      return transcodePath;
    }
    setIsRecording(false);
    setDuration(0);
    return result;
  };

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState<number>();

  useEffect(() => {
    audioRecorder.addRecordBackListener((recordType) => {
      setDuration(recordType.currentPosition);
    });

    return () => audioRecorder.removeRecordBackListener();
  }, [audioRecorder, isRecording]);

  return {
    record,
    stop,
    isRecording,
    duration,
  };
};

export const useAudioPlayback = (audioPath: string | undefined) => {
  const audioPlayer = useMemo(() => new AudioRecorderPlayer(), []);
  const { audioPath: globalAudioPath, setAudioPath: setGlobalAudioPath } = useAudioContext();

  const [playing, setplaying] = useState(false);
  const [duration, setDuration] = useState<number>();
  const [currDuration, setCurrDuration] = useState<number>();

  useEffect(() => {
    audioPlayer.addPlayBackListener((playbackType) => {
      // Updates are not for this audio
      if (audioPath !== globalAudioPath) return;

      setDuration(playbackType.duration);
      setCurrDuration(playbackType.currentPosition);
    });

    if (currDuration === duration && currDuration !== 0) {
      setplaying(false);
      setCurrDuration(0);
    }

    return () => audioPlayer.removePlayBackListener();
  }, [audioPlayer, currDuration, duration, playing, globalAudioPath, audioPath]);

  useEffect(() => {
    if (globalAudioPath !== audioPath) {
      setplaying(false);
      setCurrDuration(0);
      setDuration(0);
    }
  }, [globalAudioPath, audioPath]);

  const play = async () => {
    if (!audioPath) return;
    try {
      await audioPlayer.startPlayer(audioPath);
      setGlobalAudioPath(audioPath);
      setplaying(true);
    } catch (error) {
      console.error('error Starting Playing', error);
    }
  };

  const stop = async () => {
    const result = await audioPlayer.stopPlayer();
    setGlobalAudioPath(null);
    setplaying(false);
    setCurrDuration(0);
    return result;
  };

  const pause = async () => {
    const result = await audioPlayer.pausePlayer();
    return result;
  };

  return {
    play,
    playing,
    stop,
    pause,
    currDuration,
    duration,
  };
};
