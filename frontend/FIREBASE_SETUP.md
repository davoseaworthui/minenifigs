# 🔥 Firebase Setup Guide for Figbit

The current Firebase configuration is not working because the project doesn't exist or isn't properly configured. Follow this guide to set up your own Firebase project.

## 📋 Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `figbit-minifig-builder` (or any name you prefer)
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

### 2. Enable Authentication

1. In your Firebase project, go to **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **"Email/Password"** provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

### 3. Enable Firestore Database

1. Go to **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location (choose closest to your users)
5. Click **"Done"**

### 4. Get Your Firebase Configuration

1. Go to **"Project settings"** (gear icon in left sidebar)
2. Scroll down to **"Your apps"** section
3. Click **"Web"** icon (`</>`)
4. Register your app:
   - App nickname: `Figbit Web App`
   - Check "Also set up Firebase Hosting" (optional)
   - Click **"Register app"**
5. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 5. Update Your Environment Variables

Create or update your `.env.local` file in the `frontend` directory:

```env
# Rebrickable API (already working)
NEXT_PUBLIC_REBRICKABLE_API_KEY=137711e69d67d911ccb3f219f0216a5c

# Firebase Configuration (replace with your values)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Optional: Remove.bg API for better background removal
NEXT_PUBLIC_REMOVE_BG_API_KEY=your_remove_bg_api_key_here
```

### 6. Restart Your Development Server

After updating the environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## 🔧 Alternative: Quick Test Setup

If you want to test the app without authentication features:

1. **Disable Authentication**: Comment out the auth-related code temporarily
2. **Use Local Storage**: The collections will be stored locally in the browser
3. **Skip Firebase**: The app will work without user accounts

To do this, you can modify the `AuthContext.tsx` to return a mock user:

```typescript
// Temporary mock for testing
const mockUser = { email: 'test@example.com', uid: 'test-user' };
return { user: mockUser, loading: false, signIn: async () => {}, signUp: async () => {}, logout: async () => {} };
```

## 🚨 Troubleshooting

### Common Issues:

1. **"CONFIGURATION_NOT_FOUND"**: The Firebase project doesn't exist
   - Solution: Create a new Firebase project following steps above

2. **"API key not valid"**: Wrong API key or project ID
   - Solution: Double-check your Firebase configuration

3. **"Auth domain not authorized"**: Domain not added to authorized domains
   - Solution: In Firebase Console → Authentication → Settings → Authorized domains, add `localhost`

4. **"Project not found"**: Project ID is incorrect
   - Solution: Verify the project ID in Firebase Console

### Testing Your Setup:

1. Try to sign up with a test email
2. Check Firebase Console → Authentication → Users to see if the user was created
3. If successful, try signing in with the same credentials

## 📝 Security Notes

- **Test Mode**: Firestore is in test mode (anyone can read/write)
- **Production**: Before deploying, set up proper Firestore security rules
- **API Keys**: The Firebase API keys are safe to expose in client-side code
- **Environment Variables**: Keep your `.env.local` file in `.gitignore`

## 🎯 Next Steps

Once Firebase is working:
1. Test user registration and login
2. Try saving a minifig collection
3. Check the dashboard to see saved collections
4. Set up proper Firestore security rules for production

---

Need help? Check the [Firebase Documentation](https://firebase.google.com/docs/web/setup) or create an issue in the repository. 