# PrepVerse

PrepVerse is an AI-powered exam and interview preparation platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- Landing page with hero, feature highlights, and pricing-like summary.
- Supabase email authentication for sign up, login, and logout.
- Dashboard showing recent attempts, average score, and study streak.
- Practice module with AI-generated multiple-choice, coding, and verbal questions.
- Quiz interface with progress, timer, and next/previous navigation.
- AI feedback after submission with explanation and score reporting.
- Mock interview mode that generates sequential questions and produces a review.
- Progress saving in Supabase and responsive dark/light theme support.

## Production-ready setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy [.env.example](.env.example) to `.env.local` and populate real values.

```bash
cp .env.example .env.local
```

Required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_SUPABASE_REDIRECT=http://localhost:3000/auth/callback
```

### 3. Set up Supabase

Create a Supabase project and run the schema in [db/schema.sql](db/schema.sql) in the Supabase SQL editor.

This creates the required tables for:
- `profiles`
- `attempts`
- `answers`
- `questions`
- `ai_generations`
- other study and admin structures

Turn on email auth in Supabase Authentication and configure redirect URLs as needed.

### 4. Generate the demo seed data (optional)

```bash
node ./scripts/seedDemo.js
```

### 5. Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Deployment to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Add the same environment variables under Project Settings → Environment Variables.
4. Set the production root to the Next.js app and deploy.
5. In Supabase, add your production domain to the allowed redirect URLs for auth.

Example production environment values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_SUPABASE_REDIRECT=https://your-domain.com/auth/callback
```

## Health checks

The app includes a runtime health endpoint at `/api/health` that reports whether the required configuration is present.

## Notes

- The AI route uses Gemini when `GEMINI_API_KEY` is configured.
- If the key is missing, the app falls back to sample content rather than crashing.
- Auth and dashboard features require a valid Supabase project and database schema.
- The current app is build-ready, but not fully functional until real credentials and schema are configured.
