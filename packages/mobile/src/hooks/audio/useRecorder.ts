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

const audioSet: AudioSet = {
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
  AVModeIOS: AVModeIOSOption.measurement,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 2,
  AVFormatIDKeyIOS: AVEncodingOption.aac,
};

export const useRecorder = () => {
  const audioRecorder = useMemo(() => new AudioRecorderPlayer(), []);
  const dirs = RNFS.TemporaryDirectoryPath;
  const path = Platform.select({
    ios: `file://${dirs}audio.m4a`,
    android: `${dirs}audio.mp3`,
  });

  const startRecording = async () => {
    try {
      await audioRecorder.startRecorder(path, audioSet);
      setIsRecording(true);
    } catch (error) {
      console.error('error Starting  Recording', error);
    }
  };

  const stopRecording = async () => {
    const result = await audioRecorder.stopRecorder();
    if (Platform.OS === 'ios') {
      const transcodePath = Platform.select({
        ios: `file://${dirs}audio.mp3`,
        android: `${dirs}audio.mp3`,
      });

      // try {
      await transcodeAudio(result, transcodePath as string, true);
      // } catch (error) {
      //   console.error('[useRecorder] error transcoding', error);
      // }
      // return transcodePath;
    }
    setIsRecording(false);
    setCurrDuration(0);
    return result;
  };

  const playRecording = async (path: string) => {
    try {
      await audioRecorder.startPlayer(path);
      setplaying(true);
    } catch (error) {
      console.error('error Starting Playing', error);
    }
  };

  const stopPlaying = async () => {
    const result = await audioRecorder.stopPlayer();
    setplaying(false);
    setCurrDuration(0);
    return result;
  };
  const pausePlaying = async () => {
    const result = await audioRecorder.pausePlayer();
    return result;
  };

  const [playing, setplaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState<number>();
  const [currDuration, setCurrDuration] = useState<number>();
  useEffect(() => {
    if (isRecording) {
      audioRecorder.addRecordBackListener((recordType) => {
        setCurrDuration(recordType.currentPosition);
      });
    }
    if (playing) {
      audioRecorder.addPlayBackListener((playbackType) => {
        setDuration(playbackType.duration);
        setCurrDuration(playbackType.currentPosition);
      });
    }
    if (currDuration === duration && currDuration !== 0) {
      setplaying(false);
      setCurrDuration(0);
    }

    return () => {
      audioRecorder.removePlayBackListener();
      audioRecorder.removeRecordBackListener();
    };
  }, [audioRecorder, currDuration, duration, isRecording, playing]);

  return {
    startRecording,
    isRecording,
    stopRecording,
    playRecording,
    currDuration,
    duration,
    playing,
    stopPlaying,
    pausePlaying,
  };
};
