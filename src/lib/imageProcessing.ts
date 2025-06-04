import * as bodyPix from "@tensorflow-models/body-pix";
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

// 배경 제거 (흰색 배경으로 교체)
export const removeBackground = async (imageDataUrl: string): Promise<string> => {
  try {
    const model = await loadBodyPixModel();

    // 이미지 엘리먼트 생성
    const img = new Image();
    img.crossOrigin = "anonymous";

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // 캔버스 생성
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context not available");

          canvas.width = img.width;
          canvas.height = img.height;

          // 원본 이미지를 캔버스에 그리기
          ctx.drawImage(img, 0, 0);

          // 세그멘테이션 수행
          const segmentation = await model.segmentPerson(canvas, {
            flipHorizontal: false,
            internalResolution: "medium",
            segmentationThreshold: 0.7,
          });

          // 배경을 흰색으로 교체
          const backgroundColor = { r: 255, g: 255, b: 255, a: 255 };
          const foregroundColor = { r: 0, g: 0, b: 0, a: 0 }; // 투명

          const coloredPartImage = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);

          // 마스크를 적용하여 최종 이미지 생성
          const opacity = 1;
          const maskBlurAmount = 0;
          const flipHorizontal = false;

          bodyPix.drawMask(canvas, canvas, coloredPartImage, opacity, maskBlurAmount, flipHorizontal);

          // 결과를 Data URL로 변환
          resolve(canvas.toDataURL("image/png"));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = reject;
      img.src = imageDataUrl;
    });
  } catch (error) {
    console.error("배경 제거 실패:", error);
    // 실패 시 원본 이미지 반환
    return imageDataUrl;
  }
};

// 캐릭터 오버레이 합성
export const addCharacterOverlay = async (
  photoDataUrl: string,
  characterOverlayUrl: string,
  overlayPosition = { x: 0.7, y: 0.7 }, // 우하단
  overlaySize = 0.3 // 이미지 크기의 30%
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

// 4컷 레이아웃 생성 (2x2 형태)
export const create4CutLayout = async (photos: CapturedPhoto[]): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (photos.length !== 4) {
        throw new Error("4장의 사진이 필요합니다");
      }

      // 캔버스 설정 (2x2 형태)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // 캔버스 크기 설정 (2x2 형태)
      const photoWidth = 300;
      const photoHeight = 225; // 4:3 비율
      const frameThickness = 20;
      const photoSpacing = 8;

      canvas.width = photoWidth * 2 + photoSpacing + frameThickness * 2;
      canvas.height = photoHeight * 2 + photoSpacing + frameThickness * 2;

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

      // 2x2 그리드로 사진 배치
      const positions = [
        { row: 0, col: 0 }, // 좌상단
        { row: 0, col: 1 }, // 우상단
        { row: 1, col: 0 }, // 좌하단
        { row: 1, col: 1 }, // 우하단
      ];

      for (let i = 0; i < 4; i++) {
        const photo = photos[i];
        const pos = positions[i];

        const photoX = frameThickness + pos.col * (photoWidth + photoSpacing);
        const photoY = frameThickness + pos.row * (photoHeight + photoSpacing);

        // 사진 그리기
        await new Promise<void>((resolveImg) => {
          const img = new Image();
          img.onload = () => {
            // 사진을 프레임에 맞춰 크기 조정
            const imgAspect = img.width / img.height;
            const frameAspect = photoWidth / photoHeight;

            let drawWidth, drawHeight, drawX, drawY;

            if (imgAspect > frameAspect) {
              // 이미지가 더 넓은 경우 - 높이 맞춤
              drawHeight = photoHeight;
              drawWidth = photoHeight * imgAspect;
              drawX = photoX + (photoWidth - drawWidth) / 2;
              drawY = photoY;
            } else {
              // 이미지가 더 높은 경우 - 너비 맞춤
              drawWidth = photoWidth;
              drawHeight = photoWidth / imgAspect;
              drawX = photoX;
              drawY = photoY + (photoHeight - drawHeight) / 2;
            }

            // 사진 영역 클리핑
            ctx.save();
            ctx.beginPath();
            ctx.rect(photoX, photoY, photoWidth, photoHeight);
            ctx.clip();

            // 사진 그리기
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            ctx.restore();

            // 사진 번호 표시 (작은 원형 배지)
            ctx.fillStyle = "#BA68C8";
            ctx.beginPath();
            ctx.arc(photoX + 15, photoY + 15, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`${i + 1}`, photoX + 15, photoY + 20);

            resolveImg();
          };

          img.onerror = () => {
            console.warn(`사진 ${i + 1} 로드 실패`);
            resolveImg();
          };

          img.src = photo.dataUrl;
        });
      }

      // 프레임 장식 효과
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      ctx.strokeRect(
        frameThickness / 2,
        frameThickness / 2,
        canvas.width - frameThickness,
        canvas.height - frameThickness
      );
      ctx.globalAlpha = 1;

      // 모서리 장식 (작은 하트)
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

      // 네 모서리에 하트 장식
      const heartSize = 12;
      drawHeart(5, 5, heartSize); // 좌상단
      drawHeart(canvas.width - heartSize - 5, 5, heartSize); // 우상단
      drawHeart(5, canvas.height - heartSize - 5, heartSize); // 좌하단
      drawHeart(canvas.width - heartSize - 5, canvas.height - heartSize - 5, heartSize); // 우하단

      // 중앙에 작은 로고/브랜딩
      ctx.fillStyle = "#BA68C8";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.6;
      ctx.fillText("AniShot", canvas.width / 2, canvas.height / 2 + 4);
      ctx.globalAlpha = 1;

      resolve(canvas.toDataURL("image/png"));
    } catch (error) {
      reject(error);
    }
  });
};
