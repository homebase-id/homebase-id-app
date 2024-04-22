import { ScrollView, View, ImageBackground, TouchableOpacity } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { Close, Play } from '../ui/Icons/icons';
import React, { memo } from 'react';
import { Colors } from '../../app/Colors';

export const FileOverview = memo(
  ({ assets, setAssets }: { assets: Asset[]; setAssets: (newAssets: Asset[]) => void }) => {
    return (
      <ScrollView
        horizontal
        contentContainerStyle={{
          gap: 2,
        }}
        showsHorizontalScrollIndicator={false}
      >
        {assets.map((value, index) => {
          const isVideo = value.type?.startsWith('video') ?? false;
          return (
            <View
              key={index}
              style={{
                borderRadius: 15,
              }}
            >
              {isVideo ? (
                <View
                  style={{
                    backgroundColor: Colors.slate[200],
                    width: 65,
                    height: 65,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={'md'} color={Colors.slate[800]} />
                  <TouchableOpacity
                    onPress={() => setAssets(assets.filter((_, i) => i !== index))}
                    style={{ position: 'absolute', top: 4, right: 4 }}
                  >
                    <Close size={'sm'} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <ImageBackground
                  key={index}
                  source={{ uri: value.uri || value.originalPath }}
                  style={{
                    width: 65,
                    height: 65,
                    alignItems: 'flex-end',
                    padding: 4,
                  }}
                >
                  <TouchableOpacity onPress={() => setAssets(assets.filter((_, i) => i !== index))}>
                    <Close size={'sm'} color="white" />
                  </TouchableOpacity>
                </ImageBackground>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }
);