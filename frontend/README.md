# 🧱 Figbit - Minifig Builder Web App

A modern web application for building and customizing LEGO minifigs with drag-and-drop functionality. Built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

- **Minifig Discovery**: Search for minifigs or discover random ones
- **Interactive Gallery**: Responsive grid layout with minifig cards
- **Drag & Drop Builder**: Intuitive part selection and building interface
- **Figure Composer**: Advanced composition tool with background removal
- **Background Removal**: Automatic background removal for cleaner part composition
- **Collection Management**: Save and manage custom minifig builds
- **User Authentication**: Firebase Auth with email/password
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Drag & Drop**: @dnd-kit/core
- **API**: Rebrickable API for LEGO data
- **Background Removal**: Canvas API + Remove.bg API support

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Rebrickable API key
- Firebase project
- (Optional) Remove.bg API key for enhanced background removal

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_REBRICKABLE_API_KEY=137711e69d67d911ccb3f219f0216a5c
NEXT_PUBLIC_REMOVE_BG_API_KEY=your_remove_bg_api_key_here
```

### 3. Firebase Setup (Required for Authentication)

⚠️ **Important**: The current Firebase configuration may not work. You need to set up your own Firebase project.

**Option 1: Quick Test (Recommended)**
- The app will automatically use mock authentication if Firebase is not configured
- You can test all features without setting up Firebase
- Collections will be stored in browser's local storage

**Option 2: Full Firebase Setup**
- Follow the detailed guide in `FIREBASE_SETUP.md`
- Create your own Firebase project
- Add your Firebase configuration to `.env.local`

### 4. Get API Keys

#### Rebrickable API Key (Already Provided)
The API key `137711e69d67d911ccb3f219f0216a5c` is already included and working.

#### Remove.bg API Key (Optional)
1. Visit [Remove.bg API](https://www.remove.bg/api)
2. Create an account and get an API key
3. Add the key to your `.env.local` file
4. Without this key, the app will use client-side background removal

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── builder/[minifig_id]/  # Dynamic builder page
│   │   ├── dashboard/          # User collections dashboard
│   │   ├── login/              # Authentication pages
│   │   └── signup/
│   ├── components/             # React components
│   │   ├── Gallery/            # Minifig gallery components
│   │   ├── PartsBuilder/       # Drag & drop builder components
│   │   └── Navigation.tsx      # Main navigation
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/                    # Utility libraries
│   │   ├── firebase.ts         # Firebase configuration
│   │   ├── rebrickable.ts      # Rebrickable API wrapper
│   │   └── backgroundRemoval.ts # Background removal service
│   └── store/                  # State management
│       └── useCollectionStore.ts # Zustand store
```

## 🎯 Key Components

### MinifigGallery
- Displays searchable grid of minifigs
- Supports random minifig discovery
- Responsive design with loading states

### PartsViewer
- Displays all parts for a selected minifig
- Click parts to add them to your custom build
- Figure Composer mode for advanced positioning

### FigureComposer (NEW!)
- Advanced composition tool with background-removed parts
- Layer management and part positioning
- Scale, rotation, and transformation controls
- Export functionality for final compositions
- Toggle between original and processed images

### DragContainer
- Drop zone for selected parts
- Visual feedback during drag operations
- Part removal functionality

### Background Removal Service
- Automatic background removal using Canvas API
- Optional Remove.bg API integration for better results
- Caching system for processed images
- Fallback to original images if processing fails

### Authentication
- Firebase Auth integration
- Protected routes for collections
- User session management

### Cross-Minifig Builder
- Select multiple minifigs from the gallery
- Combine parts from different minifigs
- Click parts to add them to your composition
- Visual source tracking for each part

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌟 Usage

1. **Browse Minifigs**: Use the search or random discovery on the home page
2. **Build Custom Minifig**: Click "Build Now" on any minifig card
3. **Choose Builder Mode**: 
   - **Simple Builder**: Basic drag and drop interface
   - **Figure Composer**: Advanced composition with background removal
4. **Drag & Drop**: Drag parts from the left panel to the builder area
5. **Compose (Advanced)**: 
   - Click parts to select and transform them
   - Use scale, rotation, and layer controls
   - Export your final composition
6. **Save Collection**: Sign in and save your custom builds
7. **Manage Collections**: View and edit saved collections in the dashboard

## 🔑 API Integration

The app integrates with multiple APIs:
- **Rebrickable API**: LEGO minifig and part data
- **Remove.bg API**: Professional background removal (optional)
- **Canvas API**: Client-side image processing and background removal

## 🎨 Design System

- **Primary Color**: Blue/Purple gradients (#3B82F6 to #8B5CF6)
- **Typography**: Geist Sans font family
- **Components**: Consistent spacing, shadows, and rounded corners
- **Responsive**: Mobile-first approach with modern animations

## 🚧 Background Removal Features

### Client-Side Processing
- Uses HTML5 Canvas API for image manipulation
- Removes white/light backgrounds automatically
- No external API calls required
- Works offline

### Remove.bg Integration
- Professional-grade background removal
- Better results for complex images
- Requires API key and internet connection
- Automatic fallback to client-side processing

### Caching System
- Processed images are cached in memory
- Reduces API calls and processing time
- Improves performance for repeated operations

## 🚧 Future Enhancements

- Advanced background removal algorithms
- Part categorization and sorting
- Social sharing of collections
- Collaborative building features
- 3D visualization
- Unit testing with React Testing Library

## 📝 License

This project is for educational purposes. LEGO® is a trademark of the LEGO Group.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ using Next.js, Canvas API, and the Rebrickable API

## 🔥 Firebase Authentication Status

The app includes **automatic fallback authentication** that works as follows:

1. **Firebase Available**: Uses Firebase Auth for real user accounts
2. **Firebase Not Available**: Automatically switches to mock authentication
3. **Demo Mode**: Shows a yellow banner indicating local storage is being used

### Mock Authentication Features:
- ✅ Sign up and sign in with any email/password
- ✅ User sessions persist in browser
- ✅ Collection saving works (stored locally)
- ✅ Dashboard shows saved collections
- ⚠️ Data is only stored locally (not synced across devices)

### To Enable Real Firebase:
See `FIREBASE_SETUP.md` for complete setup instructions.
