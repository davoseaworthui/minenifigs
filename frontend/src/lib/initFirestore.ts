import { db } from "./firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export const initializeFirestore = async () => {
  try {
    // Create collections collection if it doesn't exist
    const collectionsRef = collection(db, "collections");

    // Create an example collection to prevent timeout errors
    await setDoc(doc(collectionsRef, "example"), {
      id: "example",
      title: "Example Collection",
      sourceMinifigs: [],
      parts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "system",
    });

    console.log("Firestore initialized successfully");
  } catch (error) {
    console.error("Error initializing Firestore:", error);
  }
};
