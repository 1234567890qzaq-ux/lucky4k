export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  name: string;
  mimeType: string;
  fileSize?: number;
}

export interface EnhanceOptions {
  targetLongEdge: number;
  faceEnhance: boolean;
}
