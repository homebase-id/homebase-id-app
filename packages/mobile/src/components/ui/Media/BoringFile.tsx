import { NewPayloadDescriptor, PayloadDescriptor, TargetDrive } from '@homebase-id/js-lib/core';
import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Apk, Download, Excel, File, FileCode, FileZip, Pdf, WordFile } from '../Icons/icons';
import { Text } from '../Text/Text';
import { getPayloadSize } from '../../../utils/utils';
import { useFile } from '../../../hooks/file/useFile';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { OdinBlob } from '../../../../polyfills/OdinBlob';
import { Colors } from '../../../app/Colors';

export const BoringFile = memo(
  ({
    odinId,
    targetDrive,
    fileId,
    file,
    overwriteTextColor,
  }: {
    odinId: string | undefined;
    targetDrive: TargetDrive;
    fileId: string;
    overwriteTextColor?: boolean;
    file: PayloadDescriptor | NewPayloadDescriptor;
  }) => {
    const { fetchFile, downloadFile } = useFile({ targetDrive });
    const [loading, setLoading] = useState(false);
    const [blob, setBlob] = useState<OdinBlob | null>(
      'pendingFile' in file ? (file.pendingFile as unknown as OdinBlob) : null
    );

    const isPending = 'pendingFile' in file;

    const progressPercentage = Math.round(
      ((file as NewPayloadDescriptor)?.uploadProgress?.progress || 0) * 100
    );

    const openDocument = useCallback(
      async (payload?: OdinBlob) => {
        if (!blob && !payload) {
          console.error('No file to open');
          return;
        }
        const uri = blob?.uri || payload?.uri;
        if (!uri) {
          return;
        }
        if (Platform.OS === 'ios') {
          await ReactNativeBlobUtil.ios.openDocument(uri);
        } else if (Platform.OS === 'android') {
          try {
            await ReactNativeBlobUtil.android.actionViewIntent(
              uri.replace('file://', ''), // Android requires the file path without the file:// prefix
              blob?.type || payload?.type || 'application/pdf'
            );
          } catch (error) {
            console.error('Error opening document', error);
          }
        }
      },
      [blob]
    );

    const downloadAndOpen = useCallback(async () => {
      setLoading(true);
      const payload = await downloadFile(odinId, fileId, file.key);
      setLoading(false);
      if (!payload) return;
      else {
        setBlob(payload);
        await openDocument(payload);
      }
    }, [downloadFile, file.key, fileId, odinId, openDocument]);

    useEffect(() => {
      const prefetchFile = async () => {
        if (!file.contentType) return;
        setLoading(true);
        const localFile = await fetchFile(fileId, file.contentType);
        setLoading(false);
        if (localFile) {
          setBlob(localFile);
        }
      };
      if (!blob) {
        prefetchFile();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blob, file.contentType, fileId]);

    return (
      <Pressable onPress={blob ? async (_) => await openDocument() : downloadAndOpen}>
        <View
          style={{
            flexDirection: 'row',
            minWidth: 200,
            padding: 12,
          }}
        >
          <BoringFileIcon
            fileType={file.contentType || ''}
            color={overwriteTextColor ? Colors.white : undefined}
            size={'lg'}
          />
          <View
            style={{
              marginLeft: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              flex: 1,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={StyleSheet.flatten([
                  {
                    fontSize: 16,
                  },
                  overwriteTextColor ? { color: Colors.white } : {},
                ])}
              >
                {file.descriptorContent}
              </Text>
              <Text
                style={StyleSheet.flatten([
                  {
                    fontSize: 14,
                  },
                  overwriteTextColor ? { color: Colors.white } : {},
                ])}
              >
                {getPayloadSize(file.bytesWritten || 0)}
              </Text>
            </View>
            {!blob && !loading && (
              <Download color={overwriteTextColor ? Colors.white : undefined} />
            )}
            {(loading || isPending) && (
              <ActivityIndicator color={overwriteTextColor ? Colors.white : undefined} />
            )}
          </View>
        </View>
      </Pressable>
    );
  }
);

export const BoringFileIcon = ({
  fileType,
  ...rest
}: {
  fileType: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
}) => {
  switch (fileType) {
    case 'application/pdf':
      return <Pdf {...rest} />;
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return <WordFile {...rest} />;
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return <Excel {...rest} />;
    case 'video/mp4':
    case 'application/zip':
    case 'application/x-rar-compressed':
      return <FileZip {...rest} />;
    case 'application/javascript':
    case 'application/json':
      return <FileCode {...rest} />;
    case 'application/vnd.android.package-archive':
      return <Apk {...rest} />;
    default:
      return <File />;
  }
};
