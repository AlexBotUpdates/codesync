const { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType, HeadingLevel, Header, Footer, PageNumber } = require('docx');
const fs = require('fs');

const colors = {
  primary: "0B1220",
  body: "1E293B",
  accent: "3B82F6",
  light: "94A3B8"
};

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 24 }
      }
    },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER }
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        run: { size: 36, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        run: { size: 28, bold: true, color: colors.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
      }
    ]
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } }
      },
      children: [
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "CodeSync", size: 72, bold: true, color: colors.accent, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "Real-time Collaborative Code Editor", size: 36, color: colors.body, font: "Times New Roman" })]
        }),
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Project Presentation", size: 28, color: colors.light, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "Version 1.0.0", size: 24, color: colors.light, font: "Times New Roman" })]
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "CodeSync - Project Presentation", size: 20, color: colors.light })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 20, color: colors.light }),
              new TextRun({ children: [PageNumber.CURRENT], size: 20, color: colors.light }),
              new TextRun({ text: " of ", size: 20, color: colors.light }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, color: colors.light })
            ]
          })]
        })
      },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Project Overview")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "CodeSync is a production-grade real-time collaborative code editor that enables multiple users to edit the same document simultaneously. Similar to Google Docs but specifically designed for code editing, CodeSync provides live cursor tracking, syntax highlighting for 10 programming languages, version history with restore capabilities, and robust role-based access control.", size: 24 })]
        }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "The application is built using modern technologies including Next.js 16 for the frontend framework, React 19 for the UI layer, TypeScript for type safety, and Socket.IO for real-time WebSocket communication. The backend uses Prisma ORM with SQLite for data persistence, while the Monaco Editor provides a VS Code-like editing experience with advanced features like IntelliSense and minimap navigation.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Key Features")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Real-time Collaboration")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "Multiple users can simultaneously edit the same document with changes synchronized in under 500 milliseconds. The system uses a WebSocket-based architecture with Socket.IO to handle real-time communication between clients. Each keystroke, cursor movement, and selection change is broadcast to all connected collaborators instantly, creating a seamless collaborative experience.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Syntax Highlighting")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "CodeSync supports syntax highlighting for 10 programming languages: Python, JavaScript, TypeScript, Java, C++, C#, Ruby, Go, Rust, and PHP. The Monaco Editor provides intelligent syntax highlighting with automatic language detection based on file extensions. Each language has custom highlighting rules for keywords, strings, comments, and other syntax elements.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Version History")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "Every significant change is automatically recorded in the version history with a complete snapshot of the document content. Users can view any previous version in read-only mode, compare changes between versions, and restore a previous version if needed. Manual saves create named versions, while auto-save creates snapshots every 5 minutes to prevent data loss.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Role-Based Access Control")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "Projects support three distinct roles: Owner, Editor, and Viewer. Owners have full control including the ability to add and remove members, change roles, delete projects, and modify all settings. Editors can create and modify documents but cannot manage members or delete the project. Viewers have read-only access and can only view the content without making any changes.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Technical Architecture")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "The application follows a modern full-stack architecture with clear separation between frontend, backend, and real-time services. The frontend is built with Next.js 16 using the App Router pattern, providing server-side rendering, API routes, and optimal performance. React 19 components use TypeScript for type safety and Zustand for state management.", size: 24 })]
        }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "The real-time collaboration service runs as a separate Node.js process using Socket.IO for WebSocket communication. This service handles all document synchronization, cursor tracking, and presence management. The Operational Transform algorithm ensures concurrent edits produce consistent results across all clients.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Security Implementation")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "Security is a top priority for CodeSync. User passwords are hashed using bcrypt with 12 salt rounds before storage. JSON Web Tokens (JWT) with 24-hour expiration handle authentication, with automatic token refresh for seamless user experience. All API endpoints validate user permissions before allowing any operation.", size: 24 })]
        }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "Input validation uses Zod schemas to prevent injection attacks and ensure data integrity. CORS configuration restricts API access to authorized origins. The WebSocket connection requires valid authentication before allowing document access. Role-based permissions are enforced at both API and WebSocket levels.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("User Interface Design")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "The UI is built with shadcn/ui components styled using Tailwind CSS 4. A dark theme is set as default with a background color of approximately #1E1E1E, optimized for extended coding sessions. Users can toggle between dark and light modes with their preference persisted in local storage.", size: 24 })]
        }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "The interface is fully responsive, adapting seamlessly from desktop monitors (1920px+) to tablets (768px-1920px) and mobile devices (<768px). On smaller screens, the sidebar collapses into a hamburger menu, and the editor and collaboration panels stack vertically for optimal viewing.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Conclusion")] }),
        new Paragraph({
          spacing: { line: 312 },
          children: [new TextRun({ text: "CodeSync represents a comprehensive solution for collaborative code editing. By combining real-time synchronization, robust version control, flexible permissions, and a polished user interface, it addresses the core needs of development teams working together on code projects. The modular architecture ensures the application can scale and evolve with future requirements.", size: 24 })]
        })
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/z/my-project/download/CodeSync-Presentation.docx', buffer);
  console.log('Presentation document created successfully!');
});
