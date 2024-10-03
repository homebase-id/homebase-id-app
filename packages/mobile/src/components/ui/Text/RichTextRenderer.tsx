import { PayloadDescriptor, RichText, TargetDrive } from '@homebase-id/js-lib/core';
import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { highlightQuery } from './HighlightQuery';
import { OdinImage } from '../OdinImage/OdinImage';
import { AuthorName } from '../Name';
import { openURL } from '../../../utils/utils';
import { Text } from './Text';

export const RichTextRenderer = ({
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
  if (!body || typeof body === 'string') {
    return <Text style={styles.paragraph}>{body}</Text>;
  }

  const render = (node: any): ReactNode => {
    if ('text' in node && (!('type' in node) || node.type === 'text')) {
      return renderLeaf(node, node.text, {});
    } else {
      const { type, ...attributes } = node;

      return renderElement(
        { type, attributes },
        node.children ? (
          <>
            {node.children.map((childNode: any, index: number) => (
              <React.Fragment key={index}>{render(childNode)}</React.Fragment>
            ))}
          </>
        ) : undefined
      );
    }
  };

  const renderLeaf = (
    leaf: { text?: string; bold?: boolean; italic?: boolean; underline?: boolean; code?: boolean },
    text: string,
    attributes: Record<string, unknown>
  ) => {
    let children: ReactNode = highlightQuery(text, options?.query);

    if (leaf.bold) {
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
  };

  const renderElement = (
    node: { type?: string; attributes?: Record<string, unknown> },
    children: ReactNode
  ) => {
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
          <View style={styles.codeBlock}>
            <Text>{children}</Text>
          </View>
        );

      case 'h1':
        return <Text style={styles.h1}>{children}</Text>;
      case 'h2':
        return <Text style={styles.h2}>{children}</Text>;
      case 'ol':
        return <View style={styles.orderedList}>{children}</View>;
      case 'ul':
        return <View style={styles.unorderedList}>{children}</View>;
      case 'li':
        return <Text style={styles.listItem}>• {children}</Text>;
      case 'a':
        return (
          <Text
            style={styles.link}
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

          return (
            <View style={matchingPreviewThumbnail ? {} : styles.imagePlaceholder}>
              <OdinImage
                targetDrive={options.imageDrive}
                fileId={(attributes.fileId as string) || options.defaultFileId}
                globalTransitId={attributes.fileId ? undefined : options.defaultGlobalTransitId}
                lastModified={options.lastModified}
                fileKey={attributes.fileKey as string}
                previewThumbnail={matchingPreviewThumbnail}
                odinId={odinId}
              />
            </View>
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
              <Text style={styles.actionLinkText}>{attributes.linkText as string}</Text>
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
            <Text style={styles.link} onPress={() => openURL(`https://${attributes.value}`)}>
              @<AuthorName odinId={attributes.value} />
            </Text>
          );
        }
        return null;
      default:
        return renderElementProp?.(node, children) || <Text {...attributes}>{children}</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {body.map((element, index) => (
        <React.Fragment key={index}>{render(element)}</React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
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
  code: {
    backgroundColor: '#e1e1e1',
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
    backgroundColor: '#f5f5f5',
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
  orderedList: {
    paddingLeft: 20,
  },
  unorderedList: {
    paddingLeft: 20,
  },
  listItem: {
    marginBottom: 5,
  },
  link: {
    color: '#1e90ff',
    textDecorationLine: 'underline',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 300,
  },
  actionLink: {
    marginBottom: 10,
  },
  actionLinkText: {
    color: '#1e90ff',
    textDecorationLine: 'underline',
  },
  leaf: {
    // You can add common leaf styles here
  },
});
