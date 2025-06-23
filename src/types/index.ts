// 캐릭터 정보
export interface Character {
  id: string;
  name: string;
  thumbnailUrl: string;
  overlayImages: string[]; // 컷당 오버레이 PNG
}

// 촬영된 사진 정보
export type CapturedPhoto = {
  id: number;
  dataUrl: string;
  timestamp: number;
  characterOverlayUrl: string; // 사용자가 선택한 캐릭터 오버레이 이미지 경로
};

// 4컷 레이아웃 정보
export type PhotoLayout = {
  width: number;
  height: number;
  photos: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
};

// 앱 상태
export type AppState = {
  selectedCharacter: Character | null;
  capturedPhotos: CapturedPhoto[];
  currentStep: "home" | "character-select" | "camera" | "preview";
  isProcessing: boolean;
};

export interface Animation {
  id: string;
  name: string;
  thumbnailUrl: string;
  characters: Character[];
}
