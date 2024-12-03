import { Circle, Path, Svg } from 'react-native-svg';
import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useDarkMode } from '../../../hooks/useDarkMode';

const sizes = {
  '2xs': 2,
  xs: 3,
  sm: 4,
  md: 5,
  lg: 6,
  xl: 7,
  '2xl': 8,
  '3xl': 9,
  '4xl': 10,
  '5xl': 12,
  '6xl': 16,
};

export interface IconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
  color?: string;
}

const getSize = (
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number
) => {
  const sizeNumber = typeof size === 'number' ? size : sizes[size] * 4;

  return {
    width: `${sizeNumber}px`,
    height: `${sizeNumber}px`,
  };
};

const Center = ({ children }: { children: ReactNode }) => (
  <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </View>
);

export const House = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        viewBox="0 0 576 512"
        color={props.color || (isDarkMode ? 'white' : 'black')}
      >
        <Path
          fill="currentColor"
          d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"
        />
      </Svg>
    </Center>
  );
};

export const ChatIcon = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4l0 0 0 0 0 0 0 0 .3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"
        />
      </Svg>
    </Center>
  );
};

export const SubtleCheck = (props: IconProps & { style?: StyleProp<ViewStyle> }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
        style={props.style}
      >
        <Path
          fill="currentColor"
          d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
        />
      </Svg>
    </Center>
  );
};

export const Clock = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"
        />
      </Svg>
    </Center>
  );
};

export const ComposeChat = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"
        />
      </Svg>
    </Center>
  );
};

export const SendChat = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"
        />
      </Svg>
    </Center>
  );
};

export const Info = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
        />
      </Svg>
    </Center>
  );
};

export const Microphone = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 384 512"
      >
        <Path
          fill="currentColor"
          d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"
        />
      </Svg>
    </Center>
  );
};

export const Stop = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 384 512"
      >
        <Path
          fill="currentColor"
          d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"
        />
      </Svg>
    </Center>
  );
};

export const Globe = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"
        />
      </Svg>
    </Center>
  );
};

export const QrIcon = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill={'currentColor'}
          d="M0 80C0 53.5 21.5 32 48 32h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80zM64 96v64h64V96H64zM0 336c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V336zm64 16v64h64V352H64zM304 32h96c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H304c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48zm80 64H320v64h64V96zM256 304c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s7.2-16 16-16s16 7.2 16 16v96c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s-7.2-16-16-16s-16 7.2-16 16v64c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V304zM368 480a16 16 0 1 1 0-32 16 16 0 1 1 0 32zm64 0a16 16 0 1 1 0-32 16 16 0 1 1 0 32z"
        />
      </Svg>
    </Center>
  );
};

export const ChevronRight = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <Path d="m9 18 6-6-6-6" />
      </Svg>
    </Center>
  );
};

export const CheckCircle = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
        />
      </Svg>
    </Center>
  );
};

export const CircleOutlined = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
        />
      </Svg>
    </Center>
  );
};

export const ExternalLink = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z" />
      </Svg>
    </Center>
  );
};

export const RecycleBin = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"
        />
      </Svg>
    </Center>
  );
};

export const Archive = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M32 32H480c17.7 0 32 14.3 32 32V96c0 17.7-14.3 32-32 32H32C14.3 128 0 113.7 0 96V64C0 46.3 14.3 32 32 32zm0 128H480V416c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V160zm128 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16s-7.2-16-16-16H176c-8.8 0-16 7.2-16 16z"
        />
      </Svg>
    </Center>
  );
};
export const Home = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 576 512"
      >
        <Path
          fill="currentColor"
          d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"
        />
      </Svg>
    </Center>
  );
};

export const OpenHeart = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9c0 0 0 0 0 0C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20c0 0-.1-.1-.1-.1c0 0 0 0 0 0c-23.1-25.9-58-37.7-92-31.2C81.6 101.5 48 142.1 48 189.5v3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268c20.9-19.4 32.8-46.7 32.8-75.2v-3.3c0-47.3-33.6-88-80.1-96.9c-34-6.5-69 5.4-92 31.2c0 0 0 0-.1 .1s0 0-.1 .1l-17.8 20c-.3 .4-.7 .7-1 1.1c-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z"
        />
      </Svg>
    </Center>
  );
};

export const Article = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M456 32h-304C121.1 32 96 57.13 96 88v320c0 13.22-10.77 24-24 24S48 421.2 48 408V112c0-13.25-10.75-24-24-24S0 98.75 0 112v296C0 447.7 32.3 480 72 480h352c48.53 0 88-39.47 88-88v-304C512 57.13 486.9 32 456 32zM464 392c0 22.06-17.94 40-40 40H139.9C142.5 424.5 144 416.4 144 408v-320c0-4.406 3.594-8 8-8h304c4.406 0 8 3.594 8 8V392zM264 272h-64C186.8 272 176 282.8 176 296S186.8 320 200 320h64C277.3 320 288 309.3 288 296S277.3 272 264 272zM408 272h-64C330.8 272 320 282.8 320 296S330.8 320 344 320h64c13.25 0 24-10.75 24-24S421.3 272 408 272zM264 352h-64c-13.25 0-24 10.75-24 24s10.75 24 24 24h64c13.25 0 24-10.75 24-24S277.3 352 264 352zM408 352h-64C330.8 352 320 362.8 320 376s10.75 24 24 24h64c13.25 0 24-10.75 24-24S421.3 352 408 352zM400 112h-192c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h192c17.67 0 32-14.33 32-32v-64C432 126.3 417.7 112 400 112z"
        />
      </Svg>
    </Center>
  );
};

export const Users = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <Path fill="currentColor" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <Circle fill="currentColor" cx="9" cy="7" r="4" />
        <Path fill="currentColor" d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <Path fill="currentColor" d="M16 3.13a4 4 0 0 1 0 7.75" />
      </Svg>
    </Center>
  );
};

export const Close = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"
        />
      </Svg>
    </Center>
  );
};

export const SolidHeart = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"
        />
      </Svg>
    </Center>
  );
};

export const Copy = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z"
        />
      </Svg>
    </Center>
  );
};

export const Trash = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"
        />
      </Svg>
    </Center>
  );
};

export const ShareNode = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9l-94.1 47C145.4 170.2 121.9 160 96 160c-53 0-96 43-96 96s43 96 96 96c25.9 0 49.4-10.2 66.6-26.9l94.1 47c-.5 3.9-.7 7.8-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.9 0-49.4 10.2-66.6 26.9l-94.1-47c.5-3.9 .7-7.8 .7-11.9s-.2-8-.7-11.9l94.1-47C302.6 213.8 326.1 224 352 224z"
        />
      </Svg>
    </Center>
  );
};

export const FloppyDisk = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"
        />
      </Svg>
    </Center>
  );
};

export const Forward = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304C0 417.3 81.5 467.9 100.2 478.1c2.5 1.4 5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7c0-7.5-4.3-14.4-9.8-19.5C108.8 431.9 96 414.4 96 384c0-53 43-96 96-96h96v64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144c-9.4-8.5-22.9-10.6-34.4-5.4z"
        />
      </Svg>
    </Center>
  );
};

export const TriangleExclamation = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
        />
      </Svg>
    </Center>
  );
};

export const Reply = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M205 34.8c11.5 5.1 19 16.6 19 29.2v64H336c97.2 0 176 78.8 176 176c0 113.3-81.5 163.9-100.2 174.1c-2.5 1.4-5.3 1.9-8.1 1.9c-10.9 0-19.7-8.9-19.7-19.7c0-7.5 4.3-14.4 9.8-19.5c9.4-8.8 22.2-26.4 22.2-56.7c0-53-43-96-96-96H224v64c0 12.6-7.4 24.1-19 29.2s-25 3-34.4-5.4l-160-144C3.9 225.7 0 217.1 0 208s3.9-17.7 10.6-23.8l160-144c9.4-8.5 22.9-10.6 34.4-5.4z"
        />
      </Svg>
    </Center>
  );
};

export const Images = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 576 512"
      >
        <Path
          fill="currentColor"
          d="M576 32H96V384H576V32zM395.6 139.8l96 136L496 282v7.6 8 24H472 352 328 280 256 200 176v-24-8-9.1l6.1-6.8 64-72L264 181.5l17.9 20.2L299.1 221l57.3-81.2L376 112l19.6 27.8zM192 128a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM48 120V96H0v24V456v24H24 456h24V432H456 48V120z"
        />
      </Svg>
    </Center>
  );
};

export const Logout = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
        />
      </Svg>
    </Center>
  );
};

export const ImageLibrary = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 576 512"
      >
        <Path
          fill="currentColor"
          d="M160 80H512c8.8 0 16 7.2 16 16V320c0 8.8-7.2 16-16 16H490.8L388.1 178.9c-4.4-6.8-12-10.9-20.1-10.9s-15.7 4.1-20.1 10.9l-52.2 79.8-12.4-16.9c-4.5-6.2-11.7-9.8-19.4-9.8s-14.8 3.6-19.4 9.8L175.6 336H160c-8.8 0-16-7.2-16-16V96c0-8.8 7.2-16 16-16zM96 96V320c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H160c-35.3 0-64 28.7-64 64zM48 120c0-13.3-10.7-24-24-24S0 106.7 0 120V344c0 75.1 60.9 136 136 136H456c13.3 0 24-10.7 24-24s-10.7-24-24-24H136c-48.6 0-88-39.4-88-88V120zm208 24a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
        />
      </Svg>
    </Center>
  );
};

export const Pdf = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z"
        />
      </Svg>
    </Center>
  );
};

export const Cog = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
        />
      </Svg>
    </Center>
  );
};
export const Grid = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M224 80c0-26.5-21.5-48-48-48H80C53.5 32 32 53.5 32 80v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V80zm0 256c0-26.5-21.5-48-48-48H80c-26.5 0-48 21.5-48 48v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V336zM288 80v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48H336c-26.5 0-48 21.5-48 48zM480 336c0-26.5-21.5-48-48-48H336c-26.5 0-48 21.5-48 48v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V336z"
        />
      </Svg>
    </Center>
  );
};
export const Plus = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
        />
      </Svg>
    </Center>
  );
};

export const SqaurePlus = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M64 80c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16l0-320c0-8.8-7.2-16-16-16L64 80zM0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM200 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"
        />
      </Svg>
    </Center>
  );
};

export const Profile = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"
        />
      </Svg>
    </Center>
  );
};

export const XIcon = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 384 512"
      >
        <Path
          fill="currentColor"
          d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"
        />
      </Svg>
    </Center>
  );
};

export const Times = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 384 512"
      >
        <Path
          fill="currentColor"
          d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
        />
      </Svg>
    </Center>
  );
};
export const Pencil = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"
        />
      </Svg>
    </Center>
  );
};
export const Ellipsis = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z"
        />
      </Svg>
    </Center>
  );
};

export const EllipsisVertical = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 128 512"
      >
        <Path
          fill="currentColor"
          d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
        />
      </Svg>
    </Center>
  );
};

export const Sun = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"
        />
      </Svg>
    </Center>
  );
};

export const Sync = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"
        />
      </Svg>
    </Center>
  );
};
export const Play = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 384 512"
      >
        <Path
          fill="currentColor"
          d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
        />
      </Svg>
    </Center>
  );
};
export const Camera = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"
        />
      </Svg>
    </Center>
  );
};

export const Download = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"
        />
      </Svg>
    </Center>
  );
};

export const PaperClip = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M364.2 83.8c-24.4-24.4-64-24.4-88.4 0l-184 184c-42.1 42.1-42.1 110.3 0 152.4s110.3 42.1 152.4 0l152-152c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-152 152c-64 64-167.6 64-231.6 0s-64-167.6 0-231.6l184-184c46.3-46.3 121.3-46.3 167.6 0s46.3 121.3 0 167.6l-176 176c-28.6 28.6-75 28.6-103.6 0s-28.6-75 0-103.6l144-144c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-144 144c-6.7 6.7-6.7 17.7 0 24.4s17.7 6.7 24.4 0l176-176c24.4-24.4 24.4-64 0-88.4z"
        />
      </Svg>
    </Center>
  );
};

export const Upload = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3l-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352H192c0 35.3 28.7 64 64 64s64-28.7 64-64H448c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V416c0-35.3 28.7-64 64-64zM432 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"
        />
      </Svg>
    </Center>
  );
};

export const Feed = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M0 64C0 46.3 14.3 32 32 32c229.8 0 416 186.2 416 416c0 17.7-14.3 32-32 32s-32-14.3-32-32C384 253.6 226.4 96 32 96C14.3 96 0 81.7 0 64zM0 416a64 64 0 1 1 128 0A64 64 0 1 1 0 416zM32 160c159.1 0 288 128.9 288 288c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-123.7-100.3-224-224-224c-17.7 0-32-14.3-32-32s14.3-32 32-32z"
        />
      </Svg>
    </Center>
  );
};

export const AddressBook = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M96 0C60.7 0 32 28.7 32 64V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H96zM208 288h64c44.2 0 80 35.8 80 80c0 8.8-7.2 16-16 16H144c-8.8 0-16-7.2-16-16c0-44.2 35.8-80 80-80zm96-96c0 35.3-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64zM512 80c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V80zM496 192c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm16 144c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V336z"
        />
      </Svg>
    </Center>
  );
};

export const People = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        stroke={props.color || (isDarkMode ? 'white' : 'black')}
        strokeLinejoin="round"
        strokeWidth={2}
        fill={'none'}
        color={props.color || (isDarkMode ? 'white' : 'black')}
      >
        <Path fill="currentColor" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <Circle cx="9" cy="7" r="4" fill="currentColor" />
        <Path fill="currentColor" d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
      </Svg>
    </Center>
  );
};

export const Bars = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"
        />
      </Svg>
    </Center>
  );
};

export const ArrowLeft = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M7.4 273.4C2.7 268.8 0 262.6 0 256s2.7-12.8 7.4-17.4l176-168c9.6-9.2 24.8-8.8 33.9 .8s8.8 24.8-.8 33.9L83.9 232 424 232c13.3 0 24 10.7 24 24s-10.7 24-24 24L83.9 280 216.6 406.6c9.6 9.2 9.9 24.3 .8 33.9s-24.3 9.9-33.9 .8l-176-168z"
        />
      </Svg>
    </Center>
  );
};
export const ArrowDown = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 384 512"
      >
        <Path
          fill={'currentColor'}
          d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"
        />
      </Svg>
    </Center>
  );
};

export const Lol = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 512 512"
    >
      <Path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM388.1 312.8c12.3-3.8 24.3 6.9 19.3 18.7C382.4 390.6 324.2 432 256.3 432s-126.2-41.4-151.1-100.5c-5-11.8 7-22.5 19.3-18.7c39.7 12.2 84.5 19 131.8 19s92.1-6.8 131.8-19zM208 192c0 35.3-14.3 64-32 64s-32-28.7-32-64s14.3-64 32-64s32 28.7 32 64zm128 64c-17.7 0-32-28.7-32-64s14.3-64 32-64s32 28.7 32 64s-14.3 64-32 64z" />
    </Svg>
  );
};

export const OpenLock = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 576 512"
    >
      <Path
        fill="currentColor"
        d="M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80v48c0 17.7 14.3 32 32 32s32-14.3 32-32V144C576 64.5 511.5 0 432 0S288 64.5 288 144v48H64c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64H352V144z"
      />
    </Svg>
  );
};

export const Lock = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 448 512"
    >
      <Path
        fill="currentColor"
        d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"
      />
    </Svg>
  );
};

export const Comment = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.7 0 208-80.5 208-160s-83.3-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6c-15.1 6.6-32.3 12.6-50.1 16.1c-.8 .2-1.6 .3-2.4 .5c-4.4 .8-8.7 1.5-13.2 1.9c-.2 0-.5 .1-.7 .1c-5.1 .5-10.2 .8-15.3 .8c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c4.1-4.2 7.8-8.7 11.3-13.5c1.7-2.3 3.3-4.6 4.8-6.9l.3-.5z"
        />
      </Svg>
    </Center>
  );
};
export const Bell = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512"
      >
        <Path
          fill="currentColor"
          d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416l400 0c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4l0-25.4c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm0 96c61.9 0 112 50.1 112 112l0 25.4c0 47.9 13.9 94.6 39.7 134.6L72.3 368C98.1 328 112 281.3 112 233.4l0-25.4c0-61.9 50.1-112 112-112zm64 352l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"
        />
      </Svg>
    </Center>
  );
};

export const Gear = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
        />
      </Svg>
    </Center>
  );
};

export const CircleExclamation = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512"
      >
        <Path
          fill="currentColor"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"
        />
      </Svg>
    </Center>
  );
};

export const WhatsApp = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 448 512"
    >
      <Path
        fill="currentColor"
        d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
      />
    </Svg>
  );
};

export const Facebook = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <Path
        fill="currentColor"
        d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
      />
    </Svg>
  );
};

export const XTwitter = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 512 512"
    >
      <Path
        fill="currentColor"
        d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"
      />
    </Svg>
  );
};

export const LinkedIn = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 448 512"
    >
      <Path
        fill="currentColor"
        d="M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"
      />
    </Svg>
  );
};

export const Reddit = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 512 512"
    >
      <Path
        fill="currentColor"
        d="M201.5 305.5c-13.8 0-24.9-11.1-24.9-24.6 0-13.8 11.1-24.9 24.9-24.9 13.6 0 24.6 11.1 24.6 24.9 0 13.6-11.1 24.6-24.6 24.6zM504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-132.3-41.2c-9.4 0-17.7 3.9-23.8 10-22.4-15.5-52.6-25.5-86.1-26.6l17.4-78.3 55.4 12.5c0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.3 24.9-24.9s-11.1-24.9-24.9-24.9c-9.7 0-18 5.8-22.1 13.8l-61.2-13.6c-3-.8-6.1 1.4-6.9 4.4l-19.1 86.4c-33.2 1.4-63.1 11.3-85.5 26.8-6.1-6.4-14.7-10.2-24.1-10.2-34.9 0-46.3 46.9-14.4 62.8-1.1 5-1.7 10.2-1.7 15.5 0 52.6 59.2 95.2 132 95.2 73.1 0 132.3-42.6 132.3-95.2 0-5.3-.6-10.8-1.9-15.8 31.3-16 19.8-62.5-14.9-62.5zM302.8 331c-18.2 18.2-76.1 17.9-93.6 0-2.2-2.2-6.1-2.2-8.3 0-2.5 2.5-2.5 6.4 0 8.6 22.8 22.8 87.3 22.8 110.2 0 2.5-2.2 2.5-6.1 0-8.6-2.2-2.2-6.1-2.2-8.3 0zm7.7-75c-13.6 0-24.6 11.1-24.6 24.9 0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.1 24.9-24.6 0-13.8-11-24.9-24.9-24.9z"
      />
    </Svg>
  );
};

export const ChainLink = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 640 512"
    >
      <Path
        fill="currentColor"
        d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"
      />
    </Svg>
  );
};

export const SignalMessenger = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 512 512"
    >
      <Path
        fill="currentColor"
        d="M194.6 7.5l5.8 23.3C177.7 36.3 156 45.3 136 57.4L123.7 36.8c22-13.3 45.9-23.2 70.9-29.3zm122.9 0l-5.8 23.3C334.3 36.3 356 45.3 376 57.4l12.4-20.6c-22-13.3-46-23.2-71-29.3zM36.8 123.7c-13.3 22-23.2 45.9-29.3 70.9l23.3 5.8C36.3 177.7 45.3 156 57.4 136L36.8 123.7zM24 256c0-11.6 .9-23.3 2.6-34.8L2.9 217.6c-3.8 25.4-3.8 51.3 0 76.7l23.7-3.6C24.9 279.3 24 267.6 24 256zM388.3 475.2L376 454.6c-20 12.1-41.6 21-64.2 26.6l5.8 23.3c24.9-6.2 48.8-16 70.8-29.3zM488 256c0 11.6-.9 23.3-2.6 34.8l23.7 3.6c3.8-25.4 3.8-51.3 0-76.7l-23.7 3.6c1.7 11.5 2.6 23.1 2.6 34.8zm16.5 61.4l-23.3-5.8c-5.6 22.7-14.5 44.3-26.6 64.3l20.6 12.4c13.3-22 23.2-46 29.3-71zm-213.8 168c-23 3.5-46.5 3.5-69.5 0l-3.6 23.7c25.4 3.8 51.3 3.8 76.7 0l-3.6-23.7zm152-91.8c-13.8 18.7-30.4 35.3-49.2 49.1l14.2 19.3c20.7-15.2 39-33.4 54.2-54.1l-19.3-14.4zM393.6 69.2c18.8 13.8 35.3 30.4 49.2 49.2L462.1 104C446.9 83.4 428.6 65.1 408 49.9L393.6 69.2zM69.2 118.4c13.8-18.8 30.4-35.3 49.2-49.2L104 49.9C83.4 65.1 65.1 83.4 49.9 104l19.3 14.4zm406 5.3L454.6 136c12.1 20 21 41.6 26.6 64.2l23.3-5.8c-6.2-24.9-16-48.8-29.3-70.8zm-254-97.1c23-3.5 46.5-3.5 69.5 0l3.6-23.7C268.9-1 243.1-1 217.6 2.9l3.6 23.7zM81.6 468.4L32 480l11.6-49.6L20.2 425 8.6 474.5c-.9 4-.8 8.1 .3 12.1s3.2 7.5 6.1 10.4s6.5 5 10.4 6.1s8.1 1.2 12.1 .3L87 492l-5.4-23.6zM25.2 403.6L48.6 409l8-34.4c-11.7-19.6-20.4-40.8-25.8-63L7.5 317.4c5.2 21.2 13.2 41.7 23.6 60.8l-5.9 25.3zm112 52l-34.4 8 5.4 23.4 25.3-5.9c19.2 10.4 39.6 18.4 60.8 23.6l5.8-23.3c-22.1-5.5-43.3-14.3-62.8-26l-.2 .2zM256 48c-37.2 0-73.6 10-105.6 28.9s-58.4 46-76.3 78.6s-26.9 69.3-25.8 106.4s12 73.3 31.8 104.8L60 452l85.3-20c27.3 17.2 58.2 27.8 90.3 31s64.5-1.1 94.6-12.6s57.2-29.8 79-53.6s37.8-52.2 46.8-83.2s10.5-63.6 4.7-95.3s-19-61.6-38.4-87.4s-44.5-46.7-73.4-61S288.3 48 256 48z"
      />
    </Svg>
  );
};

export const ShareUpArrow = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 448 512"
    >
      <Path
        fill="currentColor"
        d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z"
      />
    </Svg>
  );
};

export const Flag = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 448 512"
    >
      <Path
        fill="currentColor"
        d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32L0 64 0 368 0 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128 64.3-16.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30l0-247.7c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L64 48l0-16z"
      />
    </Svg>
  );
};

export const Block = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 512 512"
    >
      <Path
        fill="currentColor"
        d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
      />
    </Svg>
  );
};

export const Share = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Svg
      {...getSize(props.size || 'md')}
      color={props.color || (isDarkMode ? 'white' : 'black')}
      viewBox="0 0 512 449"
    >
      <Path
        d="M315.311 21.56C315.356 21.5399 315.401 21.5197 315.446 21.4993C319.513 19.6603 324.298 20.3938 327.651 23.4255L327.686 23.4577L487.686 167.458L487.711 167.48C490.141 169.66 491.5 172.696 491.5 176.02C491.5 179.197 490.148 182.324 487.632 184.631C487.621 184.641 487.61 184.651 487.599 184.662L327.74 328.534C327.734 328.54 327.728 328.545 327.721 328.551C324.359 331.543 319.545 332.342 315.251 330.454C311.18 328.664 308.5 324.583 308.5 320.02V256.02C308.5 244.698 299.322 235.52 288 235.52H192C127.678 235.52 75.5 287.698 75.5 352.02C75.5 389.02 91.3771 411.655 104.106 423.706C104.157 423.755 104.209 423.804 104.261 423.852C105.041 424.575 105.675 425.283 106.17 425.934C84.3724 413.039 20.5 367.293 20.5 272.02C20.5 186.142 90.1218 116.52 176 116.52H288C299.322 116.52 308.5 107.342 308.5 96.0201V32.0201C308.5 27.5426 311.208 23.3794 315.311 21.56ZM107.503 428.393C107.503 428.394 107.503 428.39 107.502 428.382C107.503 428.389 107.503 428.392 107.503 428.393Z"
        stroke="currentColor"
        strokeWidth="41"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};
