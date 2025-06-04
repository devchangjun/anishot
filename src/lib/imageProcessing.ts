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

// 4컷 레이아웃 생성 (포토부스 스타일 - 이미 합성된 사진들 배치)
export const create4CutLayout = async (photos: CapturedPhoto[], character: Character): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (photos.length !== 4) {
        throw new Error("4장의 사진이 필요합니다");
      }

      // 포토부스 스타일 캔버스 설정
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // 캔버스 크기 (세로형 포토부스 스타일)
      canvas.width = 600;
      canvas.height = 800;

      // 배경 그라데이션
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#FFE0F7");
      gradient.addColorStop(0.5, "#E1BEE7");
      gradient.addColorStop(1, "#FFE0F7");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 타이틀 영역
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(20, 20, canvas.width - 40, 60);
      ctx.strokeStyle = "#BA68C8";
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, canvas.width - 40, 60);

      // 타이틀 텍스트
      ctx.fillStyle = "#333333";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${character.name}과 함께한 추억`, canvas.width / 2, 55);

      // 4컷 사진 영역 설정
      const photoWidth = 520;
      const photoHeight = 140;
      const startY = 100;
      const spacing = 20;

      for (let i = 0; i < 4; i++) {
        const photo = photos[i];
        const photoY = startY + i * (photoHeight + spacing);
        const photoX = (canvas.width - photoWidth) / 2;

        // 프레임 배경 (흰색)
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillRect(photoX - 10, photoY - 10, photoWidth + 20, photoHeight + 20);

        // 프레임 테두리
        ctx.strokeStyle = "#BA68C8";
        ctx.lineWidth = 2;
        ctx.strokeRect(photoX - 10, photoY - 10, photoWidth + 20, photoHeight + 20);

        // 이미 합성된 사진 그리기
        await new Promise<void>((resolveImg) => {
          const img = new Image();
          img.onload = () => {
            // 사진 영역에 맞춰 크기 조정 (가로 중심)
            const imgAspect = img.width / img.height;
            const photoAspect = photoWidth / photoHeight;

            let drawWidth, drawHeight, drawX, drawY;

            if (imgAspect > photoAspect) {
              drawWidth = photoWidth;
              drawHeight = photoWidth / imgAspect;
              drawX = photoX;
              drawY = photoY + (photoHeight - drawHeight) / 2;
            } else {
              drawHeight = photoHeight;
              drawWidth = photoHeight * imgAspect;
              drawX = photoX + (photoWidth - drawWidth) / 2;
              drawY = photoY;
            }

            // 사진 클리핑 (프레임 안에만 표시)
            ctx.save();
            ctx.beginPath();
            ctx.rect(photoX, photoY, photoWidth, photoHeight);
            ctx.clip();
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();

            resolveImg();
          };
          img.onerror = () => {
            console.warn("사진 로드 실패");
            resolveImg();
          };
          img.src = photo.dataUrl;
        });

        // 컷 번호 표시
        ctx.fillStyle = "#BA68C8";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${i + 1}`, photoX + 10, photoY + 25);
      }

      // 하단 브랜딩
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(20, canvas.height - 60, canvas.width - 40, 40);
      ctx.strokeStyle = "#BA68C8";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, canvas.height - 60, canvas.width - 40, 40);

      ctx.fillStyle = "#BA68C8";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🎭 AniShot - 나만의 인생네컷", canvas.width / 2, canvas.height - 35);

      // 장식 요소 추가 (작은 하트와 별)
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 8 + 3;

        ctx.fillStyle = `rgba(186, 104, 200, ${Math.random() * 0.3 + 0.1})`;
        ctx.beginPath();

        // 별 모양 그리기
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;

        ctx.beginPath();
        for (let j = 0; j < spikes * 2; j++) {
          const radius = j % 2 === 0 ? outerRadius : innerRadius;
          const angle = (j * Math.PI) / spikes;
          const starX = x + Math.cos(angle) * radius;
          const starY = y + Math.sin(angle) * radius;

          if (j === 0) {
            ctx.moveTo(starX, starY);
          } else {
            ctx.lineTo(starX, starY);
          }
        }
        ctx.closePath();
        ctx.fill();
      }

      resolve(canvas.toDataURL("image/png"));
    } catch (error) {
      reject(error);
    }
  });
};
