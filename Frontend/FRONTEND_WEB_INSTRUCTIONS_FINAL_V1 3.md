# RecruitBot — Frontend Web Application Instructions (ingestion + Retrieval)

This document merges frontend ingestion flow with existing retrieval frontend phases.

## FINAL FLOW

```text
Resume ingestion
        ↓
MongoDB Storage
        ↓
Vector Search Ready
        ↓
Resume Retrieval/Search
```

---

# PHASE 1 — ingestion Frontend Setup

## Goal

Prepare frontend structure for Resume ingestion flow.

## Folder Structure

```text
src/
├── features/
│   ├── ingestion/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── types/
```

---

# PHASE 2 — Resume Upload UI

## Components

```text
ResumeUploadCard.tsx
UploadDropzone.tsx
UploadButton.tsx
UploadProgress.tsx
```

## Features

- Drag and drop upload
- PDF validation
- Upload progress
- Upload success state
- Upload error state

---

# PHASE 3 — ingestion API Integration

## Backend Endpoint

```http
POST /v1/resume/inject
```

## Responsibilities

- Upload PDF
- Send multipart/form-data
- Handle loading state
- Handle success response
- Handle error response

---

# PHASE 4 — ingestion State Management

## Store Responsibilities

- Upload loading state
- Upload progress
- ingestion success
- ingestion error
- Uploaded file state

---

# PHASE 5 — ingestion Progress UI

```text
Resume Upload
      ↓
PDF Processing
      ↓
Resume Parsing
      ↓
Embedding Generation
      ↓
MongoDB ingestion
      ↓
Completed
```

---

# PHASE 6 — ingestion Result Screen

## Success Information

- Resume uploaded successfully
- Embedding generated successfully
- MongoDB ingestion completed
- Vector search ready

---

# PHASE 7 — ingestion Validation Handling

| Validation | Message |
|---|---|
| Invalid file | Only PDF allowed |
| Large file | Maximum 5MB allowed |
| Empty upload | Please select a file |

---

# PHASE 8 — ingestion Error Handling

## Error States

- PDF extraction failed
- Resume parsing failed
- Embedding generation failed
- MongoDB ingestion failed
- Network error

---

# PHASE 9 — ingestion Final Validation

- PDF upload works
- API integration works
- ingestion progress works
- Resume searchable after ingestion

---


# RecruitBot — Frontend Web Application Instructions

## Project Overview

Build a **modern, recruiter-focused web application** that enables users to:
- Search and discover candidates using three search modes (Vector, BM25, Hybrid)
- Interact with a conversational chat-style UI to query the resume database
- View ranked candidate cards with relevance scores
- Explore detailed candidate profiles via an interactive modal
- Configure hybrid search weights in real-time for fine-tuned results

**Target Users**: Recruiters, Hiring Managers, Talent Acquisition Teams, HR Business Partners

**Design Philosophy**: Dark-themed, modern chat UI, responsive, accessible (WCAG 2.1 AA), fast and interactive

---

## Current State (Vanilla Frontend)

The existing frontend lives in `public/` as three plain files:

| File | Purpose |
|------|---------|
| `public/index.html` | Static HTML shell |
| `public/styles.css` | ~1000 lines of hand-written CSS |
| `public/script.js` | ~640 lines of vanilla JavaScript |

**Backend API Endpoints consumed by the frontend**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/search/resumes` | POST | Execute search (vector / bm25 / hybrid) |
| `/candidate/:id` | GET | Fetch full candidate profile for modal |

---

## Technology Stack

### Core Framework
- **Build Tool**: Vite 5.x (fast HMR, optimized builds)
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand (lightweight, TypeScript-first)

### UI/UX Libraries
- **Component Library**: Shadcn/ui (TailwindCSS-based, accessible)
- **Styling**: TailwindCSS 3.x (utility-first, mobile-first)
- **Icons**: Lucide React (clean, consistent icon set)
- **Animations**: Framer Motion (smooth transitions and chat animations)

### Data & API
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form + Zod validation
- **Markdown / Code Display**: react-syntax-highlighter (for candidate content)

### Developer Tools
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel (CI/CD, preview URLs)

---

## Project Structure

```
recruitbot-web/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── main.tsx                          # Entry point
│   ├── App.tsx                           # Root component with router
│   ├── config/
│   │   └── api.config.ts                 # API base URL, timeout, env vars
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                 # Axios instance with interceptors
│   │   │   ├── search.api.ts             # /search/resumes API calls
│   │   │   └── candidate.api.ts          # /candidate/:id API calls
│   │   ├── stores/
│   │   │   ├── chat.store.ts             # Chat messages state
│   │   │   ├── search.store.ts           # Search mode, weights, results
│   │   │   └── ui.store.ts               # Loading, modal, toast state
│   │   └── utils/
│   │       ├── formatters.ts             # Score formatters, date, duration
│   │       ├── sanitize.ts               # escapeHtml / XSS prevention
│   │       └── constants.ts              # Search modes, score colours, etc.
│   │
│   ├── hooks/
│   │   ├── use-search.ts                 # Search submission + result state
│   │   ├── use-chat.ts                   # Chat message management
│   │   ├── use-candidate-modal.ts        # Modal open/close + fetch
│   │   ├── use-hybrid-weights.ts         # Slider sync logic
│   │   └── use-mobile.ts                 # Mobile breakpoint detection
│   │
│   ├── components/
│   │   ├── ui/                           # Shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx              # Outer flex container (sidebar + main)
│   │   │   ├── Sidebar.tsx               # Left sidebar with all controls
│   │   │   └── MobileDrawer.tsx          # Slide-out sidebar for mobile
│   │   ├── common/
│   │   │   ├── BrandAvatar.tsx           # RecruitBot SVG logo
│   │   │   ├── StatusDot.tsx             # Pulsing online indicator
│   │   │   ├── LoadingDots.tsx           # Three-dot typing animation
│   │   │   ├── Toast.tsx                 # Error/info toast notification
│   │   │   └── EmptyState.tsx            # No results illustration
│   │   └── features/
│   │       ├── sidebar/
│   │       │   ├── SearchModeNav.tsx     # Vector / BM25 / Hybrid buttons
│   │       │   ├── HybridWeightPanel.tsx # Sliders + preset pills
│   │       │   ├── ResultsLimitSelect.tsx# Top N results selector
│   │       │   └── ClearChatButton.tsx   # Clear thread button
│   │       ├── chat/
│   │       │   ├── ChatTopbar.tsx        # Name, mode badge, status
│   │       │   ├── ChatMessages.tsx      # Scrollable message thread
│   │       │   ├── UserBubble.tsx        # User query bubble
│   │       │   ├── BotBubble.tsx         # Bot response bubble wrapper
│   │       │   ├── WelcomeMessage.tsx    # Intro message on first load
│   │       │   ├── SuggestionChips.tsx   # Pre-canned query chips
│   │       │   └── ChatInputBar.tsx      # Textarea + send button
│   │       ├── results/
│   │       │   ├── ResultsList.tsx       # Grid/list of result cards
│   │       │   ├── ResultCard.tsx        # Single candidate result card
│   │       │   ├── ResultSummary.tsx     # Count + mode + duration header
│   │       │   ├── RankBadge.tsx         # #1, #2, #3 rank indicator
│   │       │   └── ScorePill.tsx         # Coloured score chip
│   │       └── candidate/
│   │           ├── CandidateModal.tsx    # Full-screen profile modal
│   │           ├── ModalHeader.tsx       # Name, title, close button
│   │           ├── ContactSection.tsx    # Email, phone, location
│   │           ├── SkillsSection.tsx     # Skill chips cloud
│   │           ├── ExperienceSection.tsx # Job timeline
│   │           ├── EducationSection.tsx  # Degree, institution
│   │           ├── ProjectsSection.tsx   # Projects list
│   │           └── CertificationsSection.tsx
│   │
│   ├── pages/
│   │   └── ChatPage.tsx                  # Single-page chat interface
│   │
│   └── types/
│       ├── search.types.ts               # SearchRequest, SearchResult, SearchMode
│       ├── candidate.types.ts            # CandidateProfile, Experience, Education
│       ├── chat.types.ts                 # Message, MessageType
│       └── api.types.ts                  # ApiResponse, ApiError
│
├── .env.development
├── .env.production
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Development Phases

---

### Phase 10: Project Setup & Core Infrastructure

**Objective**: Bootstrap the React + TypeScript project with all dependencies, config files, and the base layout shell.

#### Tasks

1. Initialise Vite + React + TypeScript project
2. Install all dependencies (see commands below)
3. Configure TailwindCSS with the RecruitBot dark design tokens
4. Initialise Shadcn/ui components (button, badge, slider, dialog, select, textarea)
5. Set up folder structure as defined above
6. Configure Axios API client with interceptors
7. Create skeleton Zustand stores
8. Build `AppShell` layout (sidebar + main columns)
9. Configure React Router v6 (single route: `/`)
10. Set up environment variable handling
11. Configure ESLint + Prettier

#### Commands

```bash
# Create project
npm create vite@latest recruitbot-web -- --template react-ts
cd recruitbot-web

# Core dependencies
npm install
npm install react-router-dom zustand axios
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react framer-motion
npm install react-hot-toast

# Dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node
npm install -D eslint prettier eslint-config-prettier

# Initialise Tailwind
npx tailwindcss init -p

# Add Shadcn/ui
npx shadcn-ui@latest init

# Add required Shadcn components
npx shadcn-ui@latest add button badge dialog select slider textarea card tooltip
```

#### Configuration Files

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/search': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/candidate': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

**tailwind.config.js** (RecruitBot dark theme tokens):
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // RecruitBot brand
        primary: '#6366f1',
        accent: '#ec4899',
        // Backgrounds
        'bg-base': '#0f0f13',
        'bg-surface': '#18181f',
        'bg-card': '#1e1e28',
        // Text
        'text-primary': '#f1f1f5',
        'text-muted': '#8b8ba0',
        // Search mode scores
        'score-vector': '#818cf8',
        'score-bm25': '#f472b6',
        'score-hybrid': '#34d399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulse: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        bounce: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '0%': { backgroundPosition: '-200%' }, '100%': { backgroundPosition: '200%' } },
      },
      animation: {
        'status-pulse': 'pulse 2s ease-in-out infinite',
        'dot-bounce': 'bounce 0.6s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

**.env.development**:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=RecruitBot
VITE_ENABLE_MOCK=false
```

**.env.production**:
```
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_APP_NAME=RecruitBot
VITE_ENABLE_MOCK=false
```

#### API Client (src/lib/api/client.ts)
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.error || 'An error occurred';
      if (status === 404) toast.error(`Not found: ${message}`);
      else if (status === 500) toast.error('Server error. Please try again later.');
      else toast.error(message);
    } else if (error.request) {
      toast.error('Network error. Check your connection.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Zustand Store Skeletons

**src/lib/stores/search.store.ts**:
```typescript
import { create } from 'zustand';
import { SearchMode, SearchResult } from '@/types/search.types';

interface SearchState {
  searchType: SearchMode;
  bm25Weight: number;
  vectorWeight: number;
  topK: number;
  results: SearchResult[];
  isSearching: boolean;
  lastQuery: string;
  setSearchType: (mode: SearchMode) => void;
  setWeights: (bm25: number, vector: number) => void;
  setTopK: (k: number) => void;
  setResults: (results: SearchResult[], query: string) => void;
  setSearching: (v: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchType: 'vector',
  bm25Weight: 50,
  vectorWeight: 50,
  topK: 5,
  results: [],
  isSearching: false,
  lastQuery: '',
  setSearchType: (mode) => set({ searchType: mode }),
  setWeights: (bm25, vector) => set({ bm25Weight: bm25, vectorWeight: vector }),
  setTopK: (k) => set({ topK: k }),
  setResults: (results, query) => set({ results, lastQuery: query }),
  setSearching: (v) => set({ isSearching: v }),
}));
```

#### Deliverables
- ✅ Running Vite dev server on port 5173
- ✅ AppShell layout (sidebar 260 px + full-height chat main)
- ✅ React Router configured (ChatPage at `/`)
- ✅ Axios client with interceptors
- ✅ Zustand store skeletons (chat, search, ui)
- ✅ TailwindCSS with RecruitBot dark tokens
- ✅ Shadcn/ui primitives installed

---

### Phase 11: Sidebar Module

**Objective**: Build the full left sidebar with brand, search mode switching, hybrid weight controls, results limit, and clear button.

#### Components to Build

1. **BrandAvatar.tsx**
   - Inline SVG circle avatar with indigo → pink gradient
   - Brand name "RecruitBot" + "Online" status
   - `StatusDot.tsx` — 6 px green dot with `animate-status-pulse`

2. **SearchModeNav.tsx**
   - Three `<button>` cards: Vector Search | BM25 Keyword | Hybrid
   - Each button: SVG icon + mode name + mode description + checkmark (shown when active)
   - Click handler calls `setSearchType()` from search store
   - Active button: indigo tinted background + border
   - Props: `activeMode`, `onChange`

3. **HybridWeightPanel.tsx** (hidden unless mode === `'hybrid'`)
   - Section title "Search Weights"
   - Two rows: BM25 slider + Vector slider (Shadcn `<Slider>`)
   - Sliders linked: `vectorWeight = 100 - bm25Weight` (complementary)
   - Live percentage displays: "50%"
   - Three preset pills: 50/50 | 70/30 | 30/70
   - Uses `use-hybrid-weights.ts` hook for sync logic
   - Animated: `AnimatePresence` + `motion.div` slide-down when hybrid selected

4. **ResultsLimitSelect.tsx**
   - Label "Show top" + Shadcn `<Select>` with options 3, 5 (default), 10, 20 + "results"
   - Updates `topK` in search store

5. **ClearChatButton.tsx**
   - Full-width button with ✕ icon
   - Calls `clearMessages()` from chat store + re-renders welcome message

6. **Sidebar.tsx** (composes all above)
   - Fixed 260 px width, `overflow-y: auto`
   - Order from top: Brand → Section label → SearchModeNav → HybridWeightPanel → Section label → ResultsLimitSelect → ClearChatButton → Footer

**Sidebar.tsx skeleton**:
```tsx
export function Sidebar() {
  const { searchType, setSearchType } = useSearchStore();
  
  return (
    <aside className="w-[260px] shrink-0 bg-bg-surface border-r border-white/[0.07] flex flex-col p-5 gap-4 overflow-y-auto">
      <BrandAvatar />
      <SectionLabel>Search Mode</SectionLabel>
      <SearchModeNav activeMode={searchType} onChange={setSearchType} />
      <AnimatePresence>
        {searchType === 'hybrid' && <HybridWeightPanel />}
      </AnimatePresence>
      <SectionLabel className="mt-auto">Results limit</SectionLabel>
      <ResultsLimitSelect />
      <ClearChatButton />
      <footer className="text-xs text-text-muted pt-2">RecruitBot v2.0</footer>
    </aside>
  );
}
```

#### Custom Hook (src/hooks/use-hybrid-weights.ts)
```typescript
export function useHybridWeights() {
  const { bm25Weight, vectorWeight, setWeights } = useSearchStore();
  
  function handleBm25Change(value: number) {
    setWeights(value, 100 - value);
  }
  
  function handleVectorChange(value: number) {
    setWeights(100 - value, value);
  }
  
  function applyPreset(bm25: number, vector: number) {
    setWeights(bm25, vector);
  }
  
  return { bm25Weight, vectorWeight, handleBm25Change, handleVectorChange, applyPreset };
}
```

#### Deliverables
- ✅ Brand avatar with pulsing status dot
- ✅ Search mode buttons with active state
- ✅ Hybrid weight panel animates in/out
- ✅ Sliders are complementary (sum to 100)
- ✅ Preset pills set both sliders atomically
- ✅ Results limit select wired to store
- ✅ Clear chat button wired to chat store

---

### Phase 12: Chat Interface Module

**Objective**: Build the chat topbar, scrollable message thread, suggestion chips, welcome message, and the input bar.

#### Components to Build

1. **ChatTopbar.tsx**
   - Left: Mini avatar + "RecruitBot" name + mode sub-label (e.g. "Vector Search · Semantic similarity")
   - Right: Mode badge pill — colour changes with active mode:
     - Vector → indigo (`bg-score-vector/20 text-score-vector`)
     - BM25 → pink (`bg-score-bm25/20 text-score-bm25`)
     - Hybrid → green (`bg-score-hybrid/20 text-score-hybrid`)
   - Mode label updates reactively from search store

2. **WelcomeMessage.tsx**
   - Bot bubble shown on first load (or after clear)
   - Content: greeting + explanation of three modes with icons
   - Rendered as a `BotBubble` with no timestamp

3. **SuggestionChips.tsx**
   - Visible only when message thread is empty (before first search)
   - Four preset chips:
     - 🔍 Selenium QA 3 yrs → `"Selenium automation engineer 3 years"`
     - 🐍 Python ML dev → `"Python developer with machine learning"`
     - ☁️ Java AWS backend → `"Java backend developer AWS cloud"`
     - ⚡ Lead QA Cypress → `"Lead QA engineer with Cypress and CI/CD"`
   - Click: ingest query into input, auto-submit

4. **UserBubble.tsx**
   - Right-aligned message bubble
   - Gradient background (indigo → pink from CSS vars)
   - Timestamp (formatted as `HH:mm`)
   - Framer Motion: slide in from right

5. **BotBubble.tsx**
   - Left-aligned message bubble
   - `bg-bg-card` background
   - Accepts `children` (plain text OR ResultsList component)
   - Framer Motion: slide in from left

6. **ChatMessages.tsx**
   - `flex-1 overflow-y-auto` scroll container
   - List of `UserBubble` and `BotBubble` messages from chat store
   - Auto-scrolls to bottom on new message using `useEffect` + `scrollIntoView`
   - Renders `LoadingDots` (typing indicator) while `isSearching === true`

7. **ChatInputBar.tsx**
   - `<textarea>` that auto-resizes (1 → max 6 lines) using `onInput` height reset
   - Send button: disabled when empty or `isSearching`
   - Keyboard: `Enter` → submit, `Shift+Enter` → newline
   - Input hint: "Press Enter to search · Shift+Enter for new line"

8. **LoadingDots.tsx**
   - Three `<span>` dots with staggered `animate-dot-bounce`
   - Shown inside a `BotBubble` while search is in progress

**Chat store (src/lib/stores/chat.store.ts)**:
```typescript
import { create } from 'zustand';
import { Message } from '@/types/chat.types';

interface ChatState {
  messages: Message[];
  addUserMessage: (text: string) => void;
  addBotMessage: (content: React.ReactNode) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addUserMessage: (text) =>
    set((s) => ({
      messages: [...s.messages, { id: crypto.randomUUID(), type: 'user', text, timestamp: new Date() }],
    })),
  addBotMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { id: crypto.randomUUID(), type: 'bot', content, timestamp: new Date() }],
    })),
  clearMessages: () => set({ messages: [] }),
}));
```

#### Deliverables
- ✅ Topbar mode badge updates reactively
- ✅ Welcome message renders on first load / after clear
- ✅ Suggestion chips auto-submit query
- ✅ User/bot bubbles animate in with Framer Motion
- ✅ Textarea auto-resizes to content
- ✅ Enter to submit, Shift+Enter for newline
- ✅ Loading typing dots display during search
- ✅ Auto-scroll to latest message

---

### Phase 13: Search & Results Module

**Objective**: Wire up the search API call, build result cards, and render ranked results inside bot bubbles.

#### Components to Build

1. **ResultSummary.tsx**
   - Displays: "Found **5** candidates · Vector Search · 243 ms"
   - Mode badge (coloured per search type)
   - Duration in ms formatted neatly

2. **RankBadge.tsx**
   - Circle chip: `#1`, `#2`, `#3`, etc.
   - Gradient fill for top 3, muted for rest

3. **ScorePill.tsx**
   - Shows score value + label (Similarity / BM25 Score / Hybrid)
   - Colour: `text-score-vector` | `text-score-bm25` | `text-score-hybrid`
   - Props: `score: number`, `searchType: SearchMode`

4. **ResultCard.tsx**
   - Clickable card — triggers `openCandidateModal(candidateId)` from `use-candidate-modal`
   - Layout:
     - Top row: `RankBadge` + candidate name + `ScorePill`
     - Second row: experience years chip + email + phone (if available)
     - Bottom: content snippet (first 200 chars, truncated, HTML-escaped)
   - Hover: subtle box-shadow lift + border colour tint
   - Framer Motion: staggered `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}`
   - Stagger delay: `index * 0.06s`

5. **ResultsList.tsx**
   - Renders `ResultSummary` + a vertical list of `ResultCard` components
   - "No candidates found" `EmptyState` if results array is empty
   - Props: `results: SearchResult[]`, `searchType: SearchMode`, `duration: number`, `query: string`

6. **EmptyState.tsx**
   - Icon + heading + sub-text
   - Used when no results returned

#### API Integration (src/lib/api/search.api.ts)
```typescript
import apiClient from './client';
import { SearchRequest, SearchResponse } from '@/types/search.types';

export const searchApi = {
  async searchResumes(params: SearchRequest): Promise<SearchResponse> {
    const response = await apiClient.post('/search/resumes', params);
    return response.data;
  },
};
```

#### Custom Hook (src/hooks/use-search.ts)
```typescript
export function useSearch() {
  const { searchType, bm25Weight, vectorWeight, topK, setSearching } = useSearchStore();
  const { addUserMessage, addBotMessage } = useChatStore();
  
  async function submitQuery(query: string) {
    if (!query.trim()) return;
    
    addUserMessage(query);
    setSearching(true);
    
    try {
      const data = await searchApi.searchResumes({
        query: query.trim(),
        searchType: searchType === 'bm25' ? 'keyword' : searchType,  // API expects 'keyword'
        topK,
        bm25Weight: bm25Weight / 100,
        vectorWeight: vectorWeight / 100,
      });
      
      addBotMessage(
        <ResultsList
          results={data.results}
          searchType={searchType}
          duration={data.duration}
          query={data.query}
        />
      );
    } catch (err) {
      addBotMessage(<p className="text-red-400">Search failed. Please try again.</p>);
    } finally {
      setSearching(false);
    }
  }
  
  return { submitQuery };
}
```

#### Type Definitions (src/types/search.types.ts)
```typescript
export type SearchMode = 'vector' | 'bm25' | 'hybrid';

export interface SearchRequest {
  query: string;
  searchType: 'vector' | 'keyword' | 'hybrid';
  topK: number;
  bm25Weight?: number;
  vectorWeight?: number;
}

export interface SearchResult {
  candidateId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  score: number;
  experienceYears?: number;
  content: string;
}

export interface SearchResponse {
  query: string;
  searchType: string;
  topK: number;
  resultCount: number;
  duration: number;
  results: SearchResult[];
  metadata?: Record<string, any>;
}
```

#### Deliverables
- ✅ Search API call wired to search store
- ✅ Result cards render inside bot bubbles
- ✅ Score pills colour by search type
- ✅ Rank badges for all results
- ✅ Card click opens candidate modal
- ✅ Empty state when no results
- ✅ Staggered card entrance animation
- ✅ Search type mapped correctly (bm25 → keyword for API)

---

### Phase 14: Candidate Profile Modal

**Objective**: Build the full candidate profile modal that fetches and displays a complete candidate record.

#### Components to Build

1. **ModalHeader.tsx**
   - Candidate name (`<h2>`)
   - Meta span: job title + company
   - Close button (✕) — top-right
   - Sticky position inside modal

2. **ContactSection.tsx**
   - Email with mail icon
   - Phone with phone icon
   - Location with map-pin icon
   - Only render rows where data exists

3. **SkillsSection.tsx**
   - Section label "Skills"
   - Flex-wrap cloud of `<span>` skill chips
   - Each chip: `bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded text-xs`

4. **ExperienceSection.tsx**
   - Section label "Experience"
   - Ordered list: company name + title + duration + description paragraph
   - Left border timeline decoration

5. **EducationSection.tsx**
   - Section label "Education"
   - Degree name + institution + year (if available)

6. **ProjectsSection.tsx**
   - Section label "Projects" (hidden if empty array)
   - Each project: bold title + description

7. **CertificationsSection.tsx**
   - Section label "Certifications" (hidden if empty array)
   - Each cert: cert name as a badge or list item

8. **CandidateModal.tsx** (composes all above)
   - Fixed fullscreen overlay — `backdrop-blur-md bg-black/50`
   - Centred `<div>` modal card — max 640 px wide, max 88 vh tall, `overflow-y: auto`
   - Loading skeleton while `GET /candidate/:id` is in flight
   - All text ingested from API must be rendered safely (use `textContent` or DOMPurify)
   - Close on: close button click, overlay click, `Escape` key
   - Focus trap inside modal (accessibility)

#### API Integration (src/lib/api/candidate.api.ts)
```typescript
import apiClient from './client';
import { CandidateProfile } from '@/types/candidate.types';

export const candidateApi = {
  async getCandidate(id: string): Promise<CandidateProfile> {
    const response = await apiClient.get(`/candidate/${id}`);
    return response.data;
  },
};
```

#### Custom Hook (src/hooks/use-candidate-modal.ts)
```typescript
import { useState } from 'react';
import { candidateApi } from '@/lib/api/candidate.api';
import { CandidateProfile } from '@/types/candidate.types';
import toast from 'react-hot-toast';

export function useCandidateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  async function openCandidateModal(id: string) {
    setIsOpen(true);
    setLoading(true);
    try {
      const data = await candidateApi.getCandidate(id);
      setCandidate(data);
    } catch {
      toast.error('Failed to load candidate profile.');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }
  
  function closeModal() {
    setIsOpen(false);
    setCandidate(null);
  }
  
  return { isOpen, candidate, loading, openCandidateModal, closeModal };
}
```

#### Type Definitions (src/types/candidate.types.ts)
```typescript
export interface Experience {
  company: string;
  title: string;
  duration?: string;
  description?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
}

export interface CandidateProfile {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  title?: string;
  company?: string;
  education?: Education[];
  experience?: Experience[];
  skills?: string[];
  projects?: { title: string; description: string }[];
  certifications?: string[];
  text?: string;
  processedAt?: string;
}
```

#### Deliverables
- ✅ Modal opens with loading skeleton
- ✅ All candidate sections rendered (contact, skills, experience, education, projects, certs)
- ✅ Empty sections hidden gracefully
- ✅ Close on button, overlay click, and Escape key
- ✅ Focus trap for accessibility
- ✅ Framer Motion enter/exit animation (`scale` + `opacity`)

---

### Phase 15: Layout Integration & Full Page Assembly

**Objective**: Compose all modules into the single `ChatPage`, wire all state, and verify end-to-end flow.

#### Tasks

1. **ChatPage.tsx** — compose `AppShell` → `Sidebar` + `ChatMain`
   ```tsx
   export function ChatPage() {
     return (
       <AppShell>
         <Sidebar />
         <ChatMain />
       </AppShell>
     );
   }
   ```

2. **ChatMain.tsx** — compose `ChatTopbar` + `ChatMessages` + `SuggestionChips` + `ChatInputBar`
   - Show `SuggestionChips` only when `messages.length === 0 || allMessagesAreWelcome`
   - Pass `submitQuery` from `use-search` hook to both `SuggestionChips` and `ChatInputBar`

3. **App.tsx** — set up router and toast provider
   ```tsx
   import { Toaster } from 'react-hot-toast';
   import { BrowserRouter, Routes, Route } from 'react-router-dom';
   import { ChatPage } from './pages/ChatPage';
   
   export default function App() {
     return (
       <BrowserRouter>
         <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e1e28', color: '#f1f1f5' } }} />
         <Routes>
           <Route path="/" element={<ChatPage />} />
         </Routes>
       </BrowserRouter>
     );
   }
   ```

4. **Global CSS** (`src/index.css`) — import Inter font + Tailwind directives:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   html, body, #root {
     height: 100%;
     overflow: hidden;
     background-color: #0f0f13;
     color: #f1f1f5;
   }
   ```

#### End-to-End Flow Verification

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open app | Welcome message + suggestion chips visible |
| 2 | Click suggestion chip | Query auto-fills, search fires |
| 3 | Results render | Bot bubble with summary header + ranked cards |
| 4 | Switch to BM25 mode | Badge updates to pink "BM25" |
| 5 | Search again | Cards show pink score pills |
| 6 | Switch to Hybrid | Weight panel animates in |
| 7 | Adjust sliders | Percentages update, sliders stay complementary |
| 8 | Click a result card | Modal opens with full profile |
| 9 | Press Escape | Modal closes |
| 10 | Click "Clear chat" | Thread resets, welcome message reappears |

#### Deliverables
- ✅ All modules composed into single ChatPage
- ✅ Full search → results → modal flow working
- ✅ Search mode switching reactive across sidebar + topbar
- ✅ Hybrid weight panel in sync with sliders
- ✅ Toast provider configured
- ✅ No console errors

---
## Design System

### Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#6366f1` | Active states, brand, send button |
| `--accent` | `#ec4899` | Brand secondary, gradient end |
| `--bg-base` | `#0f0f13` | Page background |
| `--bg-surface` | `#18181f` | Sidebar, modal backdrop card |
| `--bg-card` | `#1e1e28` | Message bubbles, result cards |
| `--text-primary` | `#f1f1f5` | Main text |
| `--text-muted` | `#8b8ba0` | Labels, hints, secondary text |
| `--score-vector` | `#818cf8` | Vector search score pill |
| `--score-bm25` | `#f472b6` | BM25 search score pill |
| `--score-hybrid` | `#34d399` | Hybrid search score pill |
| `--border` | `rgba(255,255,255,0.07)` | Card and panel borders |

### Typography

| Role | Class | Size |
|------|-------|------|
| Candidate name | `text-base font-semibold` | 16 px |
| Section label | `text-xs font-medium uppercase tracking-widest` | 12 px |
| Mode name | `text-sm font-medium` | 14 px |
| Mode description | `text-xs text-text-muted` | 12 px |
| Score value | `text-sm font-semibold` | 14 px |
| Snippet text | `text-xs text-text-muted` | 12 px |
| Input placeholder | `text-sm text-text-muted` | 14 px |

### Component Spacing
- Sidebar padding: `p-5` (20 px)
- Card padding: `p-4` (16 px)
- Gap between cards: `gap-3` (12 px)
- Section gap: `gap-4` (16 px)
- Modal padding: `p-6` (24 px)

### State Colours

| State | Class |
|-------|-------|
| Mode button active | `bg-indigo-500/12 border-indigo-400/30` |
| Send button enabled | `bg-gradient-to-r from-primary to-accent` |
| Send button disabled | `opacity-40 cursor-not-allowed` |
| Card hover | `hover:shadow-lg hover:border-white/[0.12]` |
| Score — Vector | `text-score-vector bg-score-vector/10` |
| Score — BM25 | `text-score-bm25 bg-score-bm25/10` |
| Score — Hybrid | `text-score-hybrid bg-score-hybrid/10` |

---

## API Reference (Backend Endpoints)

### POST /search/resumes

**Request**:
```json
{
  "query": "Python developer with machine learning",
  "searchType": "vector",
  "topK": 5,
  "bm25Weight": 0.5,
  "vectorWeight": 0.5
}
```
> Note: `searchType` accepts `"vector"`, `"keyword"` (not `"bm25"`), `"hybrid"`

**Response**:
```json
{
  "query": "Python developer with machine learning",
  "searchType": "vector",
  "topK": 5,
  "resultCount": 5,
  "duration": 243,
  "results": [
    {
      "candidateId": "abc123",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+1-555-123-4567",
      "score": 0.92,
      "experienceYears": 5,
      "content": "Experienced Python developer with expertise in..."
    }
  ]
}
```

### GET /candidate/:id

**Response**:
```json
{
  "_id": "abc123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+1-555-123-4567",
  "location": "San Francisco, CA",
  "title": "Senior Software Engineer",
  "company": "TechCorp",
  "skills": ["Python", "TensorFlow", "AWS", "Docker"],
  "experience": [
    { "company": "TechCorp", "title": "Senior SWE", "duration": "2021-Present", "description": "..." }
  ],
  "education": [
    { "degree": "B.S. Computer Science", "institution": "UC Berkeley", "year": "2018" }
  ],
  "projects": [],
  "certifications": ["AWS Certified Solutions Architect"],
  "processedAt": "2025-01-15T10:30:00Z"
}
```

---

## Testing Strategy

### Unit Tests

**Search store**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchStore } from '@/lib/stores/search.store';

describe('searchStore', () => {
  beforeEach(() => useSearchStore.getState().setSearchType('vector'));
  
  it('sets search type', () => {
    useSearchStore.getState().setSearchType('hybrid');
    expect(useSearchStore.getState().searchType).toBe('hybrid');
  });
  
  it('updates weights', () => {
    useSearchStore.getState().setWeights(70, 30);
    expect(useSearchStore.getState().bm25Weight).toBe(70);
    expect(useSearchStore.getState().vectorWeight).toBe(30);
  });
});
```

**ResultCard component**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultCard } from '@/components/features/results/ResultCard';

const mockResult = {
  candidateId: 'c1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  score: 0.92,
  experienceYears: 5,
  content: 'Experienced Python developer…',
};

describe('ResultCard', () => {
  it('renders candidate name and score', () => {
    render(<ResultCard result={mockResult} rank={1} searchType="vector" onSelect={vi.fn()} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('0.92')).toBeInTheDocument();
  });
  
  it('calls onSelect with candidateId on click', () => {
    const onSelect = vi.fn();
    render(<ResultCard result={mockResult} rank={1} searchType="vector" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });
});
```

### E2E Critical Flow (Playwright)
```
1. Open http://localhost:5173/
2. Assert welcome message visible
3. Click "Selenium QA 3 yrs" chip
4. Assert result cards appear with rank badges
5. Click first result card
6. Assert candidate modal opens with correct name
7. Press Escape
8. Assert modal closed
9. Click "Clear chat"
10. Assert welcome message reappears
```

---

## Deployment

### Vercel Deployment

1. Push `recruitbot-web/` to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL` → your backend URL
4. Deploy on push to `main`

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "@recruitbot_api_base_url"
  }
}
```

---

## Final Pre-Launch Checklist

- [ ] All pages render on 375 px width without overflow
- [ ] Vector / BM25 / Hybrid modes all return results
- [ ] Score pills correctly coloured per mode
- [ ] Hybrid sliders stay complementary (sum = 100)
- [ ] Preset pills (50/50, 70/30, 30/70) set both sliders
- [ ] Result card click opens candidate modal
- [ ] Modal loads all sections (contact, skills, experience, education)
- [ ] Empty sections hidden gracefully in modal
- [ ] Escape key and overlay click close modal
- [ ] "Clear chat" resets to welcome + shows chips again
- [ ] Suggestion chips auto-submit query
- [ ] Loading dots appear during search
- [ ] Toast shown on network error
- [ ] No `dangerouslySetInnerHTML` without sanitisation
- [ ] All buttons have `aria-label`
- [ ] Focus trap active in modal
- [ ] `aria-live` announces new results
- [ ] Keyboard navigation works through all controls
- [ ] Vite build completes with no errors (`npm run build`)
- [ ] No console errors in production build
- [ ] Lighthouse score ≥ 85 (Performance + Accessibility)

---

## Resources

### Documentation
- [React 18 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/icons)

### Design Inspiration
- Current `public/` vanilla implementation (reference for UI layout and behaviour)
- [Linear](https://linear.app) — clean sidebar + main split
- [Claude.ai](https://claude.ai) — dark chat UI patterns

---

## Development Workflow

1. **Branch**: create `feature/<phase-name>` from `main`
2. **Implement**: build components, add types, wire stores
3. **Test**: run `npm run dev`, test all interactions in browser (mobile + desktop)
4. **Lint**: `npm run lint` must pass
5. **Commit**: `feat: <concise description>` (e.g., `feat: add hybrid weight panel`)
6. **Push**: create PR → merge to `main` → auto-deploy to Vercel

---

*End of RecruitBot Frontend Web Instructions*
