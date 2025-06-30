# Dumbo - AI Chat Application with RAG

A modern, intelligent chat application with Retrieval-Augmented Generation (RAG) capabilities, built with React, TypeScript, and Supabase. Dumbo allows users to have contextual conversations with AI while leveraging uploaded documents and web content for enhanced responses.

## 🌟 Features

### Core Functionality
- **Contextual Conversations**: Organize chats by context for better focus and continuity
- **RAG-Powered Responses**: Upload documents (PDF, TXT) and get AI responses based on your content
- **Real-time Streaming**: Experience smooth, real-time AI responses with streaming
- **Multi-Modal Support**: Support for both file uploads and web content processing
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### Advanced Features
- **Vector Search**: Intelligent similarity search using OpenAI embeddings
- **Document Processing**: Automatic text extraction and chunking from PDFs and text files
- **Context Management**: Create, organize, and manage multiple conversation contexts
- **Dark/Light Theme**: Beautiful UI with theme switching support
- **Browser Extension**: Chrome extension for seamless web content integration

### Security & Performance
- **Row Level Security (RLS)**: Secure data isolation using Supabase RLS
- **Real-time Authentication**: Secure user authentication with session management
- **Optimized Embeddings**: Efficient vector storage and retrieval
- **Progressive Loading**: Smart pagination for chat history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dumbo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the migrations in the `supabase/migrations` folder
   - Enable the `vector` extension in your Supabase database

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Web app: `http://localhost:5173`
   - Extension development: Load the `dist` folder as an unpacked extension in Chrome

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL with vector extensions)
- **AI/ML**: OpenAI GPT models and embeddings
- **Build Tool**: Vite
- **Extension**: Chrome Extension Manifest V3

### Database Schema

The application uses a well-structured database schema with the following main tables:

- **`contexts`**: Conversation contexts/workspaces
- **`messages`**: Chat messages with role-based organization
- **`files`**: Uploaded documents with processing status
- **`sites`**: Web content references
- **`chunks`**: Text chunks with vector embeddings for RAG
- **`api_keys`**: Encrypted user API keys

### Key Components

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat interface components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── contexts/           # React contexts for state management
├── services/           # Business logic and API services
├── types/              # TypeScript type definitions
├── extension/          # Chrome extension specific code
└── lib/                # Utility libraries and configurations
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                    # Start web app development server

# Building
npm run build                 # Build web app for production

# Code Quality
npm run lint                  # Run ESLint
npm run preview              # Preview production build
```

### Extension Development

The project includes a Chrome extension that allows users to:
- Save web pages to contexts
- Access chat functionality from any webpage
- Process current page content with AI

To develop the extension:
1. Run `npm run build`
2. Load the `dist` folder as an unpacked extension in Chrome
3. Use keyboard shortcuts:
   - `Ctrl+K` (or `Cmd+K`): Toggle side panel
   - `Ctrl+J` (or `Cmd+J`): Save current page

### Environment Modes

The application supports multiple build modes:
- **Web App**: Standard React application
- **Extension**: Chrome extension with side panel

## 🔐 Security

### Authentication
- Secure user authentication via Supabase Auth
- Session management with automatic token refresh
- Chrome storage integration for extension persistence

### Data Protection
- Row Level Security (RLS) policies ensure data isolation
- Encrypted API key storage
- Secure file upload with validation
- CORS protection and input sanitization

### Privacy
- User data is isolated per account
- Files are stored securely in Supabase Storage
- No data sharing between users
- Optional local storage for extension functionality

## 📊 RAG System

### How It Works

1. **Document Processing**
   - Upload PDF or TXT files
   - Automatic text extraction and cleaning
   - Intelligent text chunking with overlap

2. **Embedding Generation**
   - Generate vector embeddings using OpenAI's `text-embedding-3-large`
   - Store embeddings in Supabase with vector similarity search

3. **Retrieval & Generation**
   - Query embeddings for relevant context
   - Cosine similarity search with configurable thresholds
   - Inject relevant context into AI prompts
   - Generate contextually-aware responses

### Supported File Types
- **PDF**: Automatic text extraction using PDF.js
- **TXT**: Direct text processing
- **Web Content**: Browser extension content extraction