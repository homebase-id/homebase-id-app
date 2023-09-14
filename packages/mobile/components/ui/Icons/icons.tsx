import { useDarkMode } from 'homebase-feed-app';
import { Path, Svg } from 'react-native-svg';
import { ReactNode } from 'react';
import { View } from 'react-native';

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

interface IconProps {
  size?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | number;
  color?: string;
}

const getSize = (
  size:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | number,
) => {
  const sizeNumber = typeof size === 'number' ? size : sizes[size] * 4;

  return {
    width: `${sizeNumber}px`,
    height: `${sizeNumber}px`,
  };
};

const Center = ({ children }: { children: ReactNode }) => (
  <View
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </View>
);

export const RecycleBin = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 448 512">
        <Path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z" />
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
        viewBox="0 0 512 512">
        <Path d="M32 32H480c17.7 0 32 14.3 32 32V96c0 17.7-14.3 32-32 32H32C14.3 128 0 113.7 0 96V64C0 46.3 14.3 32 32 32zm0 128H480V416c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V160zm128 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16s-7.2-16-16-16H176c-8.8 0-16 7.2-16 16z" />
      </Svg>
    </Center>
  );
};

export const OpenHearth = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512">
        <Path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9c0 0 0 0 0 0C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20c0 0-.1-.1-.1-.1c0 0 0 0 0 0c-23.1-25.9-58-37.7-92-31.2C81.6 101.5 48 142.1 48 189.5v3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268c20.9-19.4 32.8-46.7 32.8-75.2v-3.3c0-47.3-33.6-88-80.1-96.9c-34-6.5-69 5.4-92 31.2c0 0 0 0-.1 .1s0 0-.1 .1l-17.8 20c-.3 .4-.7 .7-1 1.1c-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z" />
      </Svg>
    </Center>
  );
};
export const SolidHearth = (props: IconProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Center>
      <Svg
        {...getSize(props.size || 'md')}
        color={props.color || (isDarkMode ? 'white' : 'black')}
        viewBox="0 0 512 512">
        <Path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z" />
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
        viewBox="0 0 576 512">
        <Path d="M576 32H96V384H576V32zM395.6 139.8l96 136L496 282v7.6 8 24H472 352 328 280 256 200 176v-24-8-9.1l6.1-6.8 64-72L264 181.5l17.9 20.2L299.1 221l57.3-81.2L376 112l19.6 27.8zM192 128a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM48 120V96H0v24V456v24H24 456h24V432H456 48V120z" />
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
        viewBox="0 0 512 512">
        <Path d="M0 32C0 14.3 14.3 0 32 0H96c17.7 0 32 14.3 32 32V96H0V32zm0 96H128V384H0V128zM0 416H128v64c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V416zM160 32c0-17.7 14.3-32 32-32h64c17.7 0 32 14.3 32 32V96H160V32zm0 96H288V384H160V128zm0 288H288v64c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V416zm203.6-19.9L320 232.6V142.8l100.4-26.9 66 247.4L363.6 396.1zM412.2 85L320 109.6V11l36.9-9.9c16.9-4.6 34.4 5.5 38.9 22.6L412.2 85zM371.8 427l122.8-32.9 16.3 61.1c4.5 17-5.5 34.5-22.5 39.1l-61.4 16.5c-16.9 4.6-34.4-5.5-38.9-22.6L371.8 427z" />
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
        viewBox="0 0 512 512">
        <Path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
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
        viewBox="0 0 512 512">
        <Path d="M224 80c0-26.5-21.5-48-48-48H80C53.5 32 32 53.5 32 80v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V80zm0 256c0-26.5-21.5-48-48-48H80c-26.5 0-48 21.5-48 48v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V336zM288 80v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48H336c-26.5 0-48 21.5-48 48zM480 336c0-26.5-21.5-48-48-48H336c-26.5 0-48 21.5-48 48v96c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48V336z" />
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
        viewBox="0 0 448 512">
        <Path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
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
        viewBox="0 0 448 512">
        <Path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
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
        viewBox="0 0 384 512">
        <Path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
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
        viewBox="0 0 512 512">
        <Path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
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
        viewBox="0 0 448 512">
        <Path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z" />
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
        viewBox="0 0 512 512">
        <Path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z" />
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
        viewBox="0 0 384 512">
        <Path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
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
        viewBox="0 0 512 512">
        <Path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" />
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
        viewBox="0 0 512 512">
        <Path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
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
        viewBox="0 0 512 512">
        <Path d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3l-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352H192c0 35.3 28.7 64 64 64s64-28.7 64-64H448c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V416c0-35.3 28.7-64 64-64zM432 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
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
        viewBox="0 0 448 512">
        <Path d="M0 64C0 46.3 14.3 32 32 32c229.8 0 416 186.2 416 416c0 17.7-14.3 32-32 32s-32-14.3-32-32C384 253.6 226.4 96 32 96C14.3 96 0 81.7 0 64zM0 416a64 64 0 1 1 128 0A64 64 0 1 1 0 416zM32 160c159.1 0 288 128.9 288 288c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-123.7-100.3-224-224-224c-17.7 0-32-14.3-32-32s14.3-32 32-32z" />
      </Svg>
    </Center>
  );
};
