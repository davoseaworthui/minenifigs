"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useDroppable } from "@dnd-kit/core";
import { useCollectionStore, SelectedPart } from "@/store/useCollectionStore";
import {
  backgroundRemovalService,
  ProcessedImage,
} from "@/lib/backgroundRemoval";

interface FigureComposerProps {
  selectedParts: SelectedPart[];
}

interface ComposedPart extends SelectedPart {
  processedImage?: ProcessedImage;
  layer: number;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

const FigureComposer: React.FC<FigureComposerProps> = ({ selectedParts }) => {
  const [composedParts, setComposedParts] = useState<ComposedPart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const composedPartsRef = useRef<ComposedPart[]>([]);
  const { removePart, updatePartPosition } = useCollectionStore();

  const { isOver, setNodeRef } = useDroppable({
    id: "figure-composer",
  });

  // Keep ref in sync with state
  useEffect(() => {
    composedPartsRef.current = composedParts;
  }, [composedParts]);

  // Process images when parts change
  useEffect(() => {
    setIsProcessing(true);

    // Get current composed parts from ref
    const currentComposedParts = composedPartsRef.current;

    // Only process new parts that don't exist in composedParts
    const existingIds = new Set(currentComposedParts.map((p) => p.id));
    const newParts = selectedParts.filter((part) => !existingIds.has(part.id));

    // Remove parts that are no longer selected
    const selectedIds = new Set(selectedParts.map((p) => p.id));
    const partsToKeep = currentComposedParts.filter((part) =>
      selectedIds.has(part.id)
    );

    if (
      newParts.length === 0 &&
      partsToKeep.length === currentComposedParts.length
    ) {
      // No changes needed
      setIsProcessing(false);
      return;
    }

    // Process only new parts
    const processNewParts = async () => {
      const processed = await Promise.all(
        newParts.map(async (part, index) => {
          const processedImage =
            await backgroundRemovalService.removeBackgroundCanvas(
              part.part.part.part_img_url || ""
            );

          // Use saved position if available, otherwise calculate new position
          let position = part.position;

          if (!position) {
            // Calculate position for new parts to avoid overlap
            const existingPositions = partsToKeep.map((p) => p.position);
            let newX = 200;
            let newY = 200;

            // Find a non-overlapping position
            let offset = 0;
            while (
              existingPositions.some(
                (pos) =>
                  Math.abs(pos.x - newX) < 30 && Math.abs(pos.y - newY) < 30
              )
            ) {
              offset += 30;
              newX = 200 + offset;
              newY = 200 + offset;
              if (newX > 400 || newY > 300) {
                // Reset if we go too far
                newX = 150 + Math.random() * 200;
                newY = 150 + Math.random() * 100;
                break;
              }
            }
            position = { x: newX, y: newY };
          }

          return {
            ...part,
            processedImage,
            layer: partsToKeep.length + index,
            position,
            scale: 1,
            rotation: 0,
          } as ComposedPart;
        })
      );

      // Combine existing parts with new parts and ensure proper layer ordering
      const allParts = [...partsToKeep, ...processed];

      // Ensure all parts have correct layer numbers
      allParts.forEach((part, index) => {
        part.layer = index;
      });

      setComposedParts(allParts);
      setIsProcessing(false);
    };

    if (newParts.length > 0) {
      processNewParts();
    } else {
      // Just update with parts to keep (removal case)
      // Ensure proper layer numbering after removal
      partsToKeep.forEach((part, index) => {
        part.layer = index;
      });
      setComposedParts(partsToKeep);
      setIsProcessing(false);
    }
  }, [selectedParts]);

  const handlePartClick = (partId: string) => {
    setSelectedPartId(selectedPartId === partId ? null : partId);
  };

  const handlePartMove = (
    partId: string,
    newPosition: { x: number; y: number }
  ) => {
    setComposedParts((prev) =>
      prev.map((part) =>
        part.id === partId ? { ...part, position: newPosition } : part
      )
    );

    // Also update position in the store
    updatePartPosition(partId, newPosition);
  };

  const handlePartScale = (partId: string, scale: number) => {
    setComposedParts((prev) =>
      prev.map((part) =>
        part.id === partId
          ? { ...part, scale: Math.max(0.1, Math.min(3, scale)) }
          : part
      )
    );
  };

  const handlePartRotation = (partId: string, rotation: number) => {
    setComposedParts((prev) =>
      prev.map((part) => (part.id === partId ? { ...part, rotation } : part))
    );
  };

  const handleLayerChange = (partId: string, direction: "up" | "down") => {
    setComposedParts((prev) => {
      const parts = [...prev];
      const currentIndex = parts.findIndex((p) => p.id === partId);

      if (currentIndex === -1) return prev;

      // Calculate target index
      const targetIndex =
        direction === "up" ? currentIndex + 1 : currentIndex - 1;

      // Check bounds
      if (targetIndex < 0 || targetIndex >= parts.length) return prev;

      // Swap the parts
      const temp = parts[currentIndex];
      parts[currentIndex] = parts[targetIndex];
      parts[targetIndex] = temp;

      // Update layer numbers based on new positions
      parts.forEach((part, index) => {
        part.layer = index;
      });

      return parts;
    });
  };

  const exportComposition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw parts in layer order
    const sortedParts = [...composedParts].sort((a, b) => a.layer - b.layer);

    sortedParts.forEach((part) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();

        // Apply transformations
        ctx.translate(part.position.x, part.position.y);
        ctx.rotate((part.rotation * Math.PI) / 180);
        ctx.scale(part.scale, part.scale);

        // Draw the image
        ctx.drawImage(img, -50, -50, 100, 100);
        ctx.restore();
      };

      img.src = part.processedImage?.isProcessed
        ? part.processedImage.processedUrl
        : part.processedImage?.originalUrl || "";
    });

    // Download the composition
    setTimeout(() => {
      const link = document.createElement("a");
      link.download = "minifig-composition.png";
      link.href = canvas.toDataURL();
      link.click();
    }, 1000);
  };

  const selectedPart = composedParts.find((p) => p.id === selectedPartId);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Figure Composer</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showOriginal
                ? "bg-gray-200 text-gray-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {showOriginal ? "Show Processed" : "Show Original"}
          </button>
          <button
            onClick={exportComposition}
            disabled={composedParts.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composition Canvas */}
        <div className="lg:col-span-2">
          <div
            ref={setNodeRef}
            className={`relative w-full h-96 border-2 border-dashed rounded-xl transition-colors ${
              isOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
            style={{
              backgroundImage:
                "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Processing images...</p>
                </div>
              </div>
            )}

            {composedParts.length === 0 && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p className="text-lg font-medium">
                    Drop parts here to compose
                  </p>
                  <p className="text-sm">
                    Drag parts from the left to start building
                  </p>
                </div>
              </div>
            )}

            {/* Render composed parts */}
            {composedParts.map((part) => (
              <div
                key={part.id}
                className={`absolute cursor-pointer transition-all duration-200 ${
                  selectedPartId === part.id
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : ""
                }`}
                style={{
                  left: part.position.x - 50,
                  top: part.position.y - 50,
                  transform: `scale(${part.scale}) rotate(${part.rotation}deg)`,
                  zIndex: part.layer + 10,
                }}
                onClick={() => handlePartClick(part.id)}
                onMouseDown={(e) => {
                  const startX = e.clientX - part.position.x;
                  const startY = e.clientY - part.position.y;

                  const handleMouseMove = (e: MouseEvent) => {
                    const newX = Math.max(
                      50,
                      Math.min(550, e.clientX - startX)
                    );
                    const newY = Math.max(
                      50,
                      Math.min(350, e.clientY - startY)
                    );
                    handlePartMove(part.id, { x: newX, y: newY });
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
              >
                {part.processedImage && (
                  <Image
                    src={
                      showOriginal
                        ? part.processedImage.originalUrl
                        : part.processedImage.processedUrl
                    }
                    alt={part.part.part.name}
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                )}

                {/* Part controls overlay */}
                {selectedPartId === part.id && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-2 py-1 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerChange(part.id, "up");
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Bring forward"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 11l5-5m0 0l5 5m-5-5v12"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerChange(part.id, "down");
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Send backward"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 13l-5 5m0 0l-5-5m5 5V6"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePart(part.id);
                      }}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                      title="Remove part"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Composition Tools
            </h4>

            {selectedPart ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scale: {selectedPart.scale.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={selectedPart.scale}
                    onChange={(e) =>
                      handlePartScale(
                        selectedPart.id,
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotation: {selectedPart.rotation}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={selectedPart.rotation}
                    onChange={(e) =>
                      handlePartRotation(
                        selectedPart.id,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layer: {selectedPart.layer + 1}
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleLayerChange(selectedPart.id, "up")}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Forward
                    </button>
                    <button
                      onClick={() => handleLayerChange(selectedPart.id, "down")}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Backward
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {selectedPart.part.part.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedPart.part.part.part_num}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Click on a part in the canvas to edit its properties
              </p>
            )}
          </div>

          {/* Parts List */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Parts ({composedParts.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {composedParts.map((part) => (
                <div
                  key={part.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedPartId === part.id
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handlePartClick(part.id)}
                >
                  <div className="w-8 h-8 relative">
                    {part.processedImage && (
                      <Image
                        src={part.processedImage.processedUrl}
                        alt={part.part.part.name}
                        fill
                        sizes="32px"
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {part.part.part.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Layer {part.layer + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FigureComposer;
