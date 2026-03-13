# CodeSync - Real-time Collaborative Code Editor

![CodeSync Logo](https://img.shields.io/badge/CodeSync-v1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**CodeSync** is a production-grade real-time collaborative code editor that enables multiple users to edit code simultaneously with live cursor tracking, syntax highlighting, version history, and role-based access control. Think of it as Google Docs for code.

## 🚀 Features

### Core Features
- **Real-time Collaborative Editing** - Multiple users can edit the same document simultaneously
- **Live Cursor Tracking** - See other users' cursors and selections in real-time
- **Syntax Highlighting** - Support for 10 programming languages (Python, JavaScript, TypeScript, Java, C++, C#, Ruby, Go, Rust, PHP)
- **Version History** - Track all changes with the ability to view and restore previous versions
- **Role-Based Access Control** - Owner, Editor, and Viewer roles with appropriate permissions
- **Multi-file Projects** - Create and manage multiple files within a project

### Authentication & Security
- **JWT-based Authentication** - Secure authentication with 24-hour token expiry
- **Password Hashing** - bcrypt for secure password storage
- **Email Verification** - Verify email addresses during signup
- **Password Reset** - Email-based password recovery

### Collaboration
- **WebSocket Real-time Sync** - Changes propagate within ~500ms
- **Operational Transform** - Conflict resolution for concurrent edits
- **Typing Indicators** - See when others are actively editing
- **Activity Feed** - Real-time log of all activities in the document

### Export & Sharing
- **PDF Export** - Export code with syntax highlighting
- **QR Code Sharing** - Generate QR codes for quick project access
- **Email Invitations** - Invite collaborators via email
- **Public/Private Projects** - Control project visibility

### UI/UX
- **Dark/Light Theme** - Toggle between themes with preference persistence
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Monaco Editor** - VS Code-like editing experience
- **Keyboard Shortcuts** - Standard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y, etc.)

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Installation

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm
- SQLite (included) or PostgreSQL

### Quick Start

```bash
# Clone the repository
git clone https://github.com/AlexBotUpdates/codesync.git
cd codesync

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Initialize the database
bun run db:push
bun run db:generate

# Start the development server
bun run dev

# Start the collaboration service (in a separate terminal)
cd mini-services/collaboration-service && bun install && bun run dev
```

The application will be available at `http://localhost:3000`

## ⚙ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (optional, for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
```

## 🎯 Usage

### Creating an Account

1. Navigate to `/signup`
2. Enter your email, display name, and password
3. Verify your email (if email service is configured)
4. Log in to access your dashboard

### Creating a Project

1. Click "New Project" on the dashboard
2. Enter a project name and description
3. Select the programming language
4. Start coding!

### Collaborating

1. Open a project
2. Click "Share" in the header
3. Add collaborators by email or share the project link
4. Collaborators can join and edit in real-time

### Version History

1. Click the "Versions" tab in the editor sidebar
2. View all saved versions with timestamps
3. Click "View" to preview a version
4. Click "Restore" to revert to that version

## 📡 API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create a new account |
| `/api/auth/login` | POST | Authenticate and get JWT |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/profile` | PUT | Update profile |
| `/api/auth/password` | PUT | Change password |

### Project Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | Get all user's projects |
| `/api/projects` | POST | Create a new project |
| `/api/projects/[id]` | GET | Get a specific project |
| `/api/projects/[id]` | PUT | Update a project |
| `/api/projects/[id]` | DELETE | Delete a project |

### Document Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | POST | Create a new document |
| `/api/documents/[id]` | GET | Get a document |
| `/api/documents/[id]` | PUT | Update document content |
| `/api/documents/[id]` | DELETE | Delete a document |

### Revision Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/revisions` | GET | Get document revisions |
| `/api/revisions` | POST | Create a new revision |
| `/api/revisions/[id]` | GET | Get specific revision |
| `/api/revisions/[id]` | POST | Restore a revision |

### Share Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/share/[projectId]` | GET | Get project members |
| `/api/share/[projectId]` | POST | Add a member |
| `/api/share/[projectId]` | PUT | Update member role |
| `/api/share/[projectId]` | DELETE | Remove a member |

## 🏗 Architecture

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Editor**: Monaco Editor (VS Code's editor)
- **State Management**: Zustand
- **Database**: Prisma ORM with SQLite
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt

### Project Structure

```
codesync/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (main)/            # Main application pages
│   │   │   ├── dashboard/
│   │   │   ├── editor/
│   │   │   └── profile/
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── editor/            # Editor components
│   │   ├── layout/            # Layout components
│   │   └── project/           # Project components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and helpers
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── mini-services/
│   └── collaboration-service/ # WebSocket server
└── public/                    # Static assets
```

### Real-time Collaboration

The collaboration system uses Socket.IO for real-time communication:

1. **Connection**: Client connects to the collaboration service on port 3003
2. **Document Join**: Client emits `connect_to_document` with user info
3. **Cursor Tracking**: Clients emit `cursor_move` events (~500ms intervals)
4. **Code Changes**: Clients emit `code_change` with operations
5. **Broadcasting**: Server broadcasts changes to all connected clients

### Operational Transform

The system implements a simplified OT algorithm:

```typescript
interface Operation {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
}
```

Operations are transformed against each other to ensure all clients converge to the same document state.

## 🗄 Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email |
| passwordHash | String | bcrypt hash |
| displayName | String | Display name |
| avatarColor | String | Avatar color |
| emailVerified | Boolean | Email verified status |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### Projects Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | String | Project title |
| description | String | Project description |
| language | Enum | Programming language |
| isPublic | Boolean | Public visibility |
| ownerId | UUID | Owner reference |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### Documents Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| filename | String | File name |
| content | Text | Code content |
| language | Enum | Programming language |
| projectId | UUID | Project reference |
| lastEditedById | UUID | Last editor reference |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Update timestamp |

### Revisions Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| revisionNumber | Int | Sequential version |
| content | Text | Code snapshot |
| changeSummary | String | Change description |
| documentId | UUID | Document reference |
| changedById | UUID | Editor reference |
| createdAt | DateTime | Creation timestamp |

### Project Members Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| projectId | UUID | Project reference |
| userId | UUID | User reference |
| role | Enum | owner/editor/viewer |
| addedAt | DateTime | Addition timestamp |

## 🎨 Theming

The application supports dark and light themes:

```typescript
// Theme configuration in tailwind
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  // ... light theme values
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  // ... dark theme values
}
```

Theme preference is stored in localStorage and synced across sessions.

## 📱 Responsive Design

The UI is fully responsive:

- **Desktop (1920px+)**: Full sidebar, multi-column layout
- **Tablet (768px - 1920px)**: Collapsible sidebar, adjusted layout
- **Mobile (<768px)**: Hamburger menu, stacked layout

## 🔒 Security

- **Authentication**: JWT with 24-hour expiry
- **Password Security**: bcrypt with salt rounds of 12
- **Input Validation**: Zod schemas for all inputs
- **CORS**: Configured for secure cross-origin requests
- **XSS Prevention**: Input sanitization and React's built-in protections

## 📊 Performance

- **Editor Latency**: < 50ms for local operations
- **Real-time Sync**: < 500ms for remote updates
- **Initial Load**: < 3 seconds on typical connections
- **Concurrent Users**: Tested with 5+ simultaneous editors

## 🧪 Testing

```bash
# Run linting
bun run lint

# Type checking
bun run type-check

# Build for production
bun run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Socket.IO](https://socket.io/) - Real-time communication
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

Built with ❤️ by the CodeSync Team
