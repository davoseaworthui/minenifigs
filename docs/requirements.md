# 🧱 Minifig Builder Web App – Prompt for Cursor

## ✨ Overview
Build a **Minifig Builder Web App** using Next.js and Tailwind CSS, backed by the [Rebrickable API](https://rebrickable.com/api/). The app allows users to:

- Search or randomize LEGO minifigs
- View relevant minifigs in a gallery-style layout
- Select a minifig to view all its associated parts
- Drag-and-drop parts into a custom container
- See the list of selected part names
- Save and manage collections after signing in
- View/edit saved collections on a personal dashboard

---

## 🧩 Feature Breakdown

### 🔍 Minifig Discovery
- Search for minifigs by name or use a "Random Minifig" feature
- Use the **Rebrickable API** to fetch available minifigs:
  - GET `/minifigs/`
  - GET `/minifigs/{minifig_id}/parts/`
  - apiKey is 137711e69d67d911ccb3f219f0216a5c

### 🖼️ Minifig Gallery
- Display minifigs in a responsive gallery using Tailwind CSS grid
- Each card shows:
  - Minifig image
  - Name
  - “View Parts” button

### 🧠 Parts Viewer & Drag Builder
- On minifig select, show parts from `/minifigs/{minifig_id}/parts/`
- Process part images to remove backgrounds, find tools necessary to implement a figure composer style of interaction
- the ultimate goal is try to combine minifig parts with other parts that is the reason that there is a same page selector for the gallery, where the parts will be shown below the gallery, allowing the user to somehow combine minifig parts from different minifigs
- Implement **drag-and-drop UI** to let users add parts to a container
- Show part names of selected items in a list view

### 💾 Saving Collection
- Enable users to:
  - Sign up/log in via email/password
  - Save their custom part combinations
  - Name their collection
- Authenticated users can view a **dashboard**:
  - List of saved collections
  - Edit/delete existing builds

---

## ⚙️ Tech Stack

### 🚀 Frontend
- `Next.js` – app framework
- `Tailwind CSS` – styling
- `Zustand` – optional state management

### 🔐 Authentication
- Use [**Firebase Auth**](https://firebase.google.com/products/auth) for:
  - Email/password signup
  - Easy integration with Firebase Realtime DB or Firestore
  - firebase config
        // Import the functions you need from the SDKs you need
        import { initializeApp } from "firebase/app";
        // TODO: Add SDKs for Firebase products that you want to use
        // https://firebase.google.com/docs/web/setup#available-libraries

        // Your web app's Firebase configuration
        const firebaseConfig = {
        apiKey: "AIzaSyB0gjkMZCDTQSPvnQ1lMSg57lRf_83w6T8",
        authDomain: "figbit-6ae24.firebaseapp.com",
        projectId: "figbit-6ae24",
        storageBucket: "figbit-6ae24.firebasestorage.app",
        messagingSenderId: "382925282367",
        appId: "1:382925282367:web:ad336073432cca3e176c8a"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

### 🗃️ Storage
- [**Firebase Firestore**] for structured data:
  - Users
  - Collections
  - Part selections

### 🧲 Drag and Drop Library
- Use [`@dnd-kit/core`](https://dndkit.com/) – high flexibility & animation support
  - Supports dragging images onto containers
  - Can track part metadata

### 🧼 Background Removal (for Part Images)
- Use [**Remove.bg API**](https://www.remove.bg/api) or similar to process part images
- Optionally cache processed images for performance


### Testing

 - Implement unit testing using React Testing Library (https://testing-library.com/docs/react-testing-library/intro/)
---

## 🧪 Possible Folder Structure

/components
/Gallery
/MinifigCard
/PartsBuilder
/PartCard
/DragContainer
/Auth
/pages
/index.tsx
/builder/[minifig_id].tsx
/dashboard.tsx
/login.tsx
/signup.tsx
/lib
/firebase.ts
/rebrickable.ts
/store
/useCollectionStore.ts

yaml
Copy
Edit

---

## 🔧 Setup Tasks for Cursor

1. Scaffold a Next.js project with Tailwind
2. Add Firebase Auth + Firestore integration
3. Create components:
   - `MinifigGallery`
   - `PartsViewer` with drag and drop
   - `DragContainer`
   - `SelectedPartsList`
4. Implement Rebrickable API wrapper in `lib/rebrickable.ts`
5. Add Firebase logic in `lib/firebase.ts`
6. Style with Tailwind and keep it mobile responsive
7. Process part images using Remove.bg (via server function or manually uploaded versions)

---

## 🧠 Extra Notes for Cursor
- Assume `minifig_id` is coming from Rebrickable
- Use Rebrickable's `part_img_url` field for part images
- Wrap user collections with a `userId` field for ownership
- Each saved collection stores:
  - Title
  - Timestamp
  - Minifig name
  - Part IDs and image URLs

---

**Let me know if you need specific files scaffolded!**