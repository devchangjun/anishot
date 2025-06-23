import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import { CapturedPhoto } from "@/types";

// BodyPix 모델 (전역으로 한 번만 로드)
let bodyPixModel: bodyPix.BodyPix | null = null;

// BodyPix 모델 로드
export const loadBodyPixModel = async () => {
  if (bodyPixModel) return bodyPixModel;

  try {
    console.log("BodyPix 모델 로딩 중...");
    bodyPixModel = await bodyPix.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2,
    });
    console.log("BodyPix 모델 로드 완료");
    return bodyPixModel;
  } catch (error) {
    console.error("BodyPix 모델 로드 실패:", error);
    throw error;
  }
};

// BodyPix를 사용한 배경 제거 (사람만 남기고 배경을 흰색으로)
// 설치 필요: npm install @tensorflow/tfjs @tensorflow-models/body-pix
export async function removeBackground(dataUrl: string): Promise<string> {
  const img = new window.Image();
  img.src = dataUrl;
  await new Promise((resolve) => (img.onload = resolve));

  const net = await bodyPix.load();
  const segmentation = await net.segmentPerson(img);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const n = i / 4;
    if (segmentation.data[n] === 0) {
      // 배경: 흰색으로
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

// 캐릭터 오버레이 합성
export const addCharacterOverlay = async (
  photoDataUrl: string,
  characterOverlayUrl: string,
  overlayPosition = { x: 0.7, y: 0.7 }, // 우하단
  overlaySize = 0.5 // 이미지 크기의 30%
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    const photo = new Image();
    const characterImg = new Image();

    let photosLoaded = 0;
    const checkAllLoaded = () => {
      photosLoaded++;
      if (photosLoaded === 2) {
        // 둘 다 로드되면 합성 시작
        try {
          canvas.width = photo.width;
          canvas.height = photo.height;

          // 사진 그리기
          ctx.drawImage(photo, 0, 0);

          // 캐릭터 오버레이 크기 계산
          const overlayWidth = photo.width * overlaySize;
          const overlayHeight = (characterImg.height / characterImg.width) * overlayWidth;

          // 캐릭터 오버레이 위치 계산
          const x = photo.width * overlayPosition.x - overlayWidth;
          const y = photo.height * overlayPosition.y - overlayHeight;

          // 캐릭터 오버레이 그리기
          ctx.drawImage(characterImg, x, y, overlayWidth, overlayHeight);

          resolve(canvas.toDataURL("image/png"));
        } catch (error) {
          reject(error);
        }
      }
    };

    photo.onload = checkAllLoaded;
    photo.onerror = reject;

    characterImg.onload = checkAllLoaded;
    characterImg.onerror = () => {
      // 캐릭터 이미지 로드 실패 시 원본만 반환
      console.warn("캐릭터 오버레이 로드 실패, 원본 사진만 사용");
      resolve(photoDataUrl);
    };

    photo.src = photoDataUrl;
    characterImg.src = characterOverlayUrl;
  });
};

// 4컷 레이아웃 생성 (9:16 모바일 전체 화면 비율)
export const create4CutLayout = async (photos: CapturedPhoto[]): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (photos.length !== 4) {
        throw new Error("4장의 사진이 필요합니다");
      }

      // 캔버스 설정 (9:16 모바일 비율)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // 캔버스 크기 설정 (9:16 비율, 큰 사이즈)
      canvas.width = 1080; // 9 비율
      canvas.height = 1920; // 16 비율

      const frameThickness = 40;
      const photoSpacing = 20;

      // 2x2 그리드로 사진 크기 계산
      const availableWidth = canvas.width - frameThickness * 2 - photoSpacing;
      const availableHeight = canvas.height - frameThickness * 2 - photoSpacing - 120; // 상단 타이틀 공간

      const photoWidth = availableWidth / 2;
      const photoHeight = (availableHeight - 80) / 2; // 하단 브랜딩 공간

      // 그라데이션 프레임 배경
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#FFE0F7");
      gradient.addColorStop(0.3, "#E1BEE7");
      gradient.addColorStop(0.7, "#BA68C8");
      gradient.addColorStop(1, "#9C27B0");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 내부 흰색 배경
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        frameThickness,
        frameThickness,
        canvas.width - frameThickness * 2,
        canvas.height - frameThickness * 2
      );

      // 상단 타이틀 영역
      ctx.fillStyle = "#BA68C8";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🎭 AniShot", canvas.width / 2, frameThickness + 80);

      ctx.fillStyle = "#666666";
      ctx.font = "32px Arial";
      ctx.fillText("나만의 인생네컷", canvas.width / 2, frameThickness + 130);

      // 2x2 그리드로 사진 배치
      const positions = [
        { row: 0, col: 0 }, // 좌상단
        { row: 0, col: 1 }, // 우상단
        { row: 1, col: 0 }, // 좌하단
        { row: 1, col: 1 }, // 우하단
      ];

      const startY = frameThickness + 160; // 타이틀 아래부터 시작

      for (let i = 0; i < 4; i++) {
        const photo = photos[i];
        const pos = positions[i];

        const photoX = frameThickness + pos.col * (photoWidth + photoSpacing);
        const photoY = startY + pos.row * (photoHeight + photoSpacing);

        // 사진 그리기
        await new Promise<void>((resolveImg) => {
          const img = new Image();
          img.onload = () => {
            // 사진을 프레임에 맞춰 크기 조정 (전체 사진이 보이도록)
            const imgAspect = img.width / img.height;
            const frameAspect = photoWidth / photoHeight;

            let drawWidth, drawHeight, drawX, drawY;

            if (imgAspect > frameAspect) {
              // 이미지가 더 넓은 경우 - 너비에 맞춰서 전체가 보이도록
              drawWidth = photoWidth;
              drawHeight = photoWidth / imgAspect;
              drawX = photoX;
              drawY = photoY + (photoHeight - drawHeight) / 2;
            } else {
              // 이미지가 더 높은 경우 - 높이에 맞춰서 전체가 보이도록
              drawHeight = photoHeight;
              drawWidth = photoHeight * imgAspect;
              drawX = photoX + (photoWidth - drawWidth) / 2;
              drawY = photoY;
            }

            // 배경 채우기 (빈 공간을 흰색으로)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(photoX, photoY, photoWidth, photoHeight);

            // 사진 그리기 (클리핑 없이 전체 표시)
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            // 사진 테두리
            ctx.strokeStyle = "#E0E0E0";
            ctx.lineWidth = 2;
            ctx.strokeRect(photoX, photoY, photoWidth, photoHeight);

            // 사진 번호 표시 (큰 원형 배지)
            ctx.fillStyle = "#BA68C8";
            ctx.beginPath();
            ctx.arc(photoX + 25, photoY + 25, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`${i + 1}`, photoX + 25, photoY + 35);

            resolveImg();
          };

          img.onerror = () => {
            console.warn(`사진 ${i + 1} 로드 실패`);
            resolveImg();
          };

          img.src = photo.dataUrl;
        });
      }

      // 하단 브랜딩 영역
      const bottomY = startY + photoHeight * 2 + photoSpacing + 40;

      ctx.fillStyle = "#BA68C8";
      ctx.font = "28px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${new Date().toLocaleDateString("ko-KR")} 촬영`, canvas.width / 2, bottomY);

      ctx.fillStyle = "#666666";
      ctx.font = "24px Arial";
      ctx.fillText("추억이 담긴 특별한 순간 ✨", canvas.width / 2, bottomY + 40);

      // 프레임 장식 효과
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.7;
      ctx.strokeRect(
        frameThickness / 2,
        frameThickness / 2,
        canvas.width - frameThickness,
        canvas.height - frameThickness
      );
      ctx.globalAlpha = 1;

      // 모서리 장식 (큰 하트)
      const drawHeart = (x: number, y: number, size: number) => {
        ctx.fillStyle = "#FFE0F7";
        ctx.globalAlpha = 0.8;

        // 하트 모양 그리기
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.quadraticCurveTo(x, y, x + size / 4, y);
        ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
        ctx.quadraticCurveTo(x + size / 2, y, x + (size * 3) / 4, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
        ctx.quadraticCurveTo(x + size, y + size / 2, x + (size * 3) / 4, y + (size * 3) / 4);
        ctx.lineTo(x + size / 2, y + size);
        ctx.lineTo(x + size / 4, y + (size * 3) / 4);
        ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
        ctx.fill();

        ctx.globalAlpha = 1;
      };

      // 네 모서리에 하트 장식 (큰 사이즈)
      const heartSize = 24;
      drawHeart(10, 10, heartSize); // 좌상단
      drawHeart(canvas.width - heartSize - 10, 10, heartSize); // 우상단
      drawHeart(10, canvas.height - heartSize - 10, heartSize); // 좌하단
      drawHeart(canvas.width - heartSize - 10, canvas.height - heartSize - 10, heartSize); // 우하단

      resolve(canvas.toDataURL("image/png"));
    } catch (error) {
      reject(error);
    }
  });
};
