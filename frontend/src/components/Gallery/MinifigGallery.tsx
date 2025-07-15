"use client";

import React, { useState, useEffect } from "react";
import { rebrickableAPI, Minifig } from "@/lib/rebrickable";
import MinifigCard from "./MinifigCard";

const MinifigGallery: React.FC = () => {
  const [minifigs, setMinifigs] = useState<Minifig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchMinifigs(searchTerm.trim());
    }
  };

  const handleRandomize = () => {
    fetchMinifigs(undefined, true);
  };

  useEffect(() => {
    // Load initial random minifigs
    fetchMinifigs(undefined, true);
  }, []);

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Discover Amazing Minifigs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Search through thousands of LEGO minifigures or discover new ones
              randomly. Click on any minifig to start building your custom
              creation!
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-4"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for minifigs (e.g., Harry Potter, Batman, Star Wars)..."
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
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="mb-8">
          {!loading && minifigs.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Found {minifigs.length} minifigs
              </h3>
              <div className="text-sm text-gray-500">
                Click &quot;View Parts&quot; to start building
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-lg text-gray-600">Loading amazing minifigs...</p>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && minifigs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {minifigs.map((minifig) => (
              <MinifigCard key={minifig.set_num} minifig={minifig} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && minifigs.length === 0 && !error && (
          <div className="text-center py-16">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No minifigs found
            </h3>
            <p className="text-gray-600 mb-6">
              Try a different search term or discover random minifigs
            </p>
            <button
              onClick={handleRandomize}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
            >
              Discover Random Minifigs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinifigGallery;
