import { Defs, Path, Rect, Stop, Svg } from 'react-native-svg';
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

export interface BrandIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
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

export const Homebase = (props: BrandIconProps) => {
  return (
    <Center>
      <Svg {...getSize(props.size || 'md')} viewBox="0 0 919 919" fill="none">
        <Rect width="919" height="919" rx="80" fill="url(#paint0_linear_436_22)" />
        <Path
          d="M751.659 201.195C751.659 260.326 703.724 308.261 644.594 308.261C585.463 308.261 537.528 260.326 537.528 201.195C537.528 142.065 585.463 94.1299 644.594 94.1299C703.724 94.1299 751.659 142.065 751.659 201.195Z"
          fill="white"
        />
        <Path
          d="M154.832 193.591C154.832 139.084 200.302 94.8972 256.393 94.8972C312.483 94.8972 357.953 139.084 357.953 193.591V352.514H663.528C690.471 352.514 714.879 363.602 732.621 381.554C750.608 399.301 761.719 423.733 761.719 450.705V727.448C761.719 781.677 716.804 825.638 661.397 825.638C605.991 825.638 561.075 781.677 561.075 727.448V600.223H560.18C556.131 547.954 512.433 506.801 459.125 506.801C405.816 506.801 362.119 547.953 358.069 600.223H357.953V601.891C357.827 603.966 357.762 606.057 357.762 608.163V733.045C354.52 784.711 310.375 825.638 256.393 825.638C200.302 825.638 154.832 781.452 154.832 726.944V193.591Z"
          fill="white"
        />
        <Defs>
          <linearGradient
            id="paint0_linear_436_22"
            x1="795.951"
            y1="986.767"
            x2="375.677"
            y2="-58.4083"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.265" stop-color="#191272" />
            <Stop offset="1" stop-color="#ED0342" />
          </linearGradient>
        </Defs>
      </Svg>
    </Center>
  );
};
export const HomebaseChat = (props: BrandIconProps) => {
  return (
    <Center>
      <Svg {...getSize(props.size || 'md')} viewBox="0 0 919 919" fill="none">
        <Rect width="919" height="919" rx="80" fill="url(#paint0_linear_410_40)" />
        <Path
          d="M718 443.857C718 559.783 602.511 653.714 460.015 653.714C422.627 653.714 387.154 647.257 355.108 635.654C343.115 644.432 323.565 656.438 300.387 666.528C276.201 677.021 247.076 686 218.154 686C211.604 686 205.759 682.065 203.239 676.012C200.72 669.958 202.131 663.097 206.666 658.456L206.968 658.154C207.27 657.851 207.673 657.447 208.278 656.741C209.386 655.53 211.1 653.613 213.216 650.99C217.348 645.945 222.89 638.479 228.534 629.197C238.611 612.449 248.185 590.454 250.1 565.736C219.867 531.432 202.03 489.36 202.03 443.857C202.03 327.931 317.519 234 460.015 234C602.511 234 718 327.931 718 443.857Z"
          fill="white"
        />
        <Defs>
          <linearGradient
            id="paint0_linear_410_40"
            x1="795.951"
            y1="986.767"
            x2="375.677"
            y2="-58.4083"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.265" stop-color="#191272" />
            <Stop offset="1" stop-color="#ED0342" />
          </linearGradient>
        </Defs>
      </Svg>
    </Center>
  );
};

export const HomebaseMail = (props: BrandIconProps) => {
  return (
    <Center>
      <Svg {...getSize(props.size || 'md')} viewBox="0 0 919 919" fill="none">
        <Rect y="0.000488281" width="919" height="919" rx="80" fill="url(#paint0_linear_416_2)" />
        <Path
          d="M248.75 265.001C221.836 265.001 200 286.837 200 313.751C200 329.087 207.211 343.509 219.5 352.751L440.5 518.501C452.078 527.134 467.922 527.134 479.5 518.501L700.5 352.751C712.789 343.509 720 329.087 720 313.751C720 286.837 698.164 265.001 671.25 265.001H248.75ZM200 378.751V590.001C200 625.853 229.148 655.001 265 655.001H655C690.852 655.001 720 625.853 720 590.001V378.751L499 544.501C475.844 561.868 444.156 561.868 421 544.501L200 378.751Z"
          fill="white"
        />
        <Defs>
          <linearGradient
            id="paint0_linear_416_2"
            x1="795.951"
            y1="986.767"
            x2="375.677"
            y2="-58.4078"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.265" stop-color="#191272" />
            <Stop offset="1" stop-color="#ED0342" />
          </linearGradient>
        </Defs>
      </Svg>
    </Center>
  );
};
