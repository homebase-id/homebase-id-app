import { useContext } from 'react';
import { AudioContext } from './AudioContext';

export const useAudioContext = () => {
  const audioContext = useContext(AudioContext);
  if (!audioContext) throw new Error('AudioContext not found');

  return audioContext;
};
