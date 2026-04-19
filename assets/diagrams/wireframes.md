# AceIt — Wireframes (Level 1)

Wireframes for the AceIt study-buddy app. Screens use a dark theme (e.g. `#0f172a` background, `#6366f1` accent).

---

## Global elements

### Navbar (top bar)
Used on: Home, Create Set, Set Detail (some), AI Generate, File Upload, Quiz Settings, Study, Settings, Login/Signup.

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
```

- Left: hamburger (≡) opens Sidebar.
- Center: logo “AceIt”.
- Right: Settings, Login.

### Sidebar (slide-over from left)
Opened by navbar [≡]. Overlay + panel ~45% width.

```
+------------------------+
| AceIt              [✕] |
|------------------------|
| NAVIGATION             |
|   🏠 Home               |
|   ✨ AI Generate        |
|   📄 Upload File        |
|   ➕ Create Set         |
|   ℹ️ About              |
|------------------------|
| ACCOUNT                |
|   ⚙️ Settings           |
|   👤 Login / Signup     |
|------------------------|
| Version 1.0.0          |
| © 2026 AceIt           |
+------------------------+
```

---

## 1. Home

- Navbar + Sidebar.
- Section title: “Your sets”.
- List of set cards (scrollable). Each card: title, optional description, “X terms · Y quiz questions”, tap → Set Detail; optional delete (trash) with confirm.
- Empty state: “No study sets yet” + “Create one or generate with AI”.
- Bottom FABs: [✨ AI Generate] [➕ New Set].

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
| Your sets                                                         |
|                                                                    |
| +------------------------------------------+  [🗑]                 |
| | Set title                                |                       |
| | Short description...                     |                       |
| | 12 terms · 5 quiz questions             |                       |
| +------------------------------------------+                       |
| +------------------------------------------+  [🗑]                 |
| | Another set                              |                       |
| | 8 terms · 0 quiz questions               |                       |
| +------------------------------------------+                       |
|                                                                    |
|                    (or empty: No study sets yet                    |
|                     Create one or generate with AI)                |
|                                                                    |
+------------------------------------------------------------------+
|                    [✨ AI Generate]  [➕ New Set]                   |
+------------------------------------------------------------------+
```

---

## 2. Create Set / Edit Set

- Navbar + Sidebar.
- Title input, Description input (optional).
- List of term rows: [Term] [Definition] [−]. Button [➕ Add term].
- Bottom: [Save] (or “Update” when editing).

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
| Set title                                                          |
| [________________________]                                         |
| Description (optional)                                             |
| [________________________]                                         |
|                                                                    |
| Term 1                                                             |
| [Term________] [Definition________________] [−]                    |
| Term 2                                                             |
| [Term________] [Definition________________] [−]                    |
|                                                                    |
| [➕ Add term]                                                      |
|                                                                    |
| [         Save         ]  (or Update when editing)                 |
+------------------------------------------------------------------+
```

---

## 3. Set Detail

- Header: [← Back] right-aligned [Edit].
- Title, optional description, “X terms & questions”.
- If has content: two mode cards — [Flashcards] (Flip through terms), [Quiz] (Multiple choice & True/False).
- If empty: “No terms or questions yet”, hint, [Generate with AI].
- Bottom: [Delete set] (destructive, with confirm).

```
+------------------------------------------------------------------+
| [← Back]                                              [Edit]      |
+------------------------------------------------------------------+
| Set title                                                          |
| Optional description text.                                         |
| 12 terms & questions                                               |
|                                                                    |
| +---------------------------+  +---------------------------+      |
| | 📇 Flashcards             |  | 📝 Quiz                   |      |
| | Flip through terms        |  | Multiple choice & T/F     |      |
| +---------------------------+  +---------------------------+      |
|                                                                    |
| (or empty state:)                                                   |
|   No terms or questions yet                                        |
|   Edit to add terms, or use AI to generate questions               |
|   [ Generate with AI ]                                             |
|                                                                    |
| [ Delete set ]                                                     |
+------------------------------------------------------------------+
```

---

## 4. AI Generate

- Navbar + Sidebar.
- Title: “AI Generate” (or similar).
- Input: topic/prompt (e.g. prefilled if existing set).
- Question count: selectable chips (e.g. 5, 10, 15, 20).
- Toggles: Multiple choice, True/False (at least one on).
- [✨ Generate] button; loading state.
- Error text if validation/API fails.

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
| AI Generate                                                        |
| Enter topic or paste content                                       |
| [________________________________________________]                 |
|                                                                    |
| Number of questions                                                |
| [ 5 ]  [ 10 ]  [ 15 ]  [ 20 ]                                     |
|                                                                    |
| Multiple choice    [====●]  ON                                      |
| True / False       [====●]  ON                                      |
|                                                                    |
| [        ✨ Generate        ]                                      |
| (or loading spinner)                                               |
+------------------------------------------------------------------+
```

---

## 5. File Upload / Generate from text (FileUploadQuestions)

- Navbar + Sidebar.
- “Generate from File” / “Paste study material to create questions”.
- Optional: Set title (when creating new set).
- Study material: large text area (paste or type).
- Number of questions: input + hint (e.g. Min 1, Max 100).
- Optional “How it works” info box.
- [✨ Generate Questions] (loading state when generating).

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
| Generate from File                                                 |
| Paste study material to create questions                           |
|                                                                    |
| Set title                                                          |
| [________________________]                                         |
|                                                                    |
| Study Material                                                     |
| +------------------------------------------+                       |
| | Paste or type your notes here…          |                       |
| |                                          |                       |
| +------------------------------------------+                       |
|                                                                    |
| Number of Questions                                                |
| [ 5 ]   Min: 1 | Max: 100                                          |
|                                                                    |
| 📋 How it works: …                                                 |
|                                                                    |
| [     ✨ Generate Questions     ]                                  |
+------------------------------------------------------------------+
```

---

## 6. Quiz Settings

- Navbar + Sidebar.
- [← Back], title “Quiz Settings”.
- Info: set name, max questions.
- Number of questions: input/slider (1 to max).
- Switches: Shuffle questions, Show answers after, Timed mode (e.g. time per question).
- [Start Quiz] (navigates to Study in quiz mode).

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
| [← Back]         Quiz Settings                                     |
|                                                                    |
| Set: My Set                                                        |
| Up to N questions available                                        |
|                                                                    |
| Number of questions    [ 5 ]                                        |
| Shuffle questions      [====●]  ON                                  |
| Show answers after     [====●]  OFF                                 |
| Timed mode             [○====]  OFF                                |
| Time per question (s)  [ 30 ]   (if timed)                         |
|                                                                    |
| [       Start Quiz       ]                                         |
+------------------------------------------------------------------+
```

---

## 7. Study (Flashcards)

- Navbar + Sidebar.
- One card at a time: front (term/question) — tap to flip to back (definition/answer).
- [← Prev] [Next →] or swipe.
- Progress: e.g. “3 / 12”.
- Option to exit/back.

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
|                          3 / 12                                   |
|                                                                    |
| +------------------------------------------+                       |
| |                                          |                       |
| |           Term or question text           |                       |
| |              (front of card)              |                       |
| |                                          |                       |
| |              (tap to flip)               |                       |
| +------------------------------------------+                       |
|                                                                    |
| [← Prev]                                    [Next →]              |
+------------------------------------------------------------------+
```

---

## 8. Study (Quiz mode)

- One question at a time.
- Question text.
- Options: list of choices (A/B/C/D) or True/False; one selectable.
- [Next] / [Submit]; last question may show [See results] or [Finish].
- Optional: timer, score, “X of Y” progress.

```
+------------------------------------------------------------------+
|                         Quiz  2 / 5                               |
|                                                                    |
| Question text here?                                                |
|                                                                    |
| ( ) Option A                                                       |
| (●) Option B   ← selected                                         |
| ( ) Option C                                                       |
| ( ) Option D                                                       |
|                                                                    |
| (Optional: Timer 0:25)                                             |
|                                                                    |
| [           Next           ]                                       |
+------------------------------------------------------------------+
```

---

## 9. About

- No Navbar/Sidebar (standalone).
- Title: “About AceIt”.
- Sections: What is AceIt?, Features (bullets), Get Started, Version 1.0.0.
- [Go to Home →].

```
+------------------------------------------------------------------+
|                        About AceIt                                 |
|                                                                    |
| What is AceIt?                                                     |
| AceIt is a powerful study companion…                               |
|                                                                    |
| Features                                                           |
| • AI-powered flashcard generation                                  |
| • Create custom study sets                                         |
| • Interactive study mode                                           |
| • Local data storage                                               |
|                                                                    |
| Get Started                                                        |
| Start by creating a new study set…                                 |
|                                                                    |
| Version 1.0.0                                                     |
|                                                                    |
| [        Go to Home →        ]                                    |
+------------------------------------------------------------------+
```

---

## 10. Settings

- Navbar + Sidebar.
- Title: “Settings”.
- Rows: Notifications (toggle), Dark mode (toggle), Offline mode (toggle), Auto-save (toggle), etc.
- [Logout] (with confirm).

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
| Settings                                                            |
|                                                                    |
| 🔔 Notifications         [====●]  ON                               |
| 🌙 Dark mode             [====●]  ON                               |
| 📴 Offline mode          [○====]  OFF                              |
| 💾 Auto-save             [====●]  ON                               |
|                                                                    |
| [ Logout ]                                                         |
+------------------------------------------------------------------+
```

---

## 11. Login / Signup

- Navbar + Sidebar.
- Tabs or toggle: “Login” | “Sign up”.
- Fields: Email, Password; if Sign up: Name, Confirm password.
- [Login] or [Create account].
- Optional: “Already have an account?” / “Don’t have an account?”.

```
+------------------------------------------------------------------+
| [≡]        AceIt                    [⚙ Settings]  [👤 Login]       |
+------------------------------------------------------------------+
|                    [ Login ]  [ Sign up ]                           |
|                                                                    |
| Email                                                              |
| [________________________]                                         |
| Password                                                            |
| [________________________]                                         |
| (Sign up only:)                                                     |
| Name     [________________________]                                 |
| Confirm  [________________________]                                 |
|                                                                    |
| [      Login      ]  or  [   Create account   ]                     |
+------------------------------------------------------------------+
```

---

## Navigation summary

| From        | To                    | Trigger / Note                    |
|------------|------------------------|-----------------------------------|
| Home       | Set Detail             | Tap set card                      |
| Home       | Create Set             | FAB “New Set”                     |
| Home       | AI Generate            | FAB “AI Generate”                 |
| Home       | Sidebar                | Navbar [≡]                        |
| Sidebar    | Home, AI Generate, Upload File, Create Set, About, Settings, Login | Menu items |
| Set Detail | Create Set (edit)      | [Edit]                            |
| Set Detail | Study (flashcards/quiz)| [Flashcards] / [Quiz]             |
| Set Detail | Quiz Settings          | [Quiz] (if quiz flow goes via Quiz Settings) |
| Set Detail | AI Generate            | [Generate with AI] (empty set)    |
| Set Detail | Back                   | [← Back]                          |
| Create Set | Set Detail / Back      | [Save] / [Update]                 |
| AI Generate| Set Detail / Home      | After generate                    |
| File Upload| Set Detail             | After generate                    |
| Quiz Settings | Study (quiz)         | [Start Quiz]                      |
| Study      | Back / Set Detail      | Exit                              |
| About      | Home                   | [Go to Home]                      |

---

*Wireframes for AceIt study-buddy app. Layouts are indicative; exact spacing and styling follow the app implementation.*
