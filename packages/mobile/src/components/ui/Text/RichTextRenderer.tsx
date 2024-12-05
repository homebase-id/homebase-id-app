import { PayloadDescriptor, RichText, TargetDrive } from '@homebase-id/js-lib/core';
import React, { memo, ReactNode, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { highlightQuery } from './HighlightQuery';
import { OdinImage } from '../OdinImage/OdinImage';
import { AuthorName } from '../Name';
import { calculateScaledDimensions, openURL } from '../../../utils/utils';
import { Text } from './Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';

export const RichTextRenderer = memo(
  ({
    body,
    odinId,
    options,
    renderElement: renderElementProp,
  }: {
    body: string | RichText | undefined;
    odinId?: string;
    options?: {
      imageDrive: TargetDrive;
      defaultFileId: string;
      defaultGlobalTransitId?: string;
      lastModified: number | undefined;
      previewThumbnails?: PayloadDescriptor[];
      query?: string;
    };
    renderElement?: (
      node: { type?: string; attributes?: Record<string, unknown> },
      children: ReactNode
    ) => ReactNode;
  }) => {
    const { isDarkMode } = useDarkMode();
    const renderLeaf = useCallback(
      (
        leaf: {
          text?: string;
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
          code?: boolean;
          strong?: boolean;
        },
        text: string,
        attributes: Record<string, unknown>
      ) => {
        let children: ReactNode = highlightQuery(text, options?.query);
        if (leaf.bold || leaf.strong) {
          children = <Text style={styles.bold}>{children}</Text>;
        }

        if (leaf.code) {
          children = <Text style={styles.code}>{children}</Text>;
        }

        if (leaf.italic) {
          children = <Text style={styles.italic}>{children}</Text>;
        }

        if (leaf.underline) {
          children = <Text style={styles.underline}>{children}</Text>;
        }

        return (
          <Text {...attributes} style={styles.leaf}>
            {children}
          </Text>
        );
      },
      [options?.query]
    );

    const renderElement = useCallback(
      (node: { type?: string; attributes?: Record<string, unknown> }, children: ReactNode) => {
        const { type, attributes } = node;
        switch (type) {
          case 'blockquote':
            return (
              <View style={styles.blockquote}>
                <Text>{children}</Text>
              </View>
            );
          case 'code_block':
            return (
              <View
                style={[
                  styles.codeBlock,
                  {
                    backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[100],
                  },
                ]}
              >
                <Text>{children}</Text>
              </View>
            );

          case 'h1':
            return <Text style={styles.h1}>{children}</Text>;
          case 'h2':
            return <Text style={styles.h2}>{children}</Text>;
          case 'ol': {
            return (
              <View style={styles.orderedList}>
                {React.Children.map(children, (child, index) => {
                  return (
                    <View key={index} style={styles.orderedListItem}>
                      <Text style={styles.listNumber}>{index + 1}.</Text>
                      <View style={styles.listItemContent}>{child}</View>
                    </View>
                  );
                })}
              </View>
            );
          }
          case 'ul': {
            return (
              <View style={styles.unorderedList}>
                {/* {React.Children.map(children, (child, index) => (
                  <View key={index} style={styles.unorderedListItem}>
                    <Text style={styles.bullet}>•</Text>
                    {child}
                  </View>
                ))} */}
                {children}
              </View>
            );
          }
          case 'li':
            return <Text style={styles.listItem}>{children}</Text>;
          case 'a':
            return (
              <Text
                style={{
                  ...styles.link,
                  color: isDarkMode ? Colors.indigo[200] : Colors.indigo[500],
                }}
                onPress={() => {
                  const url = attributes?.url as string;
                  if (url) openURL(url);
                }}
              >
                {children ?? (attributes?.text || attributes?.url) + ''}
              </Text>
            );
          case 'local_image':
            if (attributes && options) {
              const matchingPreviewThumbnail = options.previewThumbnails?.find(
                (payload) => payload.key === attributes.fileKey
              )?.previewThumbnail;
              const { width, height } = Dimensions.get('screen');
              const aspectRatio =
                (matchingPreviewThumbnail?.pixelWidth || 1) /
                (matchingPreviewThumbnail?.pixelHeight || 1);

              const { width: newWidth, height: newHeight } = calculateScaledDimensions(
                matchingPreviewThumbnail?.pixelWidth || 300,
                matchingPreviewThumbnail?.pixelHeight || 300,
                { width: width * 0.9, height: height * 0.9 }
              );

              return (
                <OdinImage
                  targetDrive={options.imageDrive}
                  fileId={(attributes.fileId as string) || options.defaultFileId}
                  globalTransitId={attributes.fileId ? undefined : options.defaultGlobalTransitId}
                  lastModified={options.lastModified}
                  fileKey={attributes.fileKey as string}
                  previewThumbnail={matchingPreviewThumbnail}
                  imageSize={{
                    width: newWidth,
                    height: newHeight,
                  }}
                  fit={'cover'}
                  style={{
                    aspectRatio,
                  }}
                  odinId={odinId}
                />
              );
            }
            return null;
          case 'link':
            if (attributes && 'linkText' in attributes && 'linkTarget' in attributes) {
              return (
                <TouchableOpacity
                  onPress={() => openURL(attributes.linkTarget as string)}
                  style={styles.actionLink}
                >
                  <Text
                    style={{
                      ...styles.actionLinkText,
                      color: isDarkMode ? Colors.indigo[200] : Colors.indigo[500],
                    }}
                  >
                    {attributes.linkText as string}
                  </Text>
                </TouchableOpacity>
              );
            }
            return null;
          case 'p':
          case 'paragraph':
            return <Text style={styles.paragraph}>{children}</Text>;
          case 'mention':
            if (attributes && 'value' in attributes && typeof attributes.value === 'string') {
              return (
                <Text
                  style={{
                    ...styles.link,
                    color: isDarkMode ? Colors.indigo[200] : Colors.indigo[500],
                  }}
                  onPress={() => openURL(`https://${attributes.value}`)}
                >
                  @<AuthorName odinId={attributes.value} />
                </Text>
              );
            }
            return null;
          default:
            return renderElementProp?.(node, children) || <Text {...attributes}>{children}</Text>;
        }
      },
      [isDarkMode, odinId, options, renderElementProp]
    );

    const render = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node: any): ReactNode => {
        if ('text' in node && (!('type' in node) || node.type === 'text')) {
          return renderLeaf(node, node.text, {});
        } else {
          const { type, ...attributes } = node;
          return renderElement(
            { type, attributes },
            node.children ? (
              <>
                {node.children.map((childNode: unknown, index: number) => (
                  <React.Fragment key={index}>{render(childNode)}</React.Fragment>
                ))}
              </>
            ) : undefined
          );
        }
      },
      [renderElement, renderLeaf]
    );

    if (!body || typeof body === 'string') {
      return <Text style={styles.paragraph}>{body}</Text>;
    }

    return body.map((element, index) => (
      <React.Fragment key={index}>{render(element)}</React.Fragment>
    ));
  }
);

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  orderedList: {
    marginBottom: 10,
  },
  unorderedList: {
    marginBottom: 10,
  },
  orderedListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  unorderedListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  listNumber: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  bullet: {
    marginRight: 5,
  },
  listItemContent: {
    flex: 1,
  },
  code: {
    padding: 4,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  blockquote: {
    borderLeftWidth: 4,
    paddingLeft: 10,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  codeBlock: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listItem: {
    marginBottom: 5,
  },
  link: {
    textDecorationLine: 'underline',
  },
  actionLink: {
    marginBottom: 10,
  },
  actionLinkText: {
    textDecorationLine: 'underline',
  },
  leaf: {
    // You can add common leaf styles here
  },
});
