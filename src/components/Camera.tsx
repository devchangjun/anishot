"use client";

import { useRef, useState, useEffect } from "react";
import { Character, CapturedPhoto } from "@/types";
import { removeBackground } from "@/lib/imageProcessing";

interface CameraProps {
  selectedCharacter: Character;
  onPhotosCapture: (photos: CapturedPhoto[]) => void;
  onBack: () => void;
  removeBg: boolean;
}

export default function Camera({ selectedCharacter, onPhotosCapture, onBack, removeBg }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [characterImg, setCharacterImg] = useState<HTMLImageElement | null>(null);

  // 카메라 초기화
  useEffect(() => {
    const initCamera = async () => {
      try {
        // HTTPS 체크
        const isSecureContext = window.isSecureContext || location.protocol === "https:";
        if (!isSecureContext && location.hostname !== "localhost") {
          setCameraError("카메라 접근을 위해서는 HTTPS 연결이 필요합니다. ngrok이나 HTTPS 서버를 사용해주세요.");
          return;
        }

        // getUserMedia 지원 여부 체크
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("이 브라우저는 카메라 기능을 지원하지 않습니다.");
          return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error: unknown) {
        console.error("Camera access error:", error);

        // 에러 타입별 상세 메시지
        const err = error as DOMException;
        if (err.name === "NotAllowedError") {
          setCameraError("카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.");
        } else if (err.name === "NotFoundError") {
          setCameraError("카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.");
        } else if (err.name === "NotSupportedError") {
          setCameraError("HTTPS 연결이 필요합니다. 보안 연결을 통해 접속해주세요.");
        } else {
          setCameraError(`카메라 접근 오류: ${err.message || "Unknown error"}`);
        }
      }
    };

    initCamera();

    // 컴포넌트 언마운트 시 스트림 정리
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 캐릭터 이미지 로드 (촬영 횟수에 따라 다른 이미지)
  useEffect(() => {
    const loadCharacterImg = () => {
      const currentCutIndex = capturedPhotos.length; // 0, 1, 2, 3
      const overlayImageUrl = selectedCharacter.overlayImages[currentCutIndex] || selectedCharacter.overlayImages[0];

      const img = new Image();
      img.onload = () => {
        setCharacterImg(img);
      };
      img.onerror = () => {
        console.warn("캐릭터 이미지 로드 실패");
      };
      img.src = overlayImageUrl;
    };

    loadCharacterImg();
  }, [selectedCharacter, capturedPhotos.length]); // capturedPhotos.length 의존성 추가

  // 실시간 캐릭터 오버레이 그리기
  const drawCharacterOverlay = () => {
    if (!videoRef.current || !overlayCanvasRef.current || !characterImg) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기를 비디오와 동일하게 설정
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 캐릭터 크기와 위치 설정 (왼쪽 끝, 바닥에 딱 붙음)
    const characterSize = Math.min(canvas.width, canvas.height) * 0.6; // 화면의 60% 크기
    const characterX = 0; // 왼쪽 끝에 딱 붙음
    const characterY = canvas.height - characterSize; // 바닥에 딱 붙음

    // 캐릭터 그리기 (약간 투명하게)
    ctx.globalAlpha = 0.8;
    ctx.drawImage(characterImg, characterX, characterY, characterSize, characterSize);
    ctx.globalAlpha = 1.0;
  };

  // 실시간 오버레이 애니메이션
  useEffect(() => {
    if (!characterImg) return;

    const interval = setInterval(drawCharacterOverlay, 100); // 10fps로 업데이트
    return () => clearInterval(interval);
  }, [characterImg]);

  // 사진 촬영 함수 (캐릭터와 합성)
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !characterImg) return;

    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // 캔버스 크기를 비디오 크기로 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 1. 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 1.5. 배경을 흰색으로 제거 (옵션)
    const originalDataUrl = canvas.toDataURL("image/png");
    let processedDataUrl = originalDataUrl;
    if (removeBg) {
      try {
        processedDataUrl = await removeBackground(originalDataUrl);
      } catch (error) {
        console.warn("배경 제거 실패, 원본 사용:", error);
        processedDataUrl = originalDataUrl;
      }
    }

    // 처리된 이미지를 다시 캔버스에 그리기
    const processedImg = new Image();
    await new Promise<void>((resolve) => {
      processedImg.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(processedImg, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      processedImg.src = processedDataUrl;
    });

    // 2. 캐릭터 오버레이 그리기 (현재 컷에 맞는 이미지 사용)
    const currentCutIndex = capturedPhotos.length; // 0, 1, 2, 3
    const overlayImageUrl = selectedCharacter.overlayImages[currentCutIndex] || selectedCharacter.overlayImages[0];

    // 현재 컷용 캐릭터 이미지 로드
    const currentCharacterImg = new Image();
    await new Promise<void>((resolve) => {
      currentCharacterImg.onload = () => resolve();
      currentCharacterImg.onerror = () => {
        console.warn("현재 컷 캐릭터 이미지 로드 실패");
        resolve();
      };
      currentCharacterImg.src = overlayImageUrl;
    });

    const characterSize = Math.min(canvas.width, canvas.height) * 0.6; // 화면의 60% 크기
    const characterX = 0; // 왼쪽 끝에 딱 붙음
    const characterY = canvas.height - characterSize; // 바닥에 딱 붙음

    // 현재 컷에 맞는 캐릭터 이미지로 합성
    if (currentCharacterImg.complete && currentCharacterImg.naturalWidth > 0) {
      ctx.drawImage(currentCharacterImg, characterX, characterY, characterSize, characterSize);
    }

    // 캔버스를 Data URL로 변환
    const dataUrl = canvas.toDataURL("image/png");

    const newPhoto: CapturedPhoto = {
      id: capturedPhotos.length + 1,
      dataUrl,
      timestamp: Date.now(),
    };

    const updatedPhotos = [...capturedPhotos, newPhoto];
    setCapturedPhotos(updatedPhotos);

    setIsProcessing(false);

    // 4장 다 촬영되면 콜백 실행
    if (updatedPhotos.length === 4) {
      onPhotosCapture(updatedPhotos);
    }
  };

  // 카운트다운 시작
  const startCountdown = () => {
    if (isCapturing) return;

    setIsCapturing(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev === 1) {
          clearInterval(timer);
          capturePhoto();
          setIsCapturing(false);
          setCountdown(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 사진 삭제
  const deletePhoto = (photoId: number) => {
    setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  };

  // 전체 초기화
  const resetCapture = () => {
    setCapturedPhotos([]);
  };

  if (cameraError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">카메라 접근 오류</h2>
          <p className="text-red-500 mb-6">{cameraError}</p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">📱 핸드폰에서 해결 방법:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 브라우저 주소창 옆의 🔒 또는 ⚠️ 아이콘 클릭</li>
              <li>• &ldquo;카메라&rdquo; 권한을 &ldquo;허용&rdquo;으로 변경</li>
              <li>• 페이지 새로고침</li>
              <li>• 또는 HTTPS 링크로 접속 (ngrok 등)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">💻 개발자용 해결 방법:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• ngrok을 사용한 HTTPS 터널링</li>
              <li>• 로컬 HTTPS 인증서 설정</li>
              <li>• localhost로 직접 접속</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 페이지 새로고침
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center space-x-2 text-gray-300 hover:text-white">
            <span>←</span>
            <span>뒤로가기</span>
          </button>

          <h1 className="text-xl font-bold">{selectedCharacter.name}과 함께 촬영</h1>

          <div className="text-sm text-gray-300">{capturedPhotos.length}/4</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 카메라 뷰 */}
          <div className="lg:col-span-2">
            {/* 카메라 영역 */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* 비디오 스트림 */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
                style={{ transform: "scaleX(-1)" }} // 거울 효과
              />

              {/* 실시간 캐릭터 오버레이 */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ transform: "scaleX(-1)" }} // 거울 효과
              />

              {/* 촬영 가이드 오버레이 */}
              <div className="absolute inset-0 pointer-events-none">
                {/* 캐릭터 위치 안내 */}
                <div className="absolute top-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  📍 {capturedPhotos.length + 1}번째 컷 - 왼쪽에 {selectedCharacter.name}이(가) 함께 찍혀요
                </div>

                {/* 카운트다운 */}
                {countdown && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl font-bold text-white drop-shadow-lg animate-pulse">{countdown}</div>
                  </div>
                )}

                {/* 배경 처리 중 */}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-700">배경 처리 중...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 숨겨진 캔버스 (촬영용) */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* 촬영 버튼 */}
            <div className="mt-6 text-center">
              <button
                onClick={startCountdown}
                disabled={isCapturing || isProcessing || capturedPhotos.length >= 4}
                className={`
                  w-20 h-20 rounded-full border-4 transition-all duration-200
                  ${
                    isCapturing || isProcessing || capturedPhotos.length >= 4
                      ? "border-gray-500 bg-gray-700 cursor-not-allowed"
                      : "border-white bg-red-500 hover:bg-red-600 hover:scale-110"
                  }
                `}
              >
                {isCapturing ? "⏱️" : isProcessing ? "⚙️" : "📸"}
              </button>

              <p className="mt-2 text-gray-300">
                {isCapturing
                  ? "촬영 준비 중..."
                  : isProcessing
                  ? "배경 처리 중..."
                  : capturedPhotos.length >= 4
                  ? "촬영 완료!"
                  : "클릭해서 촬영"}
              </p>
            </div>
          </div>

          {/* 촬영된 사진들 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">촬영된 사진</h2>

            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => {
                const photo = capturedPhotos[index];
                return (
                  <div key={index} className="aspect-square relative">
                    {photo ? (
                      <div className="relative group">
                        <img
                          src={photo.dataUrl}
                          alt={`촬영 ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                        <span className="text-gray-500">{index + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 액션 버튼들 */}
            {capturedPhotos.length > 0 && (
              <div className="mt-6 space-y-3">
                {capturedPhotos.length < 4 && (
                  <button
                    onClick={resetCapture}
                    className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    다시 촬영
                  </button>
                )}

                {capturedPhotos.length === 4 && (
                  <button
                    onClick={() => onPhotosCapture(capturedPhotos)}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    4컷 만들기 →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
