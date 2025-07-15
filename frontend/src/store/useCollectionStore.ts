import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MinifigPart, Minifig } from "@/lib/rebrickable";
import { collectionsService } from "@/lib/collections";

export interface SelectedPart {
  id: string;
  part: MinifigPart;
  sourceMinifig: Minifig; // Track which minifig this part came from
  position?: { x: number; y: number };
}

export interface Collection {
  id: string;
  title: string;
  sourceMinifigs: Minifig[]; // Multiple source minifigs
  parts: SelectedPart[];
  createdAt: Date;
  updatedAt: Date;
}

interface CollectionStore {
  // Current builder state
  selectedParts: SelectedPart[];
  sourceMinifigs: Minifig[]; // Multiple minifigs being used as sources
  currentMinifig: Minifig | null; // Currently viewing parts from this minifig

  // Collections
  collections: Collection[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  addPart: (part: MinifigPart, sourceMinifig: Minifig) => void;
  removePart: (partId: string) => void;
  updatePartPosition: (
    partId: string,
    position: { x: number; y: number }
  ) => void;
  clearSelectedParts: () => void;

  setCurrentMinifig: (minifig: Minifig | null) => void;
  addSourceMinifig: (minifig: Minifig) => void;
  removeSourceMinifig: (minifigId: string) => void;
  clearSourceMinifigs: () => void;

  // Collection management
  saveCollection: (title: string, userId: string) => Promise<boolean>;
  loadCollections: (userId: string) => Promise<void>;
  deleteCollection: (collectionId: string) => Promise<boolean>;
  loadCollection: (collection: Collection) => void;

  // UI state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedParts: [],
      sourceMinifigs: [],
      currentMinifig: null,
      collections: [],
      isLoading: false,
      error: null,

      // Actions
      addPart: (part: MinifigPart, sourceMinifig: Minifig) => {
        const selectedPart: SelectedPart = {
          id: `${part.part.part_num}-${part.color.id}-${Date.now()}`,
          part,
          sourceMinifig,
        };

        set((state) => ({
          selectedParts: [...state.selectedParts, selectedPart],
        }));
      },

      removePart: (partId: string) => {
        set((state) => ({
          selectedParts: state.selectedParts.filter((p) => p.id !== partId),
        }));
      },

      updatePartPosition: (
        partId: string,
        position: { x: number; y: number }
      ) => {
        set((state) => ({
          selectedParts: state.selectedParts.map((p) =>
            p.id === partId ? { ...p, position } : p
          ),
        }));
      },

      clearSelectedParts: () => {
        set({ selectedParts: [] });
      },

      setCurrentMinifig: (minifig: Minifig | null) => {
        set({ currentMinifig: minifig });
      },

      addSourceMinifig: (minifig: Minifig) => {
        set((state) => {
          // Don't add duplicates
          if (state.sourceMinifigs.some((m) => m.set_num === minifig.set_num)) {
            return state;
          }
          return {
            sourceMinifigs: [...state.sourceMinifigs, minifig],
          };
        });
      },

      removeSourceMinifig: (minifigId: string) => {
        set((state) => ({
          sourceMinifigs: state.sourceMinifigs.filter(
            (m) => m.set_num !== minifigId
          ),
          // Also remove any selected parts from this minifig
          selectedParts: state.selectedParts.filter(
            (p) => p.sourceMinifig.set_num !== minifigId
          ),
        }));
      },

      clearSourceMinifigs: () => {
        set({
          sourceMinifigs: [],
          selectedParts: [],
          currentMinifig: null,
        });
      },

      // Collection management with Firebase integration
      saveCollection: async (title: string, userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const collectionData = {
            title,
            sourceMinifigs: get().sourceMinifigs,
            parts: get().selectedParts,
          };

          const result = await collectionsService.saveCollection(
            userId,
            collectionData
          );

          if (result.success) {
            // Add to local state with the new ID if provided
            if (result.id) {
              const newCollection: Collection = {
                id: result.id,
                ...collectionData,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              set((state) => ({
                collections: [newCollection, ...state.collections],
                isLoading: false,
              }));
            }

            // If there's a warning message (e.g., demo mode), set it
            if (result.error) {
              set({ error: result.error });
            }

            return true;
          } else {
            set({
              error:
                result.error || "Failed to save collection. Please try again.",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error("Error in saveCollection:", error);
          set({
            error: "An unexpected error occurred. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      loadCollections: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const collections = await collectionsService.getUserCollections(
            userId
          );
          set({ collections, isLoading: false });
        } catch (error) {
          console.error("Error loading collections:", error);
          set({
            collections: [],
            error: "Failed to load collections. Please try again.",
            isLoading: false,
          });
        }
      },

      deleteCollection: async (collectionId: string) => {
        set({ isLoading: true, error: null });

        try {
          const result = await collectionsService.deleteCollection(
            collectionId
          );

          if (result.success) {
            set((state) => ({
              collections: state.collections.filter(
                (c) => c.id !== collectionId
              ),
              isLoading: false,
            }));

            // If there's a warning message (e.g., demo mode), set it
            if (result.error) {
              set({ error: result.error });
            }

            return true;
          } else {
            set({
              error:
                result.error ||
                "Failed to delete collection. Please try again.",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error("Error in deleteCollection:", error);
          set({
            error: "An unexpected error occurred. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      loadCollection: (collection: Collection) => {
        set({
          selectedParts: collection.parts,
          sourceMinifigs: collection.sourceMinifigs,
          currentMinifig: collection.sourceMinifigs[0] || null,
        });
      },

      // UI state management
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: "minifig-builder-storage", // unique name for localStorage key
      partialize: (state) => ({
        // Only persist builder state, not UI state or collections
        selectedParts: state.selectedParts,
        sourceMinifigs: state.sourceMinifigs,
        currentMinifig: state.currentMinifig,
      }),
    }
  )
);
