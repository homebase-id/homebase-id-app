import { useContext } from 'react';
import { BubbleColorContext } from './BubbleContext';

export const useBubbleContext = () => {
  const bubbleColor = useContext(BubbleColorContext);
  if (!bubbleColor) throw new Error('BubbleColorContext not found');

  return bubbleColor;
};
