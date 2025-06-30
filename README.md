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

## 🔧 Chrome Extension Installation

### Option 1: Using Pre-built Extension (Recommended)

If you have the `dist.zip` file, follow these detailed steps to install the Chrome extension:

#### Step 1: Extract the Extension Files

1. **Locate the `dist.zip` file** in your project directory
2. **Right-click** on `dist.zip` and select **"Extract All..."** (Windows) or **"Open With > Archive Utility"** (Mac)
3. **Choose a location** to extract the files (e.g., your Desktop or Documents folder)
4. **Remember the path** to the extracted `dist` folder - you'll need it in the next steps

#### Step 2: Enable Chrome Developer Mode

1. **Open Google Chrome** on your computer
2. **Navigate to the Extensions page** by typing `chrome://extensions/` in the address bar and pressing Enter
   - Alternatively, click the three dots menu (⋮) → **More tools** → **Extensions**
3. **Enable Developer mode** by clicking the toggle switch in the top-right corner of the Extensions page
   - The toggle should turn blue when enabled
   - You'll see new buttons appear: "Load unpacked", "Pack extension", and "Update"

#### Step 3: Load the Extension

1. **Click the "Load unpacked" button** that appeared after enabling Developer mode
2. **Navigate to the extracted `dist` folder** using the file browser that opens
3. **Select the `dist` folder** (not the files inside it, but the folder itself)
4. **Click "Select Folder"** (Windows) or **"Open"** (Mac)

#### Step 4: Verify Installation

1. **Check the Extensions page** - you should see "Extendo Dumbo" listed with a toggle switch
2. **Ensure the extension is enabled** - the toggle should be blue/on
3. **Look for the extension icon** in your Chrome toolbar (it may be hidden in the extensions menu)

#### Step 5: Pin the Extension (Optional but Recommended)

1. **Click the puzzle piece icon** (🧩) in the Chrome toolbar to open the extensions menu
2. **Find "Extendo Dumbo"** in the list
3. **Click the pin icon** (📌) next to it to pin it to your toolbar for easy access

#### Step 6: Test the Extension

1. **Click the Extendo Dumbo icon** in your toolbar to open the side panel
2. **Try the keyboard shortcuts**:
   - **Ctrl+K** (or **Cmd+K** on Mac): Toggle the side panel
   - **Ctrl+J** (or **Cmd+J** on Mac): Save the current page to a context
3. **Sign in** with your account credentials
4. **Create a context** and start chatting with your AI assistant

### Option 2: Building from Source

If you want to build the extension yourself:

1. **Build the extension**

   ```bash
   npm run build
   ```

2. **Follow steps 2-6 from Option 1** using the newly created `dist` folder

### Troubleshooting Extension Installation

#### Common Issues and Solutions:

**"This extension may have been corrupted" error:**
- Make sure you selected the `dist` folder, not individual files
- Try extracting the zip file again to a different location
- Ensure all files were extracted properly

**Extension doesn't appear in the toolbar:**
- Check if it's hidden in the extensions menu (puzzle piece icon)
- Make sure the extension is enabled on the Extensions page
- Try refreshing the Extensions page and reloading the extension

**Keyboard shortcuts don't work:**
- Check if other extensions are using the same shortcuts
- Go to `chrome://extensions/shortcuts` to view and modify keyboard shortcuts
- Make sure you're on a regular webpage (shortcuts don't work on Chrome's internal pages)

**Side panel doesn't open:**
- Make sure you're using Chrome version 114 or later (side panel feature requirement)
- Try clicking the extension icon directly instead of using keyboard shortcuts
- Check the browser console for any error messages

**Authentication issues:**
- Ensure your `.env` file has the correct Supabase credentials
- Check that the Supabase project is properly configured
- Verify that the extension has internet access

#### Getting Help:

If you encounter issues:
1. **Check the browser console** (F12 → Console tab) for error messages
2. **Visit the Extensions page** (`chrome://extensions/`) and look for error messages
3. **Try disabling and re-enabling** the extension
4. **Reload the extension** by clicking the refresh icon on the Extensions page

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

## 🌐 Live Demo

The web application is deployed and available at: [https://inquisitive-queijadas-10c7ab.netlify.app](https://inquisitive-queijadas-10c7ab.netlify.app)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.