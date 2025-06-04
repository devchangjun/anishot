"use client";

import { useState, useEffect } from "react";
import { SAMPLE_CHARACTERS } from "@/lib/characters";
import { Character, CapturedPhoto } from "@/types";
import { create4CutLayout } from "@/lib/imageProcessing";
import Camera from "@/components/Camera";
import Preview from "@/components/Preview";

export default function HomePage() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [currentStep, setCurrentStep] = useState<"home" | "camera" | "preview">("home");
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [finalImageDataUrl, setFinalImageDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleStartClick = () => {
    if (selectedCharacter) {
      setCurrentStep("camera");
    }
  };

  const handlePhotosCapture = (photos: CapturedPhoto[]) => {
    setCapturedPhotos(photos);
    setCurrentStep("preview");
  };

  const handleBackToHome = () => {
    setCurrentStep("home");
    setSelectedCharacter(null);
    setCapturedPhotos([]);
    setFinalImageDataUrl("");
  };

  const handleBackToCamera = () => {
    setCurrentStep("camera");
    setCapturedPhotos([]);
    setFinalImageDataUrl("");
  };

  const handleDownload = () => {
    // 다운로드 완료 후 홈으로 이동
    console.log("이미지 다운로드 완료");
  };

  // 4컷 이미지 생성
  useEffect(() => {
    const generate4Cut = async () => {
      if (currentStep === "preview" && capturedPhotos.length === 4 && !finalImageDataUrl) {
        try {
          setIsGenerating(true);
          console.log("4컷 이미지 생성 시작...");

          const finalImage = await create4CutLayout(capturedPhotos);
          setFinalImageDataUrl(finalImage);

          console.log("4컷 이미지 생성 완료");
        } catch (error) {
          console.error("4컷 생성 실패:", error);
          // 에러 발생 시 카메라로 돌아가기
          handleBackToCamera();
        } finally {
          setIsGenerating(false);
        }
      }
    };

    generate4Cut();
  }, [currentStep, capturedPhotos, finalImageDataUrl]);

  // 카메라 단계
  if (currentStep === "camera" && selectedCharacter) {
    return (
      <Camera selectedCharacter={selectedCharacter} onPhotosCapture={handlePhotosCapture} onBack={handleBackToHome} />
    );
  }

  // 미리보기 단계
  if (currentStep === "preview" && selectedCharacter && capturedPhotos.length === 4) {
    // 이미지 생성 중일 때 로딩 화면
    if (isGenerating || !finalImageDataUrl) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">🎨 인생네컷 생성 중...</h2>
            <p className="text-purple-200">잠시만 기다려주세요</p>
          </div>
        </div>
      );
    }

    return (
      <Preview
        finalImageDataUrl={finalImageDataUrl}
        selectedCharacter={selectedCharacter}
        onReset={handleBackToCamera}
        onDownload={handleDownload}
      />
    );
  }

  // 홈 단계
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">🎭 AniShot</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">좋아하는 캐릭터와 함께하는 나만의 인생 4컷 만들기</p>
        </div>

        {/* 캐릭터 선택 섹션 */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">함께할 캐릭터를 선택하세요</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_CHARACTERS.map((character) => (
              <div
                key={character.id}
                onClick={() => setSelectedCharacter(character)}
                className={`
                  relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
                  ${
                    selectedCharacter?.id === character.id
                      ? "ring-4 ring-purple-500 scale-105 shadow-xl"
                      : "hover:scale-105 hover:shadow-lg"
                  }
                `}
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {/* 실제 캐릭터 이미지 */}
                  <img src={character.thumbnailUrl} alt={character.name} className="w-24 h-24 object-contain" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white font-semibold text-lg">{character.name}</h3>
                </div>

                {selectedCharacter?.id === character.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="text-center">
          <button
            onClick={handleStartClick}
            disabled={!selectedCharacter}
            className={`
              px-8 py-4 text-xl font-semibold rounded-full transition-all duration-300
              ${
                selectedCharacter
                  ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {selectedCharacter ? "📸 촬영 시작하기" : "캐릭터를 선택해주세요"}
          </button>
        </div>

        {/* 미리보기 설명 */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">어떻게 진행되나요?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <p className="text-sm text-gray-600">캐릭터 선택</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <p className="text-sm text-gray-600">4장 촬영</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <p className="text-sm text-gray-600">자동 합성</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-purple-600 font-bold">4</span>
              </div>
              <p className="text-sm text-gray-600">저장 완료</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
