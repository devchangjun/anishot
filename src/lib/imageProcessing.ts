import * as bodyPix from "@tensorflow-models/body-pix";
import { CapturedPhoto, Character } from "@/types";

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

// 4컷 레이아웃 생성
export const create4CutLayout = async (photos: CapturedPhoto[], character: Character): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (photos.length !== 4) {
        throw new Error("4장의 사진이 필요합니다");
      }

      // 4컷 캔버스 설정 (세로형 인생네컷)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const cutWidth = 400;
      const cutHeight = 300;
      const padding = 20;
      const headerHeight = 60;

      canvas.width = cutWidth + padding * 2;
      canvas.height = cutHeight * 4 + padding * 5 + headerHeight;

      // 배경색 (흰색)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 헤더 (제목)
      ctx.fillStyle = "#333333";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${character.name}과 함께한 추억`, canvas.width / 2, 35);

      // 각 사진 처리 및 배치
      for (let i = 0; i < 4; i++) {
        const photo = photos[i];
        const y = headerHeight + padding + i * (cutHeight + padding);

        // 배경 제거 (첫 번째 사진에만 적용 - 성능상)
        let processedPhotoUrl = photo.dataUrl;
        if (i === 0) {
          processedPhotoUrl = await removeBackground(photo.dataUrl);
        }

        // 캐릭터 오버레이 추가
        const characterOverlay = character.overlayImages[i] || character.overlayImages[0];
        const finalPhotoUrl = await addCharacterOverlay(
          processedPhotoUrl,
          characterOverlay,
          { x: 0.8, y: 0.8 }, // 우하단
          0.25 // 25% 크기
        );

        // 이미지 로드 및 그리기
        await new Promise<void>((resolveImg) => {
          const img = new Image();
          img.onload = () => {
            // 비율 맞춰서 그리기
            const imgAspect = img.width / img.height;
            const cutAspect = cutWidth / cutHeight;

            let drawWidth, drawHeight, drawX, drawY;

            if (imgAspect > cutAspect) {
              // 이미지가 더 넓음 - 높이에 맞춤
              drawHeight = cutHeight;
              drawWidth = cutHeight * imgAspect;
              drawX = padding + (cutWidth - drawWidth) / 2;
              drawY = y;
            } else {
              // 이미지가 더 높음 - 너비에 맞춤
              drawWidth = cutWidth;
              drawHeight = cutWidth / imgAspect;
              drawX = padding;
              drawY = y + (cutHeight - drawHeight) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            // 테두리
            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1;
            ctx.strokeRect(padding, y, cutWidth, cutHeight);

            resolveImg();
          };
          img.src = finalPhotoUrl;
        });
      }

      // 하단 로고/브랜딩
      ctx.fillStyle = "#999999";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("AniShot - 나만의 인생네컷", canvas.width / 2, canvas.height - 10);

      resolve(canvas.toDataURL("image/png"));
    } catch (error) {
      reject(error);
    }
  });
};
