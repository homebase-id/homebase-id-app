import { t } from 'feed-app-common';
import { Text } from '../../ui/Text/Text';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { memo } from 'react';

export const EmptyFeed = memo(() => {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <EmptyPostIllustration />
      <Text
        style={{
          opacity: 0.5,
          fontSize: 14,
          fontWeight: '500',
        }}
      >
        {t('No posts yet, send a post to your followers, or start following other identities')}
      </Text>
    </View>
  );
});

const EmptyPostIllustration = (props: { color?: string }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        display: 'flex',
        alignContent: 'center',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Svg
        width="700"
        height="300"
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 843 640"
        style={{
          marginLeft: 40,
        }}
      >
        <Path
          d="M602.65363,129.74161H226.33527a48.17928,48.17928,0,0,0-48.125,48.12512V619.74252a48.17923,48.17923,0,0,0,48.125,48.12506H602.65363a48.17923,48.17923,0,0,0,48.125-48.12506V177.86673A48.17928,48.17928,0,0,0,602.65363,129.74161Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[800] : Colors.gray[200]}
        />
        <Path
          d="M602.65412,143.59579H226.33527a34.30948,34.30948,0,0,0-34.271,34.27094V619.74252a34.30946,34.30946,0,0,0,34.271,34.27088H602.65412a34.30937,34.30937,0,0,0,34.27051-34.27088V177.86673A34.30938,34.30938,0,0,0,602.65412,143.59579Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.black : Colors.white}
        />
        <Path
          d="M546.01784,272.08142H355.71616a8.01411,8.01411,0,0,1,0-16.02822H546.01784a8.01411,8.01411,0,1,1,0,16.02822Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M579.07606,299.12906H355.71616a8.01412,8.01412,0,0,1,0-16.02823h223.3599a8.01412,8.01412,0,0,1,0,16.02823Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M546.01784,393.29489H355.71616a8.01411,8.01411,0,0,1,0-16.02822H546.01784a8.01411,8.01411,0,1,1,0,16.02822Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M579.07606,420.34253H355.71616a8.01412,8.01412,0,0,1,0-16.02823h223.3599a8.01412,8.01412,0,0,1,0,16.02823Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M546.01784,514.50836H355.71616a8.01411,8.01411,0,0,1,0-16.02823H546.01784a8.01412,8.01412,0,1,1,0,16.02823Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M579.07606,541.556H355.71616a8.01412,8.01412,0,0,1,0-16.02823h223.3599a8.01412,8.01412,0,0,1,0,16.02823Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M313.08745,311.40753H245.7415a3.847,3.847,0,0,1-3.84277-3.84277V247.61749a3.847,3.847,0,0,1,3.84277-3.84277h67.34595a3.847,3.847,0,0,1,3.84277,3.84277v59.94727A3.847,3.847,0,0,1,313.08745,311.40753Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M313.08745,432.621H245.7415a3.847,3.847,0,0,1-3.84277-3.84277V368.831a3.847,3.847,0,0,1,3.84277-3.84277h67.34595a3.847,3.847,0,0,1,3.84277,3.84277v59.94727A3.847,3.847,0,0,1,313.08745,432.621Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M313.08745,553.83447H245.7415a3.847,3.847,0,0,1-3.84277-3.84277V490.04443a3.847,3.847,0,0,1,3.84277-3.84277h67.34595a3.847,3.847,0,0,1,3.84277,3.84277V549.9917A3.847,3.847,0,0,1,313.08745,553.83447Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M934.16522,547.652l2.98548-26.10867,14.969-130.90768,2.98548-26.10867a48.17929,48.17929,0,0,0-42.34617-53.28082L573.09668,272.40642a48.17924,48.17924,0,0,0-53.28086,42.346l-.00771.06744L498.88352,497.81005l-.00771.06744a48.17923,48.17923,0,0,0,42.34611,53.2808L880.8843,589.99806A48.17929,48.17929,0,0,0,934.16522,547.652Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[800] : Colors.gray[200]}
        />
        <Path
          d="M920.40067,546.07857l3.5361-30.924,13.86792-121.278,3.536-30.92349a34.30948,34.30948,0,0,0-30.1556-37.94256L571.52276,286.17073a34.30948,34.30948,0,0,0-37.94245,30.15568l-.00771.06743L512.648,499.384l-.00776.06792A34.30934,34.30934,0,0,0,542.79584,537.394l339.66238,38.83977A34.30936,34.30936,0,0,0,920.40067,546.07857Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.black : Colors.white}
        />
        <Path
          d="M864.80353,380.15794l-189.0696-21.61976a8.01412,8.01412,0,1,1,1.82093-15.92446l189.0696,21.61976a8.01412,8.01412,0,0,1-1.82093,15.92446Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M894.5749,410.78613,672.6611,385.4107a8.01412,8.01412,0,1,1,1.82094-15.92446l221.91379,25.37544a8.01411,8.01411,0,0,1-1.82093,15.92445Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M888.38764,464.38258,561.218,426.97133a8.01412,8.01412,0,0,1,1.82093-15.92446l327.16968,37.41125a8.01412,8.01412,0,1,1-1.82094,15.92446Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M886.36619,491.37532l-328.221-37.53147a8.01412,8.01412,0,0,1,1.82093-15.92446l328.221,37.53147a8.01412,8.01412,0,0,1-1.82093,15.92446Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M882.36643,517.03944,555.19676,479.62819a8.01412,8.01412,0,1,1,1.82093-15.92446L884.18736,501.115a8.01412,8.01412,0,0,1-1.82093,15.92446Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M880.345,544.03218l-328.221-37.53147a8.01412,8.01412,0,0,1,1.82093-15.92446l328.221,37.53147a8.01412,8.01412,0,1,1-1.82093,15.92446Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.gray[600] : Colors.gray[100]}
        />
        <Path
          d="M628.91345,392.76672l-66.90992-7.651a3.847,3.847,0,0,1-3.38133-4.25447l6.81048-59.55914a3.847,3.847,0,0,1,4.25446-3.38133l66.90993,7.651a3.847,3.847,0,0,1,3.38132,4.25446l-6.81047,59.55915A3.847,3.847,0,0,1,628.91345,392.76672Z"
          transform="translate(-178.21027 -129.74161)"
          fill={isDarkMode ? Colors.indigo[700] : Colors.indigo[500]}
        />
      </Svg>
    </View>
  );
};
