"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { rebrickableAPI, Minifig, MinifigPart } from "@/lib/rebrickable";
import { useCollectionStore } from "@/store/useCollectionStore";
import FigureComposer from "../PartsBuilder/FigureComposer";
import SelectedPartsList from "../PartsBuilder/SelectedPartsList";
import Navigation from "../Navigation";

const CrossMinifigBuilder: React.FC = () => {
  const [minifigs, setMinifigs] = useState<Minifig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minifigParts, setMinifigParts] = useState<
    Record<string, MinifigPart[]>
  >({});
  const [partsLoading, setPartsLoading] = useState(false);

  const {
    sourceMinifigs,
    selectedParts,
    currentMinifig,
    addSourceMinifig,
    removeSourceMinifig,
    setCurrentMinifig,
    addPart,
    clearSourceMinifigs,
  } = useCollectionStore();

  const fetchMinifigs = async (search?: string, isRandom = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = isRandom
        ? await rebrickableAPI.getRandomMinifigs(20)
        : await rebrickableAPI.getMinifigs(search, 1, 20);

      setMinifigs(response.results);
    } catch (err) {
      setError("Failed to fetch minifigs. Please try again.");
      console.error("Error fetching minifigs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMinifigParts = async (minifigId: string) => {
    if (minifigParts[minifigId]) return; // Already loaded

    setPartsLoading(true);
    try {
      const response = await rebrickableAPI.getMinifigParts(minifigId);
      setMinifigParts((prev) => ({
        ...prev,
        [minifigId]: response.results,
      }));
    } catch (err) {
      console.error("Error fetching parts:", err);
    } finally {
      setPartsLoading(false);
    }
  };

  const handleMinifigSelect = (minifig: Minifig) => {
    addSourceMinifig(minifig);
    setCurrentMinifig(minifig);
    fetchMinifigParts(minifig.set_num);
  };

  const handleMinifigRemove = (minifigId: string) => {
    removeSourceMinifig(minifigId);
    // If we removed the current minifig, switch to another one
    if (currentMinifig?.set_num === minifigId) {
      const remaining = sourceMinifigs.filter((m) => m.set_num !== minifigId);
      setCurrentMinifig(remaining[0] || null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchMinifigs(searchTerm.trim());
    }
  };

  const handleRandomize = () => {
    fetchMinifigs(undefined, true);
  };

  const handleAddPart = (part: MinifigPart, sourceMinifig: Minifig) => {
    addPart(part, sourceMinifig);
  };

  useEffect(() => {
    // Get initial state from store
    const store = useCollectionStore.getState();

    // Check if we have a loaded collection (from dashboard "Continue Building")
    if (store.sourceMinifigs.length > 0 && store.selectedParts.length > 0) {
      // Collection data is already loaded from the store
      // Load parts for all source minifigs
      store.sourceMinifigs.forEach((minifig) => {
        fetchMinifigParts(minifig.set_num);
      });

      // Also load the minifigs into the gallery
      setMinifigs(store.sourceMinifigs);
    } else {
      // Load initial random minifigs for new builds
      fetchMinifigs(undefined, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Get all parts from selected minifigs
  const allAvailableParts = sourceMinifigs.flatMap((minifig) =>
    (minifigParts[minifig.set_num] || []).map((part) => ({
      ...part,
      sourceMinifig: minifig,
    }))
  );

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background_img.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-blue-900/50 to-purple-900/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                Cross-Minifig Builder
              </h1>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto drop-shadow-md">
                Select multiple minifigs and combine their parts to create
                unique custom builds. Mix and match parts from different themes
                and characters!
              </p>
            </div>

            {/* Search Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
              <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-4"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for minifigs to add to your collection..."
                    className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !searchTerm.trim()}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors shadow-lg"
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    disabled={loading}
                    className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors shadow-lg"
                  >
                    {loading ? "Loading..." : "Random"}
                  </button>
                  {sourceMinifigs.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSourceMinifigs}
                      className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Selected Minifigs Bar */}
          {sourceMinifigs.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Selected Minifigs ({sourceMinifigs.length})
                </h3>
                <div className="text-sm text-gray-500">
                  Parts from these minifigs will appear below
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {sourceMinifigs.map((minifig) => (
                  <div
                    key={minifig.set_num}
                    className={`relative group bg-gray-50 rounded-xl p-4 border-2 transition-all cursor-pointer ${
                      currentMinifig?.set_num === minifig.set_num
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setCurrentMinifig(minifig)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMinifigRemove(minifig.set_num);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center">
                        {minifig.set_img_url ? (
                          <Image
                            src={minifig.set_img_url}
                            alt={minifig.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-24">
                        {minifig.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Minifig Gallery */}
            <div className="lg:col-span-1">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Available Minifigs
                </h2>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-2"></div>
                    <p className="text-sm text-gray-600">Loading minifigs...</p>
                  </div>
                )}

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {minifigs.map((minifig) => (
                    <div
                      key={minifig.set_num}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        sourceMinifigs.some(
                          (m) => m.set_num === minifig.set_num
                        )
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                      onClick={() => handleMinifigSelect(minifig)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {minifig.set_img_url ? (
                            <Image
                              src={minifig.set_img_url}
                              alt={minifig.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {minifig.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {minifig.num_parts} parts
                          </p>
                        </div>
                        {sourceMinifigs.some(
                          (m) => m.set_num === minifig.set_num
                        ) && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Builder Area */}
            <div className="lg:col-span-2 space-y-6">
              {sourceMinifigs.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400"
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
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select Minifigs to Start Building
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Choose one or more minifigs from the gallery to access their
                    parts and start creating your custom build.
                  </p>
                </div>
              ) : (
                <>
                  {/* Parts Section */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Available Parts ({allAvailableParts.length})
                      </h3>
                      {currentMinifig && (
                        <div className="text-sm text-gray-500">
                          Viewing: {currentMinifig.name}
                        </div>
                      )}
                    </div>

                    {partsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mr-3"></div>
                        <span className="text-gray-600">Loading parts...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-64 overflow-y-auto">
                        {allAvailableParts.map((partWithSource, index) => (
                          <div
                            key={`${partWithSource.part.part_num}-${partWithSource.color.id}-${index}`}
                            onClick={() =>
                              handleAddPart(
                                partWithSource,
                                partWithSource.sourceMinifig
                              )
                            }
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer p-3 hover:scale-105"
                          >
                            <div className="aspect-square relative bg-gray-100 rounded-md mb-2">
                              {partWithSource.part.part_img_url ? (
                                <img
                                  src={partWithSource.part.part_img_url}
                                  alt={partWithSource.part.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg
                                    className="w-6 h-6"
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
                              <h4 className="text-xs font-medium text-gray-900 line-clamp-1">
                                {partWithSource.part.name}
                              </h4>
                              <span
                                className="inline-block px-1 py-0.5 rounded text-white text-xs mt-1"
                                style={{
                                  backgroundColor: `#${partWithSource.color.rgb}`,
                                }}
                              >
                                {partWithSource.color.name}
                              </span>
                              <p className="text-xs text-blue-600 font-medium truncate mt-1">
                                {partWithSource.sourceMinifig.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Builder Interface */}
                  <div className="space-y-6">
                    <FigureComposer selectedParts={selectedParts} />
                    <SelectedPartsList selectedParts={selectedParts} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossMinifigBuilder;
