import { HomebaseFile, NewHomebaseFile } from '@homebase-id/js-lib/core';
import { ChannelDefinition, PostContent } from '@homebase-id/js-lib/public';
import { forwardRef, memo, Ref, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { ChannelDefinitionVm } from '../../../hooks/feed/channels/useChannels';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Backdrop } from '../../ui/Modal/Backdrop';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Colors } from '../../../app/Colors';
import { Platform, View } from 'react-native';
import { OwnerActions } from '../Meta/OwnerAction';
import { ExternalActions, GroupChannelActions } from '../Meta/Actions';
import { EditPostModal } from '../EditPost/EditPostModal';
import { useSharedValue } from 'react-native-reanimated';
import { useBottomSheetBackHandler } from '../../../hooks/useBottomSheetBackHandler';

export type PostActionMethods = {
  setContext: (context: PostActionProps) => void;
  dismiss: () => void;
};

export type PostActionProps = {
  odinId: string;
  postFile: HomebaseFile<PostContent>;
  channel?:
    | HomebaseFile<ChannelDefinition>
    | NewHomebaseFile<ChannelDefinitionVm | ChannelDefinition>
    | null;
  channelLink?: string;
  isGroupPost?: boolean;
  isAuthor?: boolean;
};

export const PostModalAction = memo(
  forwardRef((_undefined, ref: Ref<PostActionMethods>) => {
    const { isDarkMode } = useDarkMode();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const [context, setContext] = useState<PostActionProps>();
    const [isEditOpen, setIsEditOpen] = useState(false); // TODO: Setup edit post modal
    const snapPoints = useSharedValue(['50%', '70%']);
    const onClose = useCallback(() => {
      setContext(undefined);
      bottomSheetRef.current?.dismiss();
      if (isEditOpen) setIsEditOpen(false);
      if (snapPoints.value[0] === '90%') snapPoints.value = ['50%', '70%'];
    }, [isEditOpen, snapPoints]);
    const { handleSheetPositionChange } = useBottomSheetBackHandler(bottomSheetRef);

    useImperativeHandle(
      ref,
      () => ({
        setContext: (context: PostActionProps) => {
          setContext(context);
          bottomSheetRef.current?.present();
        },
        dismiss: onClose,
      }),
      [onClose]
    );

    const onEditMode = useCallback(() => {
      setIsEditOpen(true);
      snapPoints.value = ['90%'];
      setTimeout(() => bottomSheetRef.current?.expand(), 100);
    }, [snapPoints]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetPositionChange}
        backdropComponent={Backdrop}
        onDismiss={onClose}
        enableDismissOnClose
        enablePanDownToClose
        keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
        android_keyboardInputMode="adjustResize"
        index={0}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          {context &&
            (isEditOpen ? (
              <EditPostModal onCancel={onClose} onConfirm={onClose} postFile={context.postFile} />
            ) : context.isGroupPost ? (
              <GroupChannelActions
                postFile={context.postFile}
                odinId={context.odinId}
                onClose={onClose}
              />
            ) : !context.odinId || context.isAuthor ? (
              <OwnerActions postFile={context.postFile} onClose={onClose} onEdit={onEditMode} />
            ) : (
              context.odinId && (
                <ExternalActions
                  odinId={context.odinId}
                  postFile={context.postFile}
                  onClose={onClose}
                />
              )
            ))}
        </View>
      </BottomSheetModal>
    );
  })
);
