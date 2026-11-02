import type { PickedImage } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Processing: { image: PickedImage };
  Result: {
    original: PickedImage;
    resultUri: string;
    outWidth: number;
    outHeight: number;
    outBytes: number;
  };
  Settings: undefined;
  Info: { kind: 'about' | 'privacy' };
};
