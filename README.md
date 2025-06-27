# Dumbo - AI Chat Application

A modern chat application with RAG (Retrieval-Augmented Generation) capabilities.

## Features

- Real-time chat interface
- File upload and processing (PDF, TXT)
- Website crawling and processing
- RAG-powered responses using vector similarity search
- Context-aware conversations

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```
