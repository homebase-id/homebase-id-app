import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { memo } from 'react';

type BackdropProps = BottomSheetBackdropProps & {
  opacity?: number;
  appearsOnIndex?: number;
  disappearsOnIndex?: number;
};

export const Backdrop = memo(
  ({ opacity = 0.5, appearsOnIndex = 0, disappearsOnIndex = -1, ...bottom }: BackdropProps) => (
    <BottomSheetBackdrop
      {...bottom}
      opacity={opacity}
      appearsOnIndex={appearsOnIndex}
      disappearsOnIndex={disappearsOnIndex}
    />
  )
);
