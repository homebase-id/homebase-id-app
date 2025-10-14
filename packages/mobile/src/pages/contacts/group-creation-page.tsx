import { memo, useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItemInfo,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/ui/Form/Input';
import TextButton from '../../components/ui/Text/Text-Button';
import { GroupAvatar } from '../../components/ui/Avatars/Avatar';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { launchImageLibrary } from 'react-native-image-picker';
import { useConversation } from '../../hooks/chat/useConversation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList, NewChatStackParamList } from '../../app/ChatStack';
import { BackButton } from '../../components/ui/Buttons';
import { ContactTile } from '../../components/Contact/Contact-Tile';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { Text } from '../../components/ui/Text/Text';
import { Plus, Times } from '../../components/ui/Icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';

type GroupCreationPageProps = NativeStackScreenProps<NewChatStackParamList, 'CreateGroup'>;

export const GroupCreationPage = memo((props: GroupCreationPageProps) => {
  const { recipients } = props.route.params;
  const { navigation } = props;

  const [title, setTitle] = useState<string>('');
  const [asset, setAsset] = useState<ImageSource | undefined>();
  const [loading, setLoading] = useState(false);
  const { mutateAsync: createGroup } = useConversation().create;
  const nav = useNavigation<NavigationProp<ChatStackParamList>>();

  const onCreateGroup = useCallback(async () => {
    setLoading(true);
    const conversation = await createGroup({
      recipients: recipients.map((recipient) => recipient.odinId),
      title: title,
      image: asset,
      distribute: true,
    });
    if (conversation) {
      navigation.popToTop();
      navigation.goBack();

      setTimeout(() => {
        nav.navigate('ChatScreen', {
          convoId: conversation.fileMetadata.appData.uniqueId as string,
        });
      }, 100);
    }
    setLoading(false);
  }, [asset, createGroup, nav, navigation, recipients, title]);

  const pickAvatar = useCallback(async () => {
    if (asset) {
      setAsset(undefined);
      return;
    }
    const image = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (image.assets) {
      const pickedImage = image.assets[0];
      const imageSource: ImageSource = {
        uri: pickedImage.uri,
        type: pickedImage.type,
        height: pickedImage.height || 0,
        width: pickedImage.width || 0,
        filename: pickedImage.fileName || '',
        fileSize: pickedImage.fileSize,
      };
      setAsset(imageSource);
    }
  }, [asset]);

  const headerLeft = useCallback(
    (props: HeaderBackButtonProps) => {
      return BackButton({
        onPress: () => navigation.goBack(),
        prop: props,
        label: 'Back',
        style: { marginLeft: 10 },
      });
    },
    [navigation]
  );

  const headerRight = useCallback(() => {
    if (loading) {
      return <ActivityIndicator size={'small'} style={{ marginRight: 8 }} />;
    } else if (title?.length > 0) {
      return (
        <TextButton title="Create" unFilledStyle={{ marginRight: 8 }} onPress={onCreateGroup} />
      );
    }

    return undefined;
  }, [loading, onCreateGroup, title?.length]);

  const { isDarkMode } = useDarkMode();
  const headerColor = useMemo(
    () => (isDarkMode ? Colors.slate[900] : Colors.gray[50]),
    [isDarkMode]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DotYouProfile>) => <ContactTile item={item} disabled />,
    []
  );

  return (
    <>
      <Header
        title={'Create Group'}
        headerLeft={headerLeft}
        headerStatusBarHeight={Platform.OS === 'ios' ? 10 : 0}
        headerRight={headerRight}
        headerStyle={{
          backgroundColor: headerColor,
        }}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.avatar,
            {
              margin: 0,
              marginBottom: 16,
              marginTop: 16,
              position: 'relative',
              alignContent: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          {!asset ? (
            <GroupAvatar style={styles.avatar} iconSize={'2xl'} />
          ) : (
            <Image
              style={[
                styles.avatar,
                {
                  margin: 0,
                  marginBottom: 16,
                  marginTop: 16,
                  position: 'relative',
                  alignContent: 'center',
                  justifyContent: 'center',
                },
              ]}
              src={asset?.uri}
            />
          )}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: -2,
              right: -5,
              padding: 6,
              borderRadius: 50,
              backgroundColor: isDarkMode ? Colors.indigo[700] : Colors.indigo[200],
            }}
            onPress={pickAvatar}
          >
            {asset ? <Times /> : <Plus />}
          </TouchableOpacity>
        </View>
        <Input
          value={title}
          placeholder="Group Name (required)"
          onChangeText={(title) => setTitle(title)}
          autoCorrect={false}
          autoFocus={true}
          autoCapitalize="sentences"
          style={{
            width: '70%',
          }}
        />
      </View>
      <Text style={{ marginHorizontal: 16, marginVertical: 12, fontSize: 18, fontWeight: '500' }}>
        Members
      </Text>
      <FlatList
        data={recipients}
        keyExtractor={(item) => item.odinId}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </>
  );
});

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  avatar: {
    width: 81,
    height: 81,
    borderRadius: 50,
    margin: 16,
    marginRight: 0,
  },
});
