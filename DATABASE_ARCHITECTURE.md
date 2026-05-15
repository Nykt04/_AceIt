# Study Buddy - Database Architecture

## Overview
Study Buddy uses **Supabase (PostgreSQL)** with **Row Level Security (RLS)** for authentication and data isolation. The database has a simplified structure with 2 main tables.

---

## ERD (Entity Relationship Diagram)

```
┌─────────────────────┐
│   auth.users        │
│  (Supabase Auth)    │
├─────────────────────┤
│ id (UUID) PK        │
│ email               │
│ password_hash       │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │ 1 to Many
           │
           ▼
┌─────────────────────────────┐
│    public.users             │
│  (User Profiles)            │
├─────────────────────────────┤
│ id (UUID) PK, FK            │ ◄─── References auth.users
│ email                       │
│ full_name                   │
│ created_at                  │
│ updated_at                  │
└──────────┬──────────────────┘
           │ 1 to Many
           │
           ▼
┌──────────────────────────────────────────────────┐
│         public.study_sets                        │
│  (Study Sets / Question Collections)             │
├──────────────────────────────────────────────────┤
│ id (TEXT) PK                                     │
│ user_id (UUID) FK ──────────────────────┐       │
│ title (TEXT) - Set name                 │       │
│ description (TEXT) - Optional desc      │       │
│ terms (JSONB) - Array of term objects   │       │
│ questions (JSONB) - Array of questions  │       │
│ created_at (TIMESTAMP)                  │       │
│ updated_at (TIMESTAMP)                  │       │
└──────────────────────────────────────────────────┘
```

### Mermaid ERD Code

```mermaid
erDiagram
    AUTH_USERS ||--o{ PUBLIC_USERS : "1:1"
    PUBLIC_USERS ||--o{ STUDY_SETS : "1:N"
    
    AUTH_USERS {
        string id PK
        string email
        string password_hash
        timestamp created_at
        timestamp updated_at
    }
    
    PUBLIC_USERS {
        string id PK,FK
        string email
        string full_name
        timestamp created_at
        timestamp updated_at
    }
    
    STUDY_SETS {
        string id PK
        string user_id FK
        string title
        string description
        jsonb terms
        jsonb questions
        timestamp created_at
        timestamp updated_at
    }
```

---

## Additional Mermaid Diagrams

### Table Relationships Graph

```mermaid
graph TD
    A["<b>auth.users</b><br/>id UUID<br/>email<br/>password_hash"] -->|1:1| B["<b>public.users</b><br/>id UUID<br/>email<br/>full_name"]
    B -->|1:N| C["<b>study_sets</b><br/>id TEXT<br/>user_id<br/>title<br/>terms JSON<br/>questions JSON"]
    
    A -->|CASCADE DELETE| B
    B -->|CASCADE DELETE| C
    
    style A fill:#ffebee,stroke:#c62828,color:#fff
    style B fill:#e3f2fd,stroke:#1565c0,color:#fff
    style C fill:#f3e5f5,stroke:#6a1b9a,color:#fff
```

### User Registration Sequence

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Supabase
    participant Trigger
    
    User->>App: Enter Email & Password
    App->>Supabase: Sign Up
    Supabase->>Supabase: Create auth.users
    Trigger->>Trigger: handle_new_user()
    Trigger->>Supabase: INSERT public.users
    Supabase-->>App: Success
    App-->>User: Account Created
```

### Study Set Creation Sequence

```mermaid
sequenceDiagram
    participant User
    participant App
    participant AI
    participant Supabase
    
    User->>App: Upload File / Paste Text
    App->>App: Extract Text
    App->>AI: Generate Questions
    AI-->>App: Return Questions
    App->>Supabase: INSERT study_sets
    Supabase->>Supabase: RLS Check
    Supabase-->>App: Success
    App-->>User: Study Set Created
```

### Data Access Control via RLS

```mermaid
graph TD
    A["User A Login"] -->|uid: 123| B["SELECT study_sets"]
    B -->|RLS Applied| C{"user_id = auth.uid()"}
    C -->|✓ Match| D["User A Sets"]
    
    E["User B Login"] -->|uid: 456| F["SELECT study_sets"]
    F -->|RLS Applied| G{"user_id = auth.uid()"}
    G -->|✓ Match| H["User B Sets"]
    
    D -.->|Isolated| H
    
    style A fill:#e3f2fd
    style E fill:#f3e5f5
    style D fill:#e8f5e9
    style H fill:#e8f5e9
```

---

## Table Structure

### 1. **auth.users** (Supabase Auth - Auto-managed)
Managed by Supabase authentication system. Stores authentication credentials.

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

### 2. **public.users** (User Profiles)
Extends auth.users with additional profile information.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Purpose:**
- Store user profile information
- One record per authenticated user
- Automatically created via trigger when user signs up

**Relationships:**
- `id` → FK to `auth.users(id)` (cascade delete)

---

### 3. **public.study_sets** (Study Materials)
Stores all study sets (collections of questions/terms) for each user.

```sql
CREATE TABLE study_sets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  terms JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_study_sets_user_id ON study_sets(user_id);
```

**Columns:**
- `id` - Unique identifier (UUID v4 as string)
- `user_id` - FK to user who owns this set
- `title` - Set name (e.g., "Biology Chapter 5")
- `description` - Optional description
- `terms` - JSON array of flashcard terms
- `questions` - JSON array of quiz questions
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last modification

**Relationships:**
- `user_id` → FK to `public.users(id)` (cascade delete)

---

## JSON Structure Examples

### Study Set Record
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Spanish Vocabulary",
  "description": "Common Spanish words for beginners",
  "terms": [
    {
      "id": "term-1",
      "term": "Hola",
      "definition": "Hello"
    },
    {
      "id": "term-2",
      "term": "Adiós",
      "definition": "Goodbye"
    }
  ],
  "questions": [
    {
      "id": "q-1",
      "type": "multiple_choice",
      "question": "What does 'Hola' mean?",
      "options": ["Hello", "Goodbye", "Thank you", "Please"],
      "correctIndex": 0
    },
    {
      "id": "q-2",
      "type": "true_false",
      "question": "Adiós means Hello",
      "correctAnswer": false
    }
  ],
  "created_at": "2024-05-13T10:30:00Z",
  "updated_at": "2024-05-13T15:45:00Z"
}
```

---

## Row Level Security (RLS)

### Policies Overview

**users table:**
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

**study_sets table:**
```sql
-- Users can only view their own study sets
CREATE POLICY "Users can view their own study sets"
  ON public.study_sets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create sets for themselves
CREATE POLICY "Users can create study sets"
  ON public.study_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own study sets
CREATE POLICY "Users can update their own study sets"
  ON public.study_sets FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own study sets
CREATE POLICY "Users can delete their own study sets"
  ON public.study_sets FOR DELETE
  USING (auth.uid() = user_id);
```

**Security Guarantee:** Users can NEVER access or modify other users' data, even with crafted API calls.

---

## Data Flow

### User Registration Flow

```mermaid
flowchart TD
    A[User Signup] -->|Email & Password| B[auth.users INSERT]
    B -->|Trigger Activated| C["handle_new_user()"]
    C -->|Create Profile| D[public.users INSERT]
    D -->|Success| E["User Profile Created"]
    E -->|Now Can| F["Create Study Sets"]
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#fff3e0
    style E fill:#e8f5e9
    style F fill:#e8f5e9
```

### Create Study Set Flow

```mermaid
flowchart TD
    A["User Uploads File"] -->|Extract Text| B["AI Generates Questions"]
    B -->|Create Set| C["study_sets INSERT"]
    C -->|Set user_id| D["User Isolation via RLS"]
    D -->|Success| E["Study Set Saved"]
    E -->|Only User Can| F["View/Edit Set"]
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#ffebee
    style E fill:#e8f5e9
    style F fill:#e8f5e9
```

### Retrieve Study Sets Flow

```mermaid
flowchart TD
    A[User Logs In] -->|Get Session| B["Get auth.uid()"]
    B -->|Query| C["SELECT study_sets WHERE user_id = ?"]
    C -->|RLS Enforced| D["Only Own Sets Returned"]
    D -->|Display| E["User Study Sets"]
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#ffebee
    style E fill:#e8f5e9
```

---

## Indexes

```sql
-- Fast lookups of all sets for a user
CREATE INDEX idx_study_sets_user_id ON study_sets(user_id);
```

**Purpose:** When user logs in, we quickly find all their study sets without full table scan.

---

## Storage Strategy

### Local Storage (React Native)
- Uses `AsyncStorage` for offline-first capability
- Study sets cached locally
- Syncs to Supabase when online

### Cloud Storage (Supabase)
- Single source of truth
- Real-time sync across devices
- Automatic backups

---

## Scalability Considerations

1. **JSONB for Flexibility**
   - Terms and questions stored as JSON arrays
   - Easy to add new question types without schema migration
   - Allows dynamic content structure

2. **User Isolation via RLS**
   - Each user is completely isolated
   - Can safely add more users without performance impact
   - No application-level checks needed

3. **Indexing Strategy**
   - Indexed on `user_id` for fast queries
   - No need for study set ID index (PK already indexed)

---

## Summary

| Component | Purpose | Type |
|-----------|---------|------|
| auth.users | Authentication | Supabase managed |
| public.users | User profiles | Main table |
| study_sets | Study materials | Main table |
| RLS Policies | Data isolation | Security |
| JSONB columns | Flexible content | Data storage |

**Total Tables:** 2 main tables (auth.users is managed by Supabase)  
**Total Indexes:** 1 (user_id on study_sets)  
**Security Model:** Row Level Security (RLS) with user isolation  
**Scalability:** Supports unlimited users, each with unlimited study sets

---

## Complete Mermaid Diagram Reference

### Study Set Structure Diagram

```mermaid
graph TD
    A["<b>Study Set Record</b>"] --> B["Basic Info"]
    A --> C["Terms Array JSONB"]
    A --> D["Questions Array JSONB"]
    
    B --> B1["id: TEXT UUID"]
    B --> B2["user_id: UUID"]
    B --> B3["title: STRING"]
    B --> B4["description: STRING"]
    B --> B5["created_at, updated_at"]
    
    C --> C1["Term 1"]
    C --> C2["Term 2"]
    C --> C3["Term N..."]
    
    C1 --> C1A["term: String"]
    C1 --> C1B["definition: String"]
    
    D --> D1["Question 1"]
    D --> D2["Question 2"]
    D --> D3["Question N..."]
    
    D1 --> D1A["type: multiple_choice"]
    D1 --> D1B["question: String"]
    D1 --> D1C["options: Array"]
    D1 --> D1D["correctIndex: Number"]
    
    style A fill:#fff3e0,stroke:#e65100
    style B fill:#e3f2fd,stroke:#01579b
    style C fill:#f3e5f5,stroke:#4a148c
    style D fill:#fce4ec,stroke:#880e4f
```

### Complete Database Flow

```mermaid
graph LR
    A["User Authentication<br/>auth.users"] --> B["User Profile<br/>public.users"]
    B --> C["Study Sets<br/>study_sets"]
    
    B --> D["RLS Policy<br/>User Isolation"]
    C --> D
    
    D --> E["Only User Can<br/>View Own Data"]
    
    style A fill:#ffebee
    style B fill:#e3f2fd
    style C fill:#f3e5f5
    style D fill:#fff3e0
    style E fill:#e8f5e9
```

### API Operation Flow

```mermaid
graph TD
    A["Client Request"] -->|Include user_id| B["API Receives Request"]
    B -->|Check JWT| C["Get auth.uid()"]
    C -->|Query with RLS| D["SQL Query<br/>WHERE user_id = ?"]
    D -->|RLS Enforces| E{"Does user_id Match<br/>auth.uid()?"}
    E -->|YES| F["Return Data"]
    E -->|NO| G["Return Error 403"]
    
    F --> H["Client Gets Data"]
    G --> I["Client Access Denied"]
    
    style A fill:#e3f2fd
    style B fill:#e3f2fd
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#ffebee
    style F fill:#e8f5e9
    style G fill:#ffcdd2
```

### Index Strategy

```mermaid
graph TD
    A["Query Pattern"] -->|Frequent| B["Find all sets for user"]
    
    B -->|Without Index| C["Full Table Scan<br/>Slow ❌"]
    B -->|With Index| D["B-Tree Lookup<br/>Fast ✓"]
    
    A2["Data Size"] -->|Small| E["100 sets<br/>No problem"]
    A2 -->|Medium| F["1000 sets<br/>Index needed"]
    A2 -->|Large| G["1M sets<br/>Index essential"]
    
    E -->|Works| D
    F -->|Requires| D
    G -->|Must have| D
    
    style C fill:#ffcdd2
    style D fill:#c8e6c9
```

