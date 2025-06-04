import { Character } from "@/types";

// 샘플 캐릭터 데이터 (실제 SVG 이미지 사용)
export const SAMPLE_CHARACTERS: Character[] = [
  {
    id: "char-1",
    name: "리바이",
    thumbnailUrl: "/characters/levi.png",
    overlayImages: ["/characters/levi.png", "/characters/levi2.png", "/characters/levi3.png", "/characters/levi2.png"],
  },
  {
    id: "char-2",
    name: "활기찬 강아지",
    thumbnailUrl: "/characters/dog-overlay.svg",
    overlayImages: [
      "/characters/dog-overlay.svg",
      "/characters/dog-overlay.svg",
      "/characters/dog-overlay.svg",
      "/characters/dog-overlay.svg",
    ],
  },
  {
    id: "char-3",
    name: "신비한 토끼",
    thumbnailUrl: "/characters/rabbit-overlay.svg",
    overlayImages: [
      "/characters/rabbit-overlay.svg",
      "/characters/rabbit-overlay.svg",
      "/characters/rabbit-overlay.svg",
      "/characters/rabbit-overlay.svg",
    ],
  },
];
