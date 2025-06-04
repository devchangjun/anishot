"use client";

import { useState, useEffect } from "react";
import { Character, CapturedPhoto } from "@/types";
import { create4CutLayout } from "@/lib/imageProcessing";
import { downloadImage } from "@/lib/utils";

interface PreviewProps {
  photos: CapturedPhoto[];
  character: Character;
  onBack: () => void;
  onHome: () => void;
}

export default function Preview({ photos, character, onBack, onHome }: PreviewProps) {
  const [finalImageUrl, setFinalImageUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 4컷 이미지 생성
  useEffect(() => {
    const generate4Cut = async () => {
      try {
        setIsGenerating(true);
        console.log("4컷 이미지 생성 시작...");

        const finalImage = await create4CutLayout(photos);
        setFinalImageUrl(finalImage);

        console.log("4컷 이미지 생성 완료");
      } catch (error) {
        console.error("4컷 생성 실패:", error);
        setError("이미지 생성 중 오류가 발생했습니다.");
      } finally {
        setIsGenerating(false);
      }
    };

    generate4Cut();
  }, [photos]);

  // 이미지 다운로드
  const handleDownload = () => {
    if (finalImageUrl) {
      const filename = `anishot-${character.name}-${Date.now()}.png`;
      downloadImage(finalImageUrl, filename);
    }
  };

  // 다시 촬영
  const handleRetake = () => {
    onBack();
  };

  // 새로운 캐릭터로 시작
  const handleNewCharacter = () => {
    onHome();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={handleRetake}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              다시 촬영
            </button>
            <button
              onClick={handleNewCharacter}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              처음으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">🎉 완성되었습니다!</h1>
          <p className="text-gray-600">{character.name}과 함께한 특별한 추억이 완성되었어요</p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 4컷 미리보기 */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md">
                {isGenerating ? (
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600">이미지 생성 중...</p>
                    <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
                  </div>
                ) : (
                  <img src={finalImageUrl} alt="완성된 4컷" className="w-full h-auto rounded-lg shadow-lg" />
                )}
              </div>
            </div>

            {/* 액션 영역 */}
            <div className="flex flex-col justify-center space-y-6">
              {/* 원본 사진들 미리보기 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">촬영된 사진들</h3>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="aspect-square relative">
                      <img
                        src={photo.dataUrl}
                        alt={`촬영 ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 통계 정보 */}
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">촬영 정보</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>선택한 캐릭터:</span>
                    <span className="font-medium">{character.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>촬영 장수:</span>
                    <span className="font-medium">{photos.length}장</span>
                  </div>
                  <div className="flex justify-between">
                    <span>완성 시간:</span>
                    <span className="font-medium">
                      {new Date().toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className={`
                    w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300
                    ${
                      isGenerating
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                    }
                  `}
                >
                  {isGenerating ? "생성 중..." : "💾 이미지 저장하기"}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleRetake}
                    className="py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                  >
                    📷 다시 촬영
                  </button>

                  <button
                    onClick={handleNewCharacter}
                    className="py-3 text-purple-700 bg-purple-100 border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:bg-purple-200 transition-all duration-300"
                  >
                    🎭 새 캐릭터
                  </button>
                </div>
              </div>

              {/* 공유 안내 */}
              <div className="text-center">
                <p className="text-sm text-gray-500">💡 저장된 이미지를 SNS에 공유해보세요!</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">AniShot으로 더 많은 추억을 만들어보세요 ✨</p>
        </div>
      </div>
    </div>
  );
}
