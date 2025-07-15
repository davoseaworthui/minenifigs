"use client";

import React, { useState } from "react";
import { useCollectionStore, SelectedPart } from "@/store/useCollectionStore";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

interface SelectedPartsListProps {
  selectedParts: SelectedPart[];
}

const SelectedPartsList: React.FC<SelectedPartsListProps> = ({
  selectedParts,
}) => {
  const [collectionTitle, setCollectionTitle] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { saveCollection, clearSelectedParts, isLoading, error } =
    useCollectionStore();
  const { user } = useAuth();

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (collectionTitle.trim() && selectedParts.length > 0 && user) {
      try {
        const success = await saveCollection(collectionTitle.trim(), user.uid);
        if (success) {
          setCollectionTitle("");
          setShowSaveForm(false);
          setSaveSuccess(true);
          // Hide success message after 3 seconds
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (error) {
        console.error("Error saving collection:", error);
      }
    }
  };

  const handleClearAll = () => {
    clearSelectedParts();
  };

  const handleSaveClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowSaveForm(true);
    }
  };

  if (selectedParts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Selected Parts ({selectedParts.length})
          </h3>
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
          {selectedParts.map((selectedPart, index) => (
            <div
              key={selectedPart.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {index + 1}. {selectedPart.part.part.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className="px-2 py-1 rounded text-white text-xs font-medium"
                    style={{
                      backgroundColor: `#${selectedPart.part.color.rgb}`,
                    }}
                  >
                    {selectedPart.part.color.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedPart.part.part.part_num}
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    From: {selectedPart.sourceMinifig.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Collection saved successfully!
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
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

          {!showSaveForm ? (
            <button
              onClick={handleSaveClick}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              {isLoading ? "Saving..." : "Save Collection"}
            </button>
          ) : (
            <form onSubmit={handleSaveCollection} className="space-y-3">
              <div>
                <label
                  htmlFor="collectionTitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Collection Name
                </label>
                <input
                  id="collectionTitle"
                  type="text"
                  value={collectionTitle}
                  onChange={(e) => setCollectionTitle(e.target.value)}
                  placeholder="Enter collection name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default SelectedPartsList;
