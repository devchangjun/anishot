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

// 애니메이션 타입
export interface Animation {
  id: string;
  name: string;
  thumbnailUrl: string;
  characters: Character[];
}

// 샘플 애니메이션 데이터
export const SAMPLE_ANIMATIONS: Animation[] = [
  {
    id: "demon_slayer",
    name: "귀멸의 칼날",
    thumbnailUrl: "/characters/levi.png",
    characters: [
      {
        id: "tanjiro",
        name: "탄지로",
        thumbnailUrl: "/characters/탄지로메인.png",
        overlayImages: [
          "/characters/탄지로1.png",
          "/characters/탄지로1.png",
          "/characters/탄지로1.png",
          "/characters/탄지로1.png",
        ],
      },
      {
        id: "nezuko",
        name: "네즈코",
        thumbnailUrl: "/characters/levi3.png",
        overlayImages: [
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
        ],
      },
    ],
  },
  {
    id: "attack_on_titan",
    name: "진격의 거인",
    thumbnailUrl: "/characters/levi2.png",
    characters: [
      {
        id: "levi",
        name: "리바이",
        thumbnailUrl: "/characters/levi.png",
        overlayImages: [
          "/characters/levi.png",
          "/characters/levi2.png",
          "/characters/levi3.png",
          "/characters/levi.png",
        ],
      },
      {
        id: "eren",
        name: "에렌",
        thumbnailUrl: "/characters/levi3.png",
        overlayImages: [
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
        ],
      },
    ],
  },
  {
    id: "one_piece",
    name: "원피스",
    thumbnailUrl: "/characters/cat-overlay.svg",
    characters: [
      {
        id: "luffy",
        name: "루피",
        thumbnailUrl: "/characters/cat-overlay.svg",
        overlayImages: [
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
        ],
      },
      {
        id: "zoro",
        name: "조로",
        thumbnailUrl: "/characters/dog-overlay.svg",
        overlayImages: [
          "/characters/dog-overlay.svg",
          "/characters/dog-overlay.svg",
          "/characters/dog-overlay.svg",
          "/characters/dog-overlay.svg",
        ],
      },
    ],
  },
  {
    id: "naruto",
    name: "나루토",
    thumbnailUrl: "/characters/rabbit-overlay.svg",
    characters: [
      {
        id: "naruto",
        name: "나루토",
        thumbnailUrl: "/characters/rabbit-overlay.svg",
        overlayImages: [
          "/characters/rabbit-overlay.svg",
          "/characters/rabbit-overlay.svg",
          "/characters/rabbit-overlay.svg",
          "/characters/rabbit-overlay.svg",
        ],
      },
      {
        id: "sasuke",
        name: "사스케",
        thumbnailUrl: "/characters/levi2.png",
        overlayImages: [
          "/characters/levi2.png",
          "/characters/levi2.png",
          "/characters/levi2.png",
          "/characters/levi2.png",
        ],
      },
    ],
  },
  {
    id: "spy_x_family",
    name: "스파이 패밀리",
    thumbnailUrl: "/characters/levi3.png",
    characters: [
      {
        id: "anya",
        name: "아냐",
        thumbnailUrl: "/characters/levi3.png",
        overlayImages: [
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
        ],
      },
      {
        id: "loid",
        name: "로이드",
        thumbnailUrl: "/characters/levi.png",
        overlayImages: ["/characters/levi.png", "/characters/levi.png", "/characters/levi.png", "/characters/levi.png"],
      },
    ],
  },
  {
    id: "pokemon",
    name: "포켓몬스터",
    thumbnailUrl: "/characters/dog-overlay.svg",
    characters: [
      {
        id: "pikachu",
        name: "피카츄",
        thumbnailUrl: "/characters/dog-overlay.svg",
        overlayImages: [
          "/characters/dog-overlay.svg",
          "/characters/dog-overlay.svg",
          "/characters/dog-overlay.svg",
          "/characters/dog-overlay.svg",
        ],
      },
      {
        id: "eevee",
        name: "이브이",
        thumbnailUrl: "/characters/cat-overlay.svg",
        overlayImages: [
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
        ],
      },
    ],
  },
  {
    id: "dragon_ball",
    name: "드래곤볼",
    thumbnailUrl: "/characters/levi2.png",
    characters: [
      {
        id: "goku",
        name: "손오공",
        thumbnailUrl: "/characters/levi2.png",
        overlayImages: [
          "/characters/levi2.png",
          "/characters/levi2.png",
          "/characters/levi2.png",
          "/characters/levi2.png",
        ],
      },
      {
        id: "vegeta",
        name: "베지터",
        thumbnailUrl: "/characters/levi3.png",
        overlayImages: [
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
          "/characters/levi3.png",
        ],
      },
    ],
  },
  {
    id: "sailor_moon",
    name: "세일러문",
    thumbnailUrl: "/characters/cat-overlay.svg",
    characters: [
      {
        id: "usagi",
        name: "우사기",
        thumbnailUrl: "/characters/cat-overlay.svg",
        overlayImages: [
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
          "/characters/cat-overlay.svg",
        ],
      },
    ],
  },
  {
    id: "slamdunk",
    name: "슬램덩크",
    thumbnailUrl: "/characters/rabbit-overlay.svg",
    characters: [
      {
        id: "sakuragi",
        name: "사쿠라기",
        thumbnailUrl: "/characters/rabbit-overlay.svg",
        overlayImages: [
          "/characters/rabbit-overlay.svg",
          "/characters/rabbit-overlay.svg",
          "/characters/rabbit-overlay.svg",
          "/characters/rabbit-overlay.svg",
        ],
      },
    ],
  },
];
