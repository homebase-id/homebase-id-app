import { Platform } from 'react-native';
import AudioRecorderPlayer, { AudioEncoderAndroidType, AudioSet, AudioSourceAndroidType, AVEncoderAudioQualityIOSType, AVEncodingOption, AVModeIOSOption } from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const audioRecorder = new AudioRecorderPlayer();
const audioSet: AudioSet = {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    AVModeIOS: AVModeIOSOption.measurement,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    AVNumberOfChannelsKeyIOS: 2,
    AVFormatIDKeyIOS: AVEncodingOption.aac,
};

export const useAudio = () => {
    const dirs = RNFS.DocumentDirectoryPath;
    const path = Platform.select({
        ios: `file://${dirs}/audio.m4a`,
        android: `${dirs}/audio.mp3`,
    });

    const startRecording = async () => {
        try {
            await audioRecorder.startRecorder(path, audioSet);
            audioRecorder.addRecordBackListener(e => {
                console.log('Recording . . . ', e.currentPosition);
                return;
            });
        } catch (error) {
            console.log('error Starting  Recording', error);
        }
    };

    const stopRecording = async () => {
        const result = await audioRecorder.stopRecorder();
        return result;
    };

    const playRecording = async (path: string) => {
        try {
            await audioRecorder.startPlayer(path);
            audioRecorder.addPlayBackListener(e => {
                console.log('Playing . . . ', e.currentPosition);
                return;
            });
        } catch (error) {
            console.log('error Starting  Playing', error);
        }

    };
    const stopPlaying = async () => {
        const result = await audioRecorder.stopPlayer();
        return result;
    };
    const pausePlaying = async () => {
        const result = await audioRecorder.pausePlayer();
        return result;
    };

    return {
        startRecording,
        stopRecording,
        playRecording,
        stopPlaying,
        pausePlaying,
    };

};
