import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useLayoutEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';
import EmojiPicker from 'rn-emoji-picker';
import { emojis } from 'rn-emoji-picker/dist/data';

export const Modal = ({ onClose }: { onClose: () => void }) => {
  const { isDarkMode } = useDarkMode();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // // callbacks
  // const handleSheetChanges = useCallback((index: number) => {
  //   console.log('handleSheetChanges', index);
  // }, []);

  //#region effects
  useLayoutEffect(() => {
    requestAnimationFrame(() => bottomSheetRef.current?.present());
  }, []);
  //#endregion

  return (
    <BottomSheetModalProvider>
      <View
        style={{
          flex: 1,
          padding: 24,
        }}
      >
        <BottomSheetModal
          ref={bottomSheetRef}
          enableDynamicSizing={true}
          snapPoints={['50%', '90%']}
          onDismiss={onClose}
          backgroundStyle={{
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.white,
          }}
        >
          <View
            style={{
              paddingHorizontal: 10,
              flex: 1,
            }}
          >
            <Text> Test</Text>
            <EmojiPicker
              emojis={emojis} // emojis data source see data/emojis
              autoFocus={true} // autofocus search input
              loading={false} // spinner for if your emoji data or recent store is async
              darkMode={isDarkMode} // to be or not to be, that is the question
              perLine={7} // # of emoji's per line
              onSelect={console.log} // callback when user selects emoji - returns emoji obj
              // backgroundColor={'#000'} // optional custom bg color
              // enabledCategories={[ // optional list of enabled category keys
              //   'recent',
              //   'emotion',
              //   'emojis',
              //   'activities',
              //   'flags',
              //   'food',
              //   'places',
              //   'nature'
              // ]}
              // defaultCategory={'food'} // optional default category key
            />
          </View>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
};
