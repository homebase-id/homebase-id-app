import {
  LegendList,
  LegendListRef,
  LegendListRenderItemProps,
} from '@legendapp/list';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardGestureArea } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

import Color from './Color';
import ItemLegend from './components/Item/ItemLegend';
import { LoadEarlier } from './LoadEarlier';
import { warning } from './logging';
import { IMessage } from './Models';
import { DaysPositions, MessageContainerProps } from './types';
import TypingIndicator from './TypingIndicator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerAlignTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listStyle: {
    flex: 1,
  },
  scrollToBottomStyle: {
    opacity: 0.8,
    position: 'absolute',
    right: 10,
    bottom: 30,
    zIndex: 999,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: Color.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Color.black,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 1,
  },
  headerWrapper: {
    flex: 1,
  },
});

function MessageContainerLegend<TMessage extends IMessage = IMessage>(
  props: MessageContainerProps<TMessage>,
) {
  const {
    messages = [],
    user,
    isTyping = false,
    renderChatEmpty: renderChatEmptyProp,
    loadEarlier = false,
    extraData = null,
    isScrollToBottomEnabled = false,
    scrollToBottomStyle,
    renderTypingIndicator: renderTypingIndicatorProp,
    renderFooter: renderFooterProp,
    renderLoadEarlier: renderLoadEarlierProp,
    scrollToBottomComponent: scrollToBottomComponentProp,
    renderMessage: renderMessageProp,
    scrollToBottom: scrollToBottomLegacy,
    onLoadEarlier,
    infiniteScroll = false,
    isLoadingEarlier = false,
  } = props;

  const listRef = useRef<LegendListRef>(null);
  const [isScrollToBottomVisible, setIsScrollToBottomVisible] = useState(false);

  const daysPositions = useSharedValue<DaysPositions>({});
  const listHeight = useSharedValue(0);
  const scrolledY = useSharedValue(0);

  // Backward compatibility: use scrollToBottom if isScrollToBottomEnabled is not set
  const isScrollToBottomEnabledFinal =
    isScrollToBottomEnabled || scrollToBottomLegacy || false;

  const renderTypingIndicator = useCallback(() => {
    if (renderTypingIndicatorProp) return renderTypingIndicatorProp();
    return <TypingIndicator isTyping={isTyping} />;
  }, [isTyping, renderTypingIndicatorProp]);

  const ListFooterComponent = useMemo(() => {
    if (renderFooterProp) return <>{renderFooterProp(props)}</>;
    return <>{renderTypingIndicator()}</>;
  }, [renderFooterProp, renderTypingIndicator, props]);

  const renderLoadEarlier = useCallback(() => {
    if (loadEarlier) {
      if (renderLoadEarlierProp) return renderLoadEarlierProp(props);
      return <LoadEarlier {...props} />;
    }
    return null;
  }, [loadEarlier, renderLoadEarlierProp, props]);

  const ListHeaderComponent = useMemo(() => {
    const content = renderLoadEarlier();
    if (!content) return null;
    return <View style={styles.headerWrapper}>{content}</View>;
  }, [renderLoadEarlier]);

  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated });
      setIsScrollToBottomVisible(false);
    }
  }, []);

  const renderChatEmpty = useCallback(() => {
    if (renderChatEmptyProp) {
      return renderChatEmptyProp();
    }
    return <View style={styles.container} />;
  }, [renderChatEmptyProp]);

  const renderScrollBottomComponent = useCallback(() => {
    if (scrollToBottomComponentProp) return scrollToBottomComponentProp();
    return <Text>V</Text>;
  }, [scrollToBottomComponentProp]);

  const renderScrollToBottomWrapper = useCallback(() => {
    if (!isScrollToBottomVisible) return null;

    return (
      <TouchableOpacity onPress={() => scrollToBottom()}>
        <View style={[styles.scrollToBottomStyle, scrollToBottomStyle]}>
          {renderScrollBottomComponent()}
        </View>
      </TouchableOpacity>
    );
  }, [
    scrollToBottomStyle,
    renderScrollBottomComponent,
    scrollToBottom,
    isScrollToBottomVisible,
  ]);

  const onEndReached = useCallback(() => {
    if (
      infiniteScroll &&
      loadEarlier &&
      onLoadEarlier &&
      !isLoadingEarlier &&
      Platform.OS !== 'web'
    ) {
      onLoadEarlier();
    }
  }, [infiniteScroll, loadEarlier, onLoadEarlier, isLoadingEarlier]);

  const keyExtractor = useCallback((item: TMessage) => {
    if (!item || item._id === undefined || item._id === null) {
      console.warn(
        '[MessageContainerLegend] keyExtractor: item or item._id is undefined/null',
        item,
      );
      return Math.random().toString();
    }
    return item._id.toString();
  }, []);

  const reversedMessages = useMemo(() => {
    const validMessages = messages.filter(
      msg => msg && msg._id !== undefined && msg._id !== null,
    );
    const reversed = [...validMessages].reverse();
    return {
      messages: reversed,
      length: reversed.length,
    };
  }, [messages]);

  // Constants for size calculations
  const SIZE_CONSTANTS = {
    BASE_HEIGHT: 60,
    BUBBLE_PADDING: 20,
    MESSAGE_SPACING: 10,
    MAX_BUBBLE_WIDTH: 250,
    SYSTEM_MESSAGE_HEIGHT: 40,
    CHAR_PER_LINE: 35,
    LINE_HEIGHT: 20,
    REACTIONS_HEIGHT: 30,
    STATUS_INDICATOR_HEIGHT: 5,
    LINK_PREVIEW_TEXT_HEIGHT: 60,
    LINK_PREVIEW_NO_IMAGE_HEIGHT: 100,
    VIDEO_CONTROLS_HEIGHT: 50,
    AUDIO_PLAYER_HEIGHT: 80,
  };

  // Helper function to calculate image size from dimensions
  const calculateImageHeight = (pixelWidth: number, pixelHeight: number) => {
    const aspectRatio = pixelWidth / pixelHeight;
    return SIZE_CONSTANTS.MAX_BUBBLE_WIDTH / aspectRatio;
  };

  // Helper function to get image message size
  const getImageMessageSize = (item: TMessage) => {
    const payload = (item as any).payloads?.[0];

    if (payload?.thumbnails?.[2]) {
      const thumb = payload.thumbnails[2];
      const height = calculateImageHeight(thumb.pixelWidth, thumb.pixelHeight);
      return (
        SIZE_CONSTANTS.BASE_HEIGHT + height + SIZE_CONSTANTS.BUBBLE_PADDING
      );
    }

    if (payload?.previewThumbnail) {
      const preview = payload.previewThumbnail;
      const height = calculateImageHeight(
        preview.pixelWidth,
        preview.pixelHeight,
      );
      return (
        SIZE_CONSTANTS.BASE_HEIGHT + height + SIZE_CONSTANTS.BUBBLE_PADDING
      );
    }

    // Fallback for images without dimensions
    return 300;
  };

  // Helper function to get video message size
  const getVideoMessageSize = () => {
    const videoHeight = SIZE_CONSTANTS.MAX_BUBBLE_WIDTH * (9 / 16); // 16:9 aspect ratio
    return (
      SIZE_CONSTANTS.BASE_HEIGHT +
      videoHeight +
      SIZE_CONSTANTS.VIDEO_CONTROLS_HEIGHT +
      SIZE_CONSTANTS.BUBBLE_PADDING
    );
  };

  // Helper function to get audio message size
  const getAudioMessageSize = () => {
    return (
      SIZE_CONSTANTS.BASE_HEIGHT +
      SIZE_CONSTANTS.AUDIO_PLAYER_HEIGHT +
      SIZE_CONSTANTS.BUBBLE_PADDING
    );
  };

  // Helper function to extract text content from various formats
  const extractTextContent = (text: any): string => {
    if (Array.isArray(text)) {
      return text
        .map((block: any) => {
          if (block.children) {
            return block.children
              .map((child: any) => child.text || '')
              .join('');
          }
          return '';
        })
        .join('\n');
    }
    if (typeof text === 'string') {
      return text;
    }
    return '';
  };

  // Helper function to calculate text height
  const calculateTextHeight = (textContent: string): number => {
    const explicitLines = textContent.split('\n').length;
    const charsWithoutNewlines = textContent.replace(/\n/g, '').length;
    const estimatedLines = Math.max(
      explicitLines,
      Math.ceil(charsWithoutNewlines / SIZE_CONSTANTS.CHAR_PER_LINE),
    );
    return estimatedLines * SIZE_CONSTANTS.LINE_HEIGHT;
  };

  // Helper function to calculate link preview height
  const calculateLinkPreviewHeight = (
    item: TMessage,
    textContent: string,
  ): number => {
    if (!textContent.includes('http://') && !textContent.includes('https://')) {
      return 0;
    }

    const linkPayload = (item as any).payloads?.find(
      (p: any) => p.key === 'chat_links',
    );

    if (linkPayload?.previewThumbnail) {
      const preview = linkPayload.previewThumbnail;
      const previewHeight = calculateImageHeight(
        preview.pixelWidth,
        preview.pixelHeight,
      );
      return previewHeight + SIZE_CONSTANTS.LINK_PREVIEW_TEXT_HEIGHT;
    }

    return SIZE_CONSTANTS.LINK_PREVIEW_NO_IMAGE_HEIGHT;
  };

  // Helper function to get text message size
  const getTextMessageSize = (item: TMessage) => {
    const textContent = extractTextContent(item.text);
    const textHeight = calculateTextHeight(textContent);
    const linkPreviewHeight = calculateLinkPreviewHeight(item, textContent);

    return (
      SIZE_CONSTANTS.BASE_HEIGHT +
      textHeight +
      linkPreviewHeight +
      SIZE_CONSTANTS.BUBBLE_PADDING
    );
  };

  // Helper function to calculate additional elements height
  const getAdditionalElementsHeight = (item: TMessage): number => {
    let additionalHeight = 0;

    // Reactions
    if (
      (item as any).reactions &&
      Object.keys((item as any).reactions).length > 0
    ) {
      additionalHeight += SIZE_CONSTANTS.REACTIONS_HEIGHT;
    }

    // Delivery status indicator
    if ((item as any).fileMetadata?.appData?.content?.deliveryStatus) {
      additionalHeight += SIZE_CONSTANTS.STATUS_INDICATOR_HEIGHT;
    }

    // Message spacing
    additionalHeight += SIZE_CONSTANTS.MESSAGE_SPACING;

    return additionalHeight;
  };

  // Main getItemSize function
  const getItemSize = useCallback((_index: number, item: TMessage) => {
    // System messages are compact
    if (item.system) {
      return SIZE_CONSTANTS.SYSTEM_MESSAGE_HEIGHT;
    }

    let itemSize = 0;

    // Calculate base size based on message type
    if (item.image) {
      itemSize = getImageMessageSize(item);
    } else if (item.video) {
      itemSize = getVideoMessageSize();
    } else if (item.audio) {
      itemSize = getAudioMessageSize();
    } else if (item.text) {
      itemSize = getTextMessageSize(item);
    } else {
      // Default size for messages without content
      itemSize = SIZE_CONSTANTS.BASE_HEIGHT + SIZE_CONSTANTS.BUBBLE_PADDING;
    }

    // Add additional elements height
    itemSize += getAdditionalElementsHeight(item);

    return Math.ceil(itemSize);
  }, []);

  const renderItem = useCallback(
    ({
      item,
      index,
    }: LegendListRenderItemProps<TMessage>): React.ReactElement | null => {
      if (!item) {
        console.warn(
          '[MessageContainerLegend] renderItem: item is undefined/null at index',
          index,
        );
        return null;
      }

      const messageItem = item;

      if (!messageItem._id && messageItem._id !== 0)
        warning(
          'GiftedChat: `_id` is missing for message',
          JSON.stringify(item),
        );

      if (!messageItem.user) {
        if (!messageItem.system)
          warning(
            'GiftedChat: `user` is missing for message',
            JSON.stringify(messageItem),
          );
        messageItem.user = { _id: 0 };
      }

      const { messages, ...restProps } = props;

      if (messages && user) {
        const previousMessage = reversedMessages.messages[index + 1] || null;
        const nextMessage = reversedMessages.messages[index - 1] || null;

        const messageProps = {
          ...restProps,
          currentMessage: messageItem,
          previousMessage,
          nextMessage,
          position: messageItem.user._id === user._id ? 'right' : 'left',
          scrolledY,
          daysPositions,
          listHeight,
        } as const;

        return <ItemLegend<TMessage> {...messageProps} />;
      }

      return null;
    },
    [props, user, messages, renderMessageProp, daysPositions, reversedMessages],
  );

  return (
    <KeyboardGestureArea interpolator='ios' style={styles.container}>
      <LegendList
        ref={listRef}
        data={reversedMessages.messages}
        renderItem={renderItem as any}
        keyExtractor={keyExtractor as any}
        extraData={extraData}
        alignItemsAtEnd
        maintainScrollAtEnd
        maintainScrollAtEndThreshold={0.1}
        getEstimatedItemSize={getItemSize}
        maintainVisibleContentPosition
        initialScrollIndex={Math.max(0, reversedMessages.length - 1)}
        automaticallyAdjustContentInsets={false}
        onStartReached={onEndReached}
        onStartReachedThreshold={0.1}
        ListEmptyComponent={renderChatEmpty}
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        recycleItems
      />

      {isScrollToBottomEnabledFinal ? renderScrollToBottomWrapper() : null}
    </KeyboardGestureArea>
  );
}

export default MessageContainerLegend;
