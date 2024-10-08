import { NativeModules } from 'react-native';
import { unlink } from 'react-native-fs';
const RNAudioTranscoder = NativeModules.RNAudioTranscoder;

/**
 * Attempt to transcode the audio file at the specified input path to the one at the specified output path
 * Return value indicates success.
 * @param input Path to the input file
 * @param scratch Path to a scratch file, necessary as an intermediate step in the transcoding process
 * @param output Path ot the output file. NOTE: Currently this must be an mp3 file
 * @param log Optionally catch and log errors, returning false ot indicate failure. Defaults to false, where thrown
 *            errors in native code will propagate
 * @returns {Promise<void>}
 */
export const transcodeAudio = async (
  input: string,
  scratch: string,
  output: string,
  log = false
): Promise<void> => {
  if (log) {
    try {
      await RNAudioTranscoder.transcode({ input, temp: scratch, output });
      return;
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('[AudioTranscoder]', e.message);
      } else {
        console.error('[AudioTranscoder]', e);
      }
      throw e;
    }
  }

  await RNAudioTranscoder.transcode({ input, temp: scratch, output });

  try {
    await unlink(input);
    await unlink(scratch);
  } catch (e) {
    console.error('[AudioTranscoder]', 'Error cleaning up temp files:', e);
  }
};
