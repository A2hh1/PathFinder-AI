# PathFinder AI – Smart Career Navigation Platform

A student-focused career guidance platform that analyzes academic transcripts, profiles, and achievements to recommend personalized career paths with AI-powered insights.

## Features

- **Smart Onboarding** – Multi-step profile setup collecting personal, academic, and career data
- **AI Transcript Extraction** – Upload PDF/image transcripts; AI extracts courses, grades, and credit hours automatically
- **Career Path Recommendations** – AI analyzes your profile using a weighted model (courses 40%, projects 25%, certifications 20%, skills 10%, interests 5%) to suggest 3–5 career paths with match percentages
- **Dashboard** – Career Readiness Score (out of 100), skill gap analysis, quick stats, and recent activity
- **Skill Gap Analysis** – Identifies missing skills for your selected career path with a practical development roadmap and suggested certifications
- **Market Opportunities** – AI-generated internship and job matches based on your career path and academic stage
- **CV Generation** – ATS-friendly professional CV built from your profile data, with print-only CSS and download support
- **AI Career Chatbot** – Floating chat widget with streaming responses for career guidance questions
- **Bilingual Support** – Full English and Arabic (RTL) support with language toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS v3, shadcn/ui |
| Backend | Supabase (Auth, Database, Storage, Edge Functions) |
| AI | Lovable AI Gateway (Google Gemini) |
| Deployment | Lovable Cloud |

## Project Structure

```
src/
├── components/       # Reusable UI components (Navbar, ChatWidget, FileUpload, TagInput)
├── contexts/         # React contexts (AuthContext)
├── hooks/            # Custom hooks
├── i18n/             # Internationalization (translations, LanguageContext)
├── integrations/     # Supabase client & auto-generated types
├── pages/            # Route pages
│   ├── Index.tsx           # Landing page
│   ├── Login.tsx           # Login page
│   ├── Signup.tsx          # Signup page
│   ├── Onboarding.tsx      # Multi-step onboarding form
│   ├── TranscriptReview.tsx# Review AI-extracted transcript data
│   ├── CareerAnalysis.tsx  # Career path selection
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Profile.tsx         # View/edit profile
│   ├── Opportunities.tsx   # Job & internship matches
│   ├── CVPage.tsx          # Generated CV view
│   └── NotFound.tsx        # 404 page
└── lib/              # Utilities

supabase/
├── config.toml       # Supabase project config
└── functions/        # Edge Functions
    ├── analyze-career/         # Weighted career analysis
    ├── career-chat/            # Streaming chatbot
    ├── extract-transcript/     # Transcript parsing via AI
    ├── generate-cv/            # CV content generation
    ├── generate-opportunities/ # Job/internship matching
    └── skill-gap-analysis/     # Gap identification & roadmap
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, university, GPA, skills, interests, etc.) |
| `transcripts` | Uploaded transcripts with AI-extracted course data |
| `career_paths` | AI-recommended career paths and user's selected path |
| `skill_gaps` | Missing skills, roadmap, and suggested certifications |
| `readiness_scores` | Career readiness score with category breakdown |
| `opportunities` | AI-generated job and internship matches |
| `cv_data` | Generated CV content |
| `chat_messages` | Chat history with AI career advisor |
| `uploads` | File upload records |

All tables are secured with Row-Level Security (RLS) policies scoped to the authenticated user.

## User Flow

1. **Landing Page** → Sign up / Log in
2. **Onboarding** → Fill personal, academic, skills info + upload transcript
3. **Transcript Review** → Verify AI-extracted course data
4. **Career Analysis** → View recommended paths, select one
5. **Dashboard** → Readiness score, skill gaps, quick stats
6. **Opportunities** → Browse matched internships & jobs
7. **CV Page** → View/download AI-generated CV
8. **Chat** → Ask career questions anytime via floating widget

## Getting Started (Local Development)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:8080`. Backend services (auth, database, AI) are hosted on Lovable Cloud and require an internet connection.

## Design System

- **Primary Color:** `#1E3A8A` (Deep Blue)
- **Secondary Color:** `#14B8A6` (Teal)
- **Headings:** Plus Jakarta Sans
- **Body:** Inter
- **Theme:** Clean, modern, professional

## License

Private project – All rights reserved.

## Team members
# Ahmed AlMusaed 
# Nawaf AlZahrani
# Difallah AlNoman
# Hasan AlHarbi
