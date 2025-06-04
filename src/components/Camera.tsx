"use client";

import { useRef, useState, useEffect } from "react";
import { Character, CapturedPhoto } from "@/types";

interface CameraProps {
  selectedCharacter: Character;
  onPhotosCapture: (photos: CapturedPhoto[]) => void;
  onBack: () => void;
}

export default function Camera({ selectedCharacter, onPhotosCapture, onBack }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string>("");

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

  // 사진 촬영 함수
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // 캔버스 크기를 비디오 크기로 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 캔버스를 Data URL로 변환
    const dataUrl = canvas.toDataURL("image/png");

    const newPhoto: CapturedPhoto = {
      id: capturedPhotos.length + 1,
      dataUrl,
      timestamp: Date.now(),
    };

    const updatedPhotos = [...capturedPhotos, newPhoto];
    setCapturedPhotos(updatedPhotos);

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
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-96 object-cover" />

              {/* 카운트다운 오버레이 */}
              {countdown && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white animate-pulse">{countdown}</div>
                </div>
              )}

              {/* 캐릭터 미리보기 (우측 하단) */}
              <div className="absolute bottom-4 right-4 opacity-30">
                <div className="text-4xl">
                  {selectedCharacter.id === "char-1" && "🐱"}
                  {selectedCharacter.id === "char-2" && "🐶"}
                  {selectedCharacter.id === "char-3" && "🐰"}
                </div>
              </div>
            </div>

            {/* 촬영 버튼 */}
            <div className="mt-6 text-center">
              <button
                onClick={startCountdown}
                disabled={isCapturing || capturedPhotos.length >= 4}
                className={`
                  w-20 h-20 rounded-full border-4 transition-all duration-200
                  ${
                    isCapturing || capturedPhotos.length >= 4
                      ? "border-gray-500 bg-gray-700 cursor-not-allowed"
                      : "border-white bg-red-500 hover:bg-red-600 hover:scale-110"
                  }
                `}
              >
                {isCapturing ? "⏱️" : "📸"}
              </button>

              <p className="mt-2 text-gray-300">
                {isCapturing ? "촬영 준비 중..." : capturedPhotos.length >= 4 ? "촬영 완료!" : "클릭해서 촬영"}
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

        {/* 숨겨진 캔버스 (촬영용) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
