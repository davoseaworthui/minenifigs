import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreError,
} from "firebase/firestore";
import { db } from "./firebase";
import { Collection, SelectedPart } from "@/store/useCollectionStore";

const COLLECTIONS_COLLECTION = "collections";

// Response types for collection operations
export interface CollectionResponse {
  success: boolean;
  error?: string;
}

export interface SaveCollectionResponse extends CollectionResponse {
  id?: string;
}

// Types for stored data
interface StoredPart {
  id: string;
  position?: { x: number; y: number };
  part_num: string;
  part_name: string;
  part_img_url: string;
  color_id: number;
  color_name: string;
  color_rgb: string;
  sourceMinifig: {
    set_num: string;
    name: string;
    set_img_url: string;
  };
}

// Transform part data for Firestore storage
const transformPartForStorage = (part: SelectedPart): StoredPart => {
  const transformed: Partial<StoredPart> = {
    id: part.id,
    // Flatten part data to avoid nested arrays
    part_num: part.part.part.part_num || "",
    part_name: part.part.part.name || "",
    part_img_url: part.part.part.part_img_url || "",
    color_id: part.part.color.id || 0,
    color_name: part.part.color.name || "",
    color_rgb: part.part.color.rgb || "",
    // Store only necessary minifig data
    sourceMinifig: {
      set_num: part.sourceMinifig.set_num || "",
      name: part.sourceMinifig.name || "",
      set_img_url: part.sourceMinifig.set_img_url || "",
    },
  };

  // Only add position if it exists
  if (part.position) {
    transformed.position = part.position;
  }

  return transformed as StoredPart;
};

// Helper function to remove undefined values from an object
const removeUndefinedValues = (
  obj: Record<string, unknown>
): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const cleanedNested = removeUndefinedValues(
          value as Record<string, unknown>
        );
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else if (Array.isArray(value)) {
        cleaned[key] = value
          .map((item) =>
            typeof item === "object" && item !== null
              ? removeUndefinedValues(item as Record<string, unknown>)
              : item
          )
          .filter((item) => item !== undefined);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

// Transform stored data back to app format
const transformStoredPart = (storedPart: StoredPart): SelectedPart => {
  return {
    id: storedPart.id,
    position: storedPart.position,
    part: {
      id: 0, // Default value
      inv_part_id: 0, // Default value
      part: {
        part_num: storedPart.part_num,
        name: storedPart.part_name,
        part_img_url: storedPart.part_img_url,
        part_cat_id: 0, // Default value
        part_url: "", // Default value
        external_ids: {}, // Default empty object
        print_of: null, // Default null
      },
      color: {
        id: storedPart.color_id,
        name: storedPart.color_name,
        rgb: storedPart.color_rgb,
        is_trans: false, // Default value
        external_ids: {}, // Default empty object
      },
      set_num: storedPart.sourceMinifig.set_num, // Use source minifig set number
      quantity: 1, // Default value
      is_spare: false, // Default value
      element_id: "", // Default value
      num_sets: 0, // Default value for number of sets this part appears in
    },
    sourceMinifig: {
      set_num: storedPart.sourceMinifig.set_num,
      name: storedPart.sourceMinifig.name,
      set_img_url: storedPart.sourceMinifig.set_img_url,
      num_parts: 0, // Default value
      set_url: "", // Default value
      last_modified_dt: new Date().toISOString(), // Current date as default
    },
  };
};

// Convert Firestore document to Collection type
const convertFirestoreDoc = (
  doc: QueryDocumentSnapshot<DocumentData>
): Collection => {
  const data = doc.data();

  // Helper function to safely convert timestamps
  const safeTimestampToDate = (timestamp: unknown): Date => {
    if (!timestamp) {
      return new Date();
    }

    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // If it's a Firestore Timestamp with toDate method
    if (
      timestamp &&
      typeof timestamp === "object" &&
      "toDate" in timestamp &&
      typeof (timestamp as any).toDate === "function"
    ) {
      return (timestamp as any).toDate();
    }

    // If it's a timestamp object with seconds and nanoseconds
    if (
      timestamp &&
      typeof timestamp === "object" &&
      "seconds" in timestamp &&
      typeof (timestamp as any).seconds === "number"
    ) {
      return new Date((timestamp as any).seconds * 1000);
    }

    // If it's a string, try to parse it
    if (typeof timestamp === "string") {
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    // If it's a number (milliseconds)
    if (typeof timestamp === "number") {
      return new Date(timestamp);
    }

    // Fallback to current date
    return new Date();
  };

  return {
    id: doc.id,
    title: data.title || "Untitled Collection",
    sourceMinifigs: data.sourceMinifigs || [],
    // Transform stored parts back to app format
    parts: (data.parts || []).map(transformStoredPart),
    createdAt: safeTimestampToDate(data.createdAt),
    updatedAt: safeTimestampToDate(data.updatedAt),
  };
};

// Helper to check if error is a Firestore error
const isFirestoreError = (error: unknown): error is FirestoreError => {
  return error instanceof Error && "code" in error;
};

export const collectionsService = {
  // Save a new collection
  async saveCollection(
    userId: string,
    collectionData: Omit<Collection, "id" | "createdAt" | "updatedAt">
  ): Promise<SaveCollectionResponse> {
    try {
      // Check if we're in demo mode
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "demo-mode") {
        return {
          success: true,
          id: "demo-" + Date.now(),
          error: "Running in demo mode - collection saved locally",
        };
      }

      // Transform parts data before saving
      const transformedData = {
        ...collectionData,
        parts: collectionData.parts.map(transformPartForStorage),
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values to prevent Firestore errors
      const cleanedData = removeUndefinedValues(
        transformedData as Record<string, unknown>
      );

      const docRef = await addDoc(
        collection(db, COLLECTIONS_COLLECTION),
        cleanedData
      );

      return {
        success: true,
        id: docRef.id,
      };
    } catch (error) {
      console.error("Error saving collection:", error);

      if (isFirestoreError(error)) {
        // Handle specific Firestore errors
        switch (error.code) {
          case "permission-denied":
            return {
              success: false,
              error: "You don't have permission to save collections",
            };
          case "unavailable":
            return {
              success: false,
              error:
                "Service is temporarily unavailable. Please try again later",
            };
          default:
            return {
              success: false,
              error: `Failed to save collection: ${error.message}`,
            };
        }
      }

      return {
        success: false,
        error: "Failed to save collection. Please try again",
      };
    }
  },

  // Update an existing collection
  async updateCollection(
    collectionId: string,
    updates: Partial<Omit<Collection, "id" | "createdAt">>
  ): Promise<CollectionResponse> {
    try {
      // Check if we're in demo mode
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "demo-mode") {
        return {
          success: true,
          error: "Running in demo mode - collection updated locally",
        };
      }

      // Transform parts data if it exists in the updates
      const transformedUpdates = {
        ...updates,
        parts: updates.parts?.map(transformPartForStorage),
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
      await updateDoc(docRef, transformedUpdates);

      return { success: true };
    } catch (error) {
      console.error("Error updating collection:", error);

      if (isFirestoreError(error)) {
        switch (error.code) {
          case "not-found":
            return { success: false, error: "Collection not found" };
          case "permission-denied":
            return {
              success: false,
              error: "You don't have permission to update this collection",
            };
          default:
            return {
              success: false,
              error: `Failed to update collection: ${error.message}`,
            };
        }
      }

      return {
        success: false,
        error: "Failed to update collection. Please try again",
      };
    }
  },

  // Delete a collection
  async deleteCollection(collectionId: string): Promise<CollectionResponse> {
    try {
      // Check if we're in demo mode
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "demo-mode") {
        return {
          success: true,
          error: "Running in demo mode - collection deleted locally",
        };
      }

      const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
      await deleteDoc(docRef);

      return { success: true };
    } catch (error) {
      console.error("Error deleting collection:", error);

      if (isFirestoreError(error)) {
        switch (error.code) {
          case "not-found":
            return { success: false, error: "Collection not found" };
          case "permission-denied":
            return {
              success: false,
              error: "You don't have permission to delete this collection",
            };
          default:
            return {
              success: false,
              error: `Failed to delete collection: ${error.message}`,
            };
        }
      }

      return {
        success: false,
        error: "Failed to delete collection. Please try again",
      };
    }
  },

  // Get all collections for a user
  async getUserCollections(userId: string): Promise<Collection[]> {
    try {
      console.log("Loading collections for user:", userId);

      // Simplified query without orderBy to avoid index requirement
      const q = query(
        collection(db, COLLECTIONS_COLLECTION),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      console.log("Query snapshot size:", querySnapshot.size);

      // If no collections found, return empty array
      if (querySnapshot.empty) {
        console.log("No collections found for user");
        return [];
      }

      const collections = querySnapshot.docs
        .map(convertFirestoreDoc)
        .filter((collection) => collection.id !== "example") // Filter out example collection
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort in memory instead

      console.log("Loaded collections:", collections.length);
      return collections;
    } catch (error) {
      console.error("Error fetching collections:", error);

      // If it's a Firestore error, log more details
      if (isFirestoreError(error)) {
        console.error("Firestore error code:", error.code);
        console.error("Firestore error message:", error.message);
      }

      // Return empty array instead of throwing error
      return [];
    }
  },

  // Get a specific collection by ID
  async getCollection(collectionId: string): Promise<Collection | null> {
    try {
      const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.id !== "example") {
        return convertFirestoreDoc(
          docSnap as QueryDocumentSnapshot<DocumentData>
        );
      }
      return null;
    } catch (error) {
      console.error("Error fetching collection:", error);
      return null;
    }
  },
};
