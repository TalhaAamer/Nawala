import Svg, { Path } from "react-native-svg";

export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityLabel="Google"
    >
      <Path
        fill="#4285F4"
        d="M21.35 12.23c0-.72-.06-1.41-.18-2.08H12v3.94h5.23a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.92-4.18 2.92-7.23Z"
      />
      <Path
        fill="#34A853"
        d="M12 21.65c2.63 0 4.84-.87 6.45-2.37l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.65Z"
      />
      <Path
        fill="#FBBC05"
        d="M6.54 13.73a5.85 5.85 0 0 1 0-3.46V7.75H3.3a9.77 9.77 0 0 0 0 8.5l3.24-2.52Z"
      />
      <Path
        fill="#EA4335"
        d="M12 6.24c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.34 14.63 2.35 12 2.35a9.74 9.74 0 0 0-8.7 5.4l3.24 2.52C7.31 7.96 9.46 6.24 12 6.24Z"
      />
    </Svg>
  );
}
