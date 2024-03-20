import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorder = new AudioRecorderPlayer();
// const audioSet: AudioSet = {
//     AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
//     AudioSourceAndroid: AudioSourceAndroidType.MIC,
//     AVModeIOS: AVModeIOSOption.measurement,
//     AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
//     AVNumberOfChannelsKeyIOS: 2,
//     AVFormatIDKeyIOS: AVEncodingOption.aac,
// };

export const useAudio = () => {

    const startRecording = async () => {
        const result = await audioRecorder.startRecorder();
    };
    const stopRecording = async () => {
        const result = await audioRecorder.stopRecorder();
    };

    return {
        startRecording,
        stopRecording,
    };

};
