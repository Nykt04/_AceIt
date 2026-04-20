# AceIt – A Progressive Web Application to create study sets, flashcards, and quizzes with **AI-generated questions** (multiple choice and true/false).

## Features

- **Study sets** – Create sets with terms and definitions (Quizlet-style).
- **AI question generation** – Generate multiple choice and true/false questions from a topic using OpenAI.
- **Flashcards** – Flip through terms and AI questions.
- **Quiz mode** – Answer multiple choice and true/false questions and see your score.
- **Persistent storage** – Sets are saved on device with AsyncStorage.

## Setup

1. **Install dependencies**

   ```bash
   cd aceit-app
   npm install
   ```

2. **Assets (optional)**  
   If you see missing asset errors, add images to `./assets/`:
   - `icon.png` (1024×1024)
   - `splash.png`
   - `adaptive-icon.png` (Android)

   Or create an empty `assets` folder and remove the `icon` and `splash` keys from `app.json` to run without custom assets.

3. **OpenAI API key (for AI generation)**  
   Get a key from [OpenAI API keys](https://platform.openai.com/api-keys), then:

   - **Option A:** Create a `.env` file in the project root (if you use `react-native-dotenv` or similar):
     ```
     EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here
     ```
   - **Option B:** Set the variable when starting the app:
     ```bash
     set EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here
     npx expo start
     ```
   - **Option C:** In `app.config.js`, set `openaiApiKey` in `extra` (do not commit the key).

   Without a key, the app still runs; only “AI Generate” will fail until the key is set.

4. **Run the app**

   ```bash
   npx expo start
   ```

   Then press **a** for Android, **i** for iOS, or scan the QR code with Expo Go.

## Project structure

- `App.js` – Root component and stack navigation.
- `src/context/StudyContext.js` – Global state and persistence for study sets.
- `src/services/storageService.js` – AsyncStorage load/save for sets.
- `src/services/aiService.js` – OpenAI integration for question generation.
- `src/screens/` – Home, CreateSet, SetDetail, Study (flashcards + quiz), AIGenerate.

## Tech stack

- **Expo** (SDK 50) + **React Native**
- **React Navigation** (native stack)
- **AsyncStorage** for local storage
- **OpenAI API** (e.g. `gpt-4o-mini`) for AI-generated questions
