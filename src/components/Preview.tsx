"use client";

import { Character } from "@/types";

interface PreviewProps {
  finalImageDataUrl: string;
  selectedCharacter: Character;
  onReset: () => void;
  onDownload: () => void;
}

export default function Preview({ finalImageDataUrl, selectedCharacter, onReset, onDownload }: PreviewProps) {
  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = finalImageDataUrl;
    link.download = `anishot-4cut-${selectedCharacter.name}-${Date.now()}.png`;
    link.click();
    onDownload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🎉 완성된 인생네컷</h1>
          <p className="text-purple-200">{selectedCharacter.name}과의 특별한 추억</p>
        </div>

        {/* 메인 이미지 영역 */}
        <div className="flex flex-col items-center">
          {/* 9:16 비율로 표시되는 이미지 */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-md w-full">
            <img
              src={finalImageDataUrl}
              alt="완성된 4컷 사진"
              className="w-full h-auto rounded-lg shadow-lg"
              style={{ aspectRatio: "9/16" }}
            />

            {/* 이미지 위 장식 */}
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
            <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse">💖</div>
          </div>

          {/* 설명 텍스트 */}
          <div className="mt-8 text-center max-w-md">
            <h2 className="text-xl font-semibold mb-3">📱 모바일 전체 화면 크기!</h2>
            <p className="text-purple-200 mb-6">
              이제 핸드폰 전체 화면을 차지하는 크기로 인생네컷이 완성되었어요! SNS에 공유하거나 배경화면으로
              설정해보세요.
            </p>

            <div className="bg-purple-800 bg-opacity-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-100">
                💡 <strong>팁:</strong> 이미지는 1080x1920 픽셀 (9:16 비율)로 제작되어 모든 모바일 기기에서 완벽하게
                표시됩니다!
              </p>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={downloadImage}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl 
                       font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200
                       flex items-center justify-center space-x-2"
            >
              <span>📱</span>
              <span>이미지 저장</span>
            </button>

            <button
              onClick={onReset}
              className="flex-1 px-6 py-4 bg-gray-700 text-white rounded-xl font-semibold 
                       shadow-lg hover:bg-gray-600 transition-colors duration-200
                       flex items-center justify-center space-x-2"
            >
              <span>📸</span>
              <span>다시 촬영</span>
            </button>
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 text-center">
            <p className="text-purple-300 text-sm mb-2">{new Date().toLocaleDateString("ko-KR")} 촬영</p>
            <p className="text-purple-400 text-xs">AniShot으로 만든 특별한 추억 ✨</p>
          </div>
        </div>
      </div>
    </div>
  );
}
