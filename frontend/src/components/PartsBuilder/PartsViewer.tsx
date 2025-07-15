"use client";

import React, { useState, useEffect } from "react";
import { rebrickableAPI, MinifigPart } from "@/lib/rebrickable";
import { useCollectionStore } from "@/store/useCollectionStore";
import FigureComposer from "./FigureComposer";
import SelectedPartsList from "./SelectedPartsList";

interface PartsViewerProps {
  minifigId: string;
}

const PartsViewer: React.FC<PartsViewerProps> = ({ minifigId }) => {
  const [parts, setParts] = useState<MinifigPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedParts, addPart, currentMinifig, setCurrentMinifig } =
    useCollectionStore();

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch minifig details
        const minifigDetails = await rebrickableAPI.getMinifigDetails(
          minifigId
        );
        setCurrentMinifig(minifigDetails);

        // Fetch parts
        const partsResponse = await rebrickableAPI.getMinifigParts(minifigId);
        setParts(partsResponse.results);
      } catch (err) {
        setError("Failed to fetch minifig parts. Please try again.");
        console.error("Error fetching parts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [minifigId, setCurrentMinifig]);

  const handleAddPart = (part: MinifigPart) => {
    if (currentMinifig) {
      addPart(part, currentMinifig);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentMinifig?.name || "Minifig Parts"}
            </h1>
            <p className="text-gray-600">
              Click parts to add them to your custom minifig
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Parts Grid */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Parts ({parts.length})
            </h2>

            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {parts.map((part) => (
                <div
                  key={`${part.part.part_num}-${part.color.id}`}
                  onClick={() => handleAddPart(part)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer p-4 hover:scale-105"
                >
                  <div className="aspect-square relative bg-gray-100 rounded-md mb-3">
                    {part.part.part_img_url ? (
                      <img
                        src={part.part.part_img_url}
                        alt={part.part.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {part.part.name}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span
                        className="px-2 py-1 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: `#${part.color.rgb}` }}
                      >
                        {part.color.name}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {part.quantity}x
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {part.part.part_num}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Builder Area */}
        <div className="lg:col-span-3 space-y-6">
          <FigureComposer selectedParts={selectedParts} />
          <SelectedPartsList selectedParts={selectedParts} />
        </div>
      </div>
    </div>
  );
};

export default PartsViewer;
