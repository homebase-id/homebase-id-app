import { NativeModules } from 'react-native';
const RNAudioTranscoder = NativeModules.RNAudioTranscoder;

// Copied From https://github.com/Radweb/react-native-audio-transcoder

/**
 * Attempt to transcode the audio file at the specified input path to the one at the specified output path
 * Return value indicates success.
 * @param input Path to the input file
 * @param output Path ot the output file. NOTE: Currently this must be an mp3 file
 * @param log Optionally catch and log errors, returning false ot indicate failure. Defaults to false, where thrown
 *            errors in native code will propagate
 * @returns {Promise<void>}
 */
export const transcodeAudio = async (input: string, output: string, log = false): Promise<void> => {
  console.log('[AudioTranscoder]', 'Transcoding audio', input, 'to', output, '...');
  if (log) {
    try {
      await RNAudioTranscoder.transcode({ input, output });
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('[AudioTranscoder]', e.message);
      } else {
        console.error('[AudioTranscoder]', e);
      }
      throw e;
    }
  }

  await RNAudioTranscoder.transcode({ input, output });
};
