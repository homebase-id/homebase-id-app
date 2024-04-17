import { Circle, Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg';
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
      <Svg {...getSize(props.size || 'md')} viewBox="0 0 919 919">
        <Circle
          cx="459.5"
          cy="459.5"
          r="439.5"
          stroke="url(#paint0_linear_403_4)"
          strokeWidth="40"
          fill={'transparent'}
        />
        <Path
          d="M698.625 490.339C698.592 482.031 705.317 475.278 713.625 475.278H752C760.284 475.278 767 468.562 767 460.278V425.69C767 421.505 765.251 417.51 762.177 414.671L470.589 145.385C464.848 140.084 455.999 140.078 450.251 145.371L157.838 414.669C154.755 417.509 153 421.51 153 425.703V460.278C153 468.562 159.716 475.278 168 475.278H206.329C214.613 475.278 221.329 481.994 221.329 490.278V725C221.329 733.284 228.045 740 236.329 740H376.778C385.062 740 391.778 733.284 391.778 725V566.25C391.778 557.966 398.494 551.25 406.778 551.25H513.222C521.506 551.25 528.222 557.966 528.222 566.25V725C528.222 733.284 534.938 740 543.222 740H684.57C692.878 740 699.603 733.247 699.57 724.94L698.625 490.339Z"
          fill="url(#paint1_linear_403_4)"
        />
        <Defs>
          <LinearGradient
            id="paint0_linear_403_4"
            x1="459.5"
            y1="0"
            x2="459.5"
            y2="919"
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#C68CFF" />
            <Stop offset="1" stopColor="#8CD9FF" />
          </LinearGradient>
          <LinearGradient
            id="paint1_linear_403_4"
            x1="613.242"
            y1="274.057"
            x2="309.406"
            y2="561.747"
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#C68CFF" />
            <Stop offset="1" stopColor="#8CD9FF" />
          </LinearGradient>
        </Defs>
      </Svg>
    </Center>
  );
};
export const HomebaseChat = (props: BrandIconProps) => {
  return (
    <Center>
      <Svg {...getSize(props.size || 'md')} viewBox="0 0 919 919">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M459.5 879C691.183 879 879 691.183 879 459.5C879 227.817 691.183 40 459.5 40C227.817 40 40 227.817 40 459.5C40 691.183 227.817 879 459.5 879ZM459.5 919C713.275 919 919 713.275 919 459.5C919 205.725 713.275 0 459.5 0C205.725 0 0 205.725 0 459.5C0 713.275 205.725 919 459.5 919Z"
          fill="url(#paint0_linear_410_40)"
        />
        <Path
          d="M718 443.857C718 559.783 602.511 653.714 460.015 653.714C422.627 653.714 387.154 647.257 355.108 635.654C343.115 644.432 323.565 656.438 300.387 666.528C276.201 677.021 247.076 686 218.154 686C211.604 686 205.759 682.065 203.239 676.012C200.72 669.958 202.131 663.097 206.666 658.456L206.968 658.154C207.27 657.851 207.673 657.447 208.278 656.741C209.386 655.53 211.1 653.613 213.216 650.99C217.348 645.945 222.89 638.479 228.534 629.197C238.611 612.449 248.185 590.454 250.1 565.736C219.867 531.432 202.03 489.36 202.03 443.857C202.03 327.931 317.519 234 460.015 234C602.511 234 718 327.931 718 443.857Z"
          fill="url(#paint1_linear_410_40)"
        />
        <Defs>
          <LinearGradient
            id="paint0_linear_410_40"
            x1="613.242"
            y1="274.057"
            x2="309.406"
            y2="561.747"
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#C68CFF" />
            <Stop offset="1" stopColor="#8CD9FF" />
          </LinearGradient>
          <LinearGradient
            id="paint1_linear_410_40"
            x1="613.242"
            y1="274.057"
            x2="309.406"
            y2="561.747"
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#C68CFF" />
            <Stop offset="1" stopColor="#8CD9FF" />
          </LinearGradient>
        </Defs>
      </Svg>
    </Center>
  );
};

export const HomebaseMail = (props: BrandIconProps) => {
  return (
    <Center>
      <Svg {...getSize(props.size || 'md')} viewBox="0 0 919 919">
        <Path
          d="M248.75 265C221.836 265 200 286.836 200 313.75C200 329.086 207.211 343.508 219.5 352.75L440.5 518.5C452.078 527.133 467.922 527.133 479.5 518.5L700.5 352.75C712.789 343.508 720 329.086 720 313.75C720 286.836 698.164 265 671.25 265H248.75ZM200 378.75V590C200 625.852 229.148 655 265 655H655C690.852 655 720 625.852 720 590V378.75L499 544.5C475.844 561.868 444.156 561.868 421 544.5L200 378.75Z"
          fill="url(#paint0_linear_416_2)"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M459.5 919C713.275 919 919 713.275 919 459.5C919 205.726 713.275 0.000488281 459.5 0.000488281C205.725 0.000488281 0 205.726 0 459.5C0 713.275 205.725 919 459.5 919ZM459.5 877C690.079 877 877 690.079 877 459.5C877 228.922 690.079 42.0005 459.5 42.0005C228.921 42.0005 42 228.922 42 459.5C42 690.079 228.921 877 459.5 877Z"
          fill="url(#paint1_linear_416_2)"
        />
        <Defs>
          <LinearGradient
            id="paint0_linear_416_2"
            x1="583.5"
            y1="257.5"
            x2="323"
            y2="628.5"
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#C68CFF" />
            <Stop offset="1" stopColor="#8CD9FF" />
          </LinearGradient>
          <LinearGradient
            id="paint1_linear_416_2"
            x1="583.5"
            y1="257.5"
            x2="323"
            y2="628.5"
            gradientUnits="userSpaceOnUse"
          >
            <Stop stopColor="#C68CFF" />
            <Stop offset="1" stopColor="#8CD9FF" />
          </LinearGradient>
        </Defs>
      </Svg>
    </Center>
  );
};
