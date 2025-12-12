import { useState, useRef, useEffect } from 'react';
import { Download, Upload, Trash2, Wand2, ZoomIn, FileImage } from 'lucide-react';
import JSZip from 'jszip';

function App() {
  const [image, setImage] = useState(null);
  const [selections, setSelections] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [processedAssets, setProcessedAssets] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState(2); // 2x or 4x upscale
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Load and display image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setSelections([]);
        setProcessedAssets([]);
        imageRef.current = img;
        drawCanvas(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Draw image and selections on canvas
  const drawCanvas = (img = imageRef.current, rects = selections, tempRect = null) => {
    if (!img || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    // Draw existing selections
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    
    rects.forEach((rect, idx) => {
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      
      // Draw label
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(rect.x, rect.y - 20, 60, 20);
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Asset ${idx + 1}`, rect.x + 5, rect.y - 6);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    });
    
    // Draw current selection
    if (tempRect) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.fillRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
      ctx.strokeRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
    }
  };

  // Mouse events for drawing selection
  const handleMouseDown = (e) => {
    if (!imageRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    startPos.current = { x, y };
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const newRect = {
      x: Math.min(startPos.current.x, x),
      y: Math.min(startPos.current.y, y),
      width: Math.abs(x - startPos.current.x),
      height: Math.abs(y - startPos.current.y)
    };
    
    setCurrentRect(newRect);
    drawCanvas(imageRef.current, selections, newRect);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) {
      setIsDrawing(false);
      return;
    }
    
    // Only add if selection is large enough
    if (currentRect.width > 10 && currentRect.height > 10) {
      setSelections([...selections, currentRect]);
    }
    
    setIsDrawing(false);
    setCurrentRect(null);
    drawCanvas(imageRef.current, selections);
  };

  // Remove a selection
  const removeSelection = (index) => {
    const newSelections = selections.filter((_, i) => i !== index);
    setSelections(newSelections);
    drawCanvas(imageRef.current, newSelections);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelections([]);
    setProcessedAssets([]);
    drawCanvas(imageRef.current, []);
  };

  // Extract image data from selection
  const extractSelection = (rect) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.drawImage(
      imageRef.current,
      rect.x, rect.y, rect.width, rect.height,
      0, 0, rect.width, rect.height
    );
    
    return canvas.toDataURL('image/png');
  };

  // Remove background using canvas (temporary implementation)
  const removeBackground = async (imageData) => {
    try {
      // Load image
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageData;
      });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;
      
      // Simple background removal: make similar colors transparent
      // Get corner pixel as background reference
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];
      const threshold = 50;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate color difference
        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        
        if (diff < threshold) {
          data[i + 3] = 0; // Make transparent
        }
      }
      
      ctx.putImageData(imageDataObj, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Background removal failed:', error);
      return imageData;
    }
  };

  // Upscale image using canvas
  const upscaleImage = async (imageData, scale) => {
    try {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageData;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Upscaling failed:', error);
      return imageData;
    }
  };

  // Process all selections
  const processAllAssets = async () => {
    if (selections.length === 0) return;
    
    setIsProcessing(true);
    const processed = [];
    
    for (let i = 0; i < selections.length; i++) {
      const rect = selections[i];
      
      // Extract selection
      let imageData = extractSelection(rect);
      
      // Remove background
      imageData = await removeBackground(imageData);
      
      // Upscale
      imageData = await upscaleImage(imageData, scale);
      
      processed.push({
        id: i,
        name: `asset_${i + 1}.png`,
        data: imageData,
        rect: rect
      });
    }
    
    setProcessedAssets(processed);
    setIsProcessing(false);
  };

  // Download single asset
  const downloadAsset = (asset) => {
    const link = document.createElement('a');
    link.href = asset.data;
    link.download = asset.name;
    link.click();
  };

  // Download all assets as ZIP
  const downloadAllAssets = async () => {
    if (processedAssets.length === 0) return;
    
    const zip = new JSZip();
    
    processedAssets.forEach((asset) => {
      const base64Data = asset.data.split(',')[1];
      zip.file(asset.name, base64Data, { base64: true });
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'game-assets.zip';
    link.click();
  };

  // Redraw when selections change
  useEffect(() => {
    if (imageRef.current) {
      drawCanvas(imageRef.current, selections);
    }
  }, [selections]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Game Asset Extractor
          </h1>
          <p className="text-gray-400">
            이미지에서 게임 에셋 추출 • 배경 제거 • AI 화질 향상
          </p>
        </div>

        {/* Upload Section */}
        {!image && (
          <div className="bg-gray-800 rounded-2xl p-12 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors">
            <label className="cursor-pointer flex flex-col items-center justify-center">
              <Upload className="w-16 h-16 mb-4 text-gray-400" />
              <span className="text-xl font-semibold mb-2">이미지 업로드</span>
              <span className="text-gray-400 text-sm">방 레이아웃 또는 스프라이트 시트</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Main Content */}
        {image && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Canvas Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">영역 선택</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={clearAllSelections}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      전체 삭제
                    </button>
                    <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      다른 이미지
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-[600px]">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="max-w-full cursor-crosshair"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                
                <p className="text-sm text-gray-400 mt-2">
                  💡 마우스 드래그로 오브젝트 영역을 선택하세요
                </p>
              </div>

              {/* Processing Controls */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">처리 옵션</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      업스케일 배율
                    </label>
                    <select
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value={1}>1x (원본)</option>
                      <option value={2}>2x (2배)</option>
                      <option value={4}>4x (4배)</option>
                    </select>
                  </div>

                  <button
                    onClick={processAllAssets}
                    disabled={selections.length === 0 || isProcessing}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Wand2 className="w-5 h-5" />
                    {isProcessing ? '처리 중...' : `${selections.length}개 에셋 처리`}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Selection List */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">
                  선택된 영역 ({selections.length})
                </h3>
                
                {selections.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    아직 선택된 영역이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selections.map((rect, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-700 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">Asset {idx + 1}</p>
                          <p className="text-xs text-gray-400">
                            {Math.round(rect.width)} × {Math.round(rect.height)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeSelection(idx)}
                          className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Processed Assets */}
              {processedAssets.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      처리된 에셋 ({processedAssets.length})
                    </h3>
                    <button
                      onClick={downloadAllAssets}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      ZIP 다운로드
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {processedAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="bg-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={asset.data}
                            alt={asset.name}
                            className="w-16 h-16 object-contain bg-gray-800 rounded border border-gray-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{asset.name}</p>
                            <p className="text-xs text-gray-400">
                              {Math.round(asset.rect.width * scale)} × {Math.round(asset.rect.height * scale)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadAsset(asset)}
                          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          다운로드
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
