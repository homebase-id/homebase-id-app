// import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
// import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
// import { forwardRef, useRef, useState } from 'react';
// import { Backdrop } from '../../../ui/Modal/Backdrop';
// import { Colors } from '../../../../app/Colors';
// import { Text } from '../../../ui/Text/Text';
// import { View } from 'react-native';
// import { ReactionTile } from '../../../Chat/Reactions/Modal/ReactionsModal';
// import { useDarkMode } from '../../../../hooks/useDarkMode';
// import { ReactionContext } from '@youfoundation/js-lib/public';
// import { useEmojiReactions } from '../../../../hooks/reactions';
// import { ReactionFile } from '@youfoundation/js-lib/core';

// export interface ReactionModalMethods {
//   setContent: (context: ReactionContext) => void;
// }

// export const ReactionsModal = forwardRef((_undefined, ref: React.Ref<BottomSheetModalMethods>) => {
//   const { isDarkMode } = useDarkMode();
//   const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
//   const [context, setContext] = useState<ReactionContext>();
//   const {
//     data: reactionDetails,
//     hasNextPage,
//     fetchNextPage,
//     isFetchedAfterMount: reactionsDetailsLoaded,
//   } = useEmojiReactions(context).fetch;

//   const flattenedReactions = reactionDetails?.pages
//     .flatMap((page) => page?.reactions)
//     .filter(Boolean) as ReactionFile[];

//    const onClose = () => {
//      setContext(undefined);
//    };

//   return (
//     <BottomSheetModal
//       ref={bottomSheetRef}
//       snapPoints={['50%']}
//       backdropComponent={Backdrop}
//       onDismiss={onClose}
//       enableDismissOnClose={true}
//       enablePanDownToClose
//       index={0}
//       backgroundStyle={{
//         backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
//       }}
//       handleIndicatorStyle={{
//         backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
//       }}
//     >
//       <View
//         style={{
//           paddingHorizontal: 10,
//           flex: 1,
//         }}
//       >
//         <Text
//           style={{
//             fontSize: 20,
//             fontWeight: '700',
//             color: isDarkMode ? Colors.white : Colors.slate[700],
//             marginBottom: 10,
//           }}
//         >
//           Reactions
//         </Text>
//         <BottomSheetScrollView>
//           {flattenedReactions?.map((prop) => <ReactionTile key={prop.fileId} {...prop} />)}
//         </BottomSheetScrollView>
//       </View>
//     </BottomSheetModal>
//   );
// });
