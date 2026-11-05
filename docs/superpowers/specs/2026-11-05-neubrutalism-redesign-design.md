# AceIt Neubrutalism Redesign — Design Document

**Date:** 2026-11-05  
**Topic:** Neubrutalism Aesthetic Redesign for AceIt Web & Mobile  
**Status:** In Review (Brainstorming Phase)  
**Author:** Pair Programming Agent & User

---

## 1. Intent and The Why

The AceIt study application currently employs a conventional slate/indigo theme with rounded corners and soft drop shadows. While functional, it blends into generic "AI SaaS" templates. 

This project redesigns AceIt with an unapologetic, high-contrast **Neubrutalism** aesthetic. Neubrutalism leverages thick geometric borders, unblurred offset drop shadows, an editorial color palette, tactile physical-press animations, and crisp vector iconography. The goal is to make the study experience punchy, memorable, and visually distinct while maintaining high legibility and usability across web and mobile.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals (Phase 1 Scope Confirmed)
- **Phase 1 Delivery Scope**:
  1. Foundational Neubrutalist Design Tokens (`src/theme/tokens.js`) & backward-compatible `ThemeContext.js`.
  2. Core Neubrutalist UI Primitives (`BrutalCard`, `BrutalButton`, `BrutalSkeleton`, `BrutalBadge`, `BrutalInput`).
  3. Navigation Shell: `Navbar.js` & `Sidebar.js`.
  4. Core Study Loop: `HomeScreen.js`, `SetDetailScreen.js`, and `StudyScreen.js`.
- **Strict Neubrutalism Aesthetic**: 3px–4px solid black/white borders, 0px–4px sharp corner radii, and stark unblurred offset shadows (`4px 4px 0 #000` or `#FFF`).
- **Editorial Color Palette**:
  - *Light Mode*: Warm Cream (`#FFFDF5`), Pitch Black text/borders (`#121212`), stark white card surfaces (`#FFFFFF`).
  - *Dark Mode*: Deep Pitch Black (`#121212`), Stark White text/borders (`#FFFFFF`), dark charcoal card surfaces (`#1E1E1E`).
  - *Accents*: Electric Cobalt (`#2563EB`), Safety Orange (`#FF5722`), Cyber Yellow (`#FFDE59`), Punchy Lime (`#10B981`).
- **Seamless Theming**: Full Light/Dark mode parity preserved in `src/context/ThemeContext.js`.
- **Iconography**: Crisp vector icons via `@expo/vector-icons` (Feather/Ionicons/MaterialCommunityIcons). **Strictly zero emojis** in UI chrome.
- **Loading States**: Replace standard circular spinners with geometric, thick-bordered skeleton cards.
- **Motion & Micro-interactions**:
  - Entry animations: Snappy spring block-drop / slide-up physics.
  - Interactive tactile press: Buttons and interactive cards physically translate `(2px, 2px)` down and right on press to merge into their offset shadow.
- **Mobile & Web Responsive**: Full responsiveness across mobile viewports (minimum 48px touch targets, non-overflowing brutalist cards) and desktop wide screens.

### Non-Goals
- Modifying backend Supabase schema, authentication business logic, file parsing services, or document export routines.
- Rewriting the navigation routing structure (React Navigation stacks remain intact).

### Anti-Goals (What We Explicitly Avoid)
- No "AI Slop": No soft purple/cyan neon glows, no gaussian blur shadows, no pastel gradient blobs.
- No emojis as navigation or status icons.

---

## 3. Constraints

- **Platform**: React Native Web (`react-native`, `react-native-web`, Expo SDK 56).
- **Cross-Platform Shadow Compatibility**: Standard CSS `boxShadow: '4px 4px 0px #000'` functions cleanly on React Native Web. For mobile native fallback, we use an offset under-layer or platform-aware style wrapper so web retains crisp hard shadows while mobile native does not crash.
- **Package Integrity**: Do not add unnecessary large dependencies; use installed `@expo/vector-icons`, standard React Native `Animated`, and existing React Context.

---

## 4. Approaches Considered

1. **Option 1: Complete Web Rewrite in Next.js / Tailwind (Rejected)**
   - *Pros*: Trivial CSS box-shadow and Tailwind utility setup.
   - *Cons*: Throws away existing Expo / React Native codebase, breaks mobile iOS/Android apps, duplicates logic, high effort and code churn.
   - *Verdict*: Rejected.

2. **Option 2 (Selected): In-place React Native / Expo Web Neubrutalist Primitives**
   - *Pros*: Reusable design system primitives (`BrutalCard`, `BrutalButton`, `BrutalSkeleton`, `BrutalBadge`, `BrutalInput`) that drop directly into existing screens. Preserves all Supabase state, screen hooks, navigation, and mobile compatibility. Minimal code churn, highest maintainability.
   - *Cons*: Requires careful platform styling for hard shadows across web and native.
   - *Verdict*: Chosen by user.

---

## 5. Architectural Design & Component Specs

### 5.1 Design Tokens (`src/theme/tokens.js`)
```javascript
export const BRUTAL_TOKENS = {
  borderWidth: 3,
  borderRadius: 4, // slight 4px softening or 0px sharp
  shadowOffset: 4,
  colors: {
    light: {
      background: '#FFFDF5', // Warm Cream
      card: '#FFFFFF',
      text: '#121212',
      border: '#121212',
      shadow: '#121212',
      primary: '#2563EB', // Electric Cobalt
      secondary: '#FF5722', // Safety Orange
      accent: '#FFDE59', // Cyber Yellow
      success: '#10B981',
      error: '#EF4444',
      muted: '#E5E5E0',
    },
    dark: {
      background: '#121212', // Pitch Black
      card: '#1E1E1E',
      text: '#FFFFFF',
      border: '#FFFFFF',
      shadow: '#FFFFFF', // High-contrast stark white offset shadow
      primary: '#3B82F6',
      secondary: '#FF7043',
      accent: '#FACC15',
      success: '#34D399',
      error: '#F87171',
      muted: '#2A2A2A',
    }
  }
};
```

### 5.1.1 Backward-Compatible ThemeContext Adapter (Builder's Call)
To eliminate regressions across unmigrated screens, `src/context/ThemeContext.js` provides an aliasing adapter:
- Legacy keys (`primaryAccent`, `secondary`, `tertiary`, `textSecondary`, `border`) are preserved with sensible surface mappings.
- New Neubrutalist keys (`card`, `shadow`, `brandSecondary`, `accent`) are exposed to new brutal primitives.
- Existing screens keep functioning without visual breakage.

### 5.2 Primitive Components (`src/components/brutal/`)
- **`BrutalCard`**:
  - Props: `children`, `style`, `accentColor`, `headerTitle`, `shadowOffset`.
  - Features: 3px solid border, hard unblurred offset shadow, optional vibrant accent title bar.
- **`BrutalButton`**:
  - Props: `title`, `onPress`, `variant` (`primary`, `secondary`, `outline`), `icon`, `disabled`.
  - Motion: Animated translation on press (`translateX: 2, translateY: 2`) with corresponding shadow reduction for physical "click" feel.
- **`BrutalSkeleton`**:
  - Props: `width`, `height`, `style`.
  - Features: Geometric box with thick border, alternating tone pulse without blurred gradients.
- **`BrutalBadge`**:
  - Props: `label`, `color`.
  - Features: High-saturation pill/rectangle with black border and uppercase bold type.

### 5.3 Screens & Shell Overhaul
1. **`Navbar.js` & `Sidebar.js`**:
   - 3px solid border bottom / right.
   - Vector menu icon (replacing `Text ≣`).
   - Brutalist theme switcher and navigation links.
2. **`HomeScreen.js`**:
   - Hero banner with bold brutalist typography and safety orange / cobalt accents.
   - Study set cards as brutalist blocks with hard shadows.
   - Structured skeleton loading deck while fetching study sets from Supabase.
3. **`StudyScreen.js` & `SetDetailScreen.js`**:
   - Flashcard styled as a thick-bordered physical index card.
   - Tactile Flip and Rate buttons.

---

## 6. What Is Left to the Builder

- Exact animation spring friction/tension constants (`tension: 120, friction: 8`).
- Responsive breakpoint thresholds (`width < 768px` for single-column card stacking).
- Progressive screen rollout order.
