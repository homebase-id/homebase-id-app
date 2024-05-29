import { NewPayloadDescriptor, PayloadDescriptor, TargetDrive } from '@youfoundation/js-lib/core';
import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, View } from 'react-native';
import { Download, Pdf } from '../Icons/icons';
import { Text } from '../Text/Text';
import { getPayloadSize } from '../../../utils/utils';
import { useFile } from '../../../hooks/file/useFile';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { OdinBlob } from '../../../../polyfills/OdinBlob';
import { Colors } from '../../../app/Colors';

//TODO: Fix theme on Boring file
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
    const [blob, setBlob] = useState<OdinBlob | null>(null);

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
              uri,
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
            width: 150,
            flexDirection: 'row',
            padding: 12,
          }}
        >
          <Pdf color={overwriteTextColor ? Colors.white : undefined} />
          <View
            style={{
              marginLeft: 12,
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={StyleSheet.flatten([
                {
                  fontSize: 16,
                },
                overwriteTextColor ? { color: Colors.white } : {},
              ])}
            >
              {getPayloadSize(file.bytesWritten || 0)}
            </Text>
            {!blob && !loading && (
              <Download color={overwriteTextColor ? Colors.white : undefined} />
            )}
            {loading && <ActivityIndicator color={overwriteTextColor ? Colors.white : undefined} />}
          </View>
        </View>
      </Pressable>
    );
  }
);
