// import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
// import { memo, useCallback, useEffect, useMemo, useState } from 'react';
// import { Portal } from 'react-native-portalize';

// import Animated, {
//   interpolate,
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
//   withTiming,
// } from 'react-native-reanimated';
// import { Colors } from '../../../../app/Colors';
// import { ReactionContext } from '@youfoundation/js-lib/public';
// import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
// import { useDotYouClientContext } from 'feed-app-common';
// import { useDarkMode } from '../../../../hooks/useDarkMode';
// import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';

// const ChatReaction = memo(
//   ({
//     context,
//     onIntentToReact,
//     canReact,
//   }: {
//     context: ReactionContext;
//     onIntentToReact?: () => void;
//     canReact?: CanReactInfo;
//   }) => {
//   const [isReact, setIsReact] = useState(false);
//     const identity = useDotYouClientContext().getIdentity();
//   const { mutateAsync: postEmoji, error: postEmojiError } = useReaction().saveEmoji;

//     const scale = useSharedValue(0);
//     const { height } = useWindowDimensions();

//     // useEffect(() => {
//     //   if (message && showReaction) {
//     //     scale.value = withSpring(1);
//     //   } else if (!showReaction) {
//     //     scale.value = 0;
//     //   }
//     // }, []);

//     const reactionStyle = useAnimatedStyle(() => {
//       let y = messageCordinates.y;
//       let shouldAnimate = false;
//       const isLessDistanceFromTop = y < 100;
//       const isLessDistanceFromBottom = height - y < 0;
//       if (isLessDistanceFromBottom) {
//         shouldAnimate = true;
//       }

//       if (isLessDistanceFromTop) {
//         shouldAnimate = true;
//       }
//       y = isNaN(y) ? 0 : y;
//       return {
//         transform: [
//           {
//             translateY: shouldAnimate ? withTiming(y - 70, { duration: 200 }) : y - 70,
//           },
//         ],
//         opacity: showReaction ? withTiming(1, { duration: 200 }) : 0,
//       };
//     });

//     const textStyle = useAnimatedStyle(() => {
//       return {
//         fontSize: 28,
//         color: isDarkMode ? Colors.white : Colors.slate[700],
//         transform: [
//           {
//             scale: scale.value,
//           },
//           {
//             translateY: interpolate(scale.value, [0, 1], [50, 0]),
//           },
//         ],
//       };
//     });

//      const doLike = () =>
//        postEmoji({
//          emojiData: {
//            authorOdinId: identity || '',
//            body: '❤️',
//          },
//          context,
//        });

//      useEffect(() => {
//        if (isReact && onIntentToReact) onIntentToReact();
//      }, [isReact, onIntentToReact]);

//     const filteredReactions = useMemo(
//       () => reactions?.filter((reaction) => reaction.fileMetadata.senderOdinId === '') || [],
//       [reactions]
//     );

//     const { isDarkMode } = useDarkMode();

//     const initialReactions: string[] = ['❤️', '👍', '😀', '😂', '😍', '😡', '➕'];
//     return (
//       <Portal>
//         <ErrorNotification error={postEmojiError} />
//         <Animated.View
//           pointerEvents={showReaction ? 'auto' : 'none'}
//           style={[
//             styles.reaction,
//             reactionStyle,
//             {
//               backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
//             },
//           ]}
//         >
//           {initialReactions.map((reaction, index) => (
//             <TouchableOpacity key={index} onPress={() => sendReaction(reaction, index)}>
//               <Animated.Text style={textStyle}>{reaction}</Animated.Text>
//             </TouchableOpacity>
//           ))}
//         </Animated.View>
//       </Portal>
//     );
//   }
// );

// export default ChatReaction;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     // backgroundColor: Colors.red[50],
//   },
//   messageStyle: {
//     position: 'absolute',
//   },
//   reaction: {
//     position: 'absolute',
//     padding: 16,
//     borderRadius: 50,
//     flexDirection: 'row',
//     alignSelf: 'center',
//     gap: 8,
//   },
// });
