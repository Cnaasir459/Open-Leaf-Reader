# OpenLeaf Reader - Digital Library Application

A fully functional web application for managing and reading PDF books with a realistic page-flipping experience.

## Features

### User Authentication
- **User Registration**: Create new accounts with username, email, and password
- **Secure Login**: Session-based authentication with bcrypt password hashing
- **Persistent Sessions**: Stay logged in for up to 7 days
- **Profile Management**: View username and email in dropdown menu

### Book Management
- **Upload PDF Books**: Drag-and-drop or click to upload PDF files (max 50MB)
- **Custom Cover Images**: Add optional cover images for your books
- **Book Details**: Title, author, and description fields
- **Search Functionality**: Search books by title or author
- **Filter Options**: View all books, my uploads, or favorites

### Reading Experience
- **Realistic Page Flipping**: 3D flip animations when turning pages
- **PDF Rendering**: High-quality rendering using PDF.js
- **Progress Tracking**: Automatic saving of reading progress
- **Page Navigation**: Previous/Next buttons, keyboard arrows, and page slider
- **Fullscreen Mode**: Immersive reading experience
- **Favorite Books**: Mark books as favorites for quick access

### Dashboard
- **Statistics**: Total books, your uploads, favorites, and books read
- **Continue Reading**: Quick access to recently read books
- **Responsive Grid**: Beautiful book card layout with hover effects
- **View Toggle**: Switch between grid and list views

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: SQLite with better-sqlite3
- **Authentication**: bcrypt for password hashing, express-session for sessions
- **File Upload**: Multer for handling multipart form data
- **PDF Rendering**: PDF.js for rendering PDF pages
- **Frontend**: Vanilla JavaScript with CSS3 animations
- **Styling**: Custom CSS with CSS Variables

## Project Structure

```
openleaf-reader/
├── server.js              # Main Express server
├── package.json           # NPM dependencies
├── library.db            # SQLite database (created automatically)
├── sessions/             # Session storage
├── public/
│   ├── index.html        # Login/Register page
│   ├── dashboard.html    # Library dashboard
│   ├── reader.html       # Book reader page
│   ├── css/
│   │   └── styles.css    # Main stylesheet
│   ├── js/
│   │   ├── auth.js       # Authentication logic
│   │   ├── dashboard.js  # Dashboard functionality
│   │   └── reader.js     # Reader with page flipping
│   └── lib/
│       ├── pdf.min.js           # PDF.js library
│       ├── pdf.worker.min.js    # PDF.js worker
│       └── default-cover.svg    # Default book cover
└── uploads/
    ├── books/            # Uploaded PDF files
    └── covers/           # Uploaded cover images
```

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd openleaf-reader
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage Guide

### Creating an Account

1. On the landing page, click "Create Account"
2. Fill in your username, email, and password (minimum 6 characters)
3. Click "Create Account" to register
4. You'll be automatically redirected to the dashboard

### Uploading Books

1. Click the "Upload Book" button in the header
2. Drag and drop a PDF file or click to browse
3. Optionally, add a cover image
4. Enter the book title and author name
5. Add a description (optional)
6. Click "Upload Book"

### Reading Books

1. Click on any book card to open the reader
2. Navigate using:
   - Left/Right arrow keys
   - Previous/Next buttons
   - Click on page edges
   - Page slider at the bottom
3. Your progress is automatically saved
4. Click the heart icon to favorite a book

### Managing Your Library

- **Search**: Use the search bar to find books by title or author
- **Filter**: Use the user dropdown to view:
  - My Books: Books you uploaded
  - Favorites: Your favorite books
- **View Toggle**: Switch between grid and list views

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Books
- `GET /api/books` - List all books (with optional search)
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Upload new book
- `DELETE /api/books/:id` - Delete a book

### Reading Progress
- `POST /api/progress` - Update reading progress
- `GET /api/progress/:bookId` - Get reading progress

### Favorites
- `POST /api/favorites/:bookId` - Toggle favorite
- `GET /api/favorites` - Get favorite books

### User Data
- `GET /api/my-books` - Get user's uploaded books
- `GET /api/stats` - Get user statistics

## Screenshots

### Login Page
Modern authentication interface with floating book decorations and smooth animations.

### Dashboard
Clean library view with:
- Statistics bar showing your reading activity
- Continue reading section for quick access
- Responsive book grid with hover effects
- Search bar and upload button

### Reader
Immersive reading experience with:
- Realistic page-flipping animations
- Auto-hiding header for distraction-free reading
- Page navigation controls
- Fullscreen mode

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- Session-based authentication
- SQL injection prevention using prepared statements
- File type validation for uploads
- Session cookie with httpOnly flag
- Protected routes with auth middleware

## Customization

### Styling
The application uses CSS variables for easy theming. Modify the `:root` section in `public/css/styles.css`:

```css
:root {
  --primary: #3B82F6;
  --accent: #D97706;
  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Crimson Text', serif;
  /* ... more variables */
}
```

### Adding Sample Books
The database is empty by default. Upload your own PDF books using the upload feature, or add sample data directly to the SQLite database.

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Ensure all dependencies are installed with `npm install`
- Check the console for error messages

### PDF won't load
- Verify the PDF file is valid and not corrupted
- Check that the file size is under 50MB
- Ensure the PDF is not password protected

### Session issues
- Clear browser cookies and cache
- Check that cookies are enabled in your browser
- Try logging out and logging back in

## Future Enhancements

Potential features for future versions:
- [ ] Book collections/folders
- [ ] Reading notes and highlights
- [ ] Dark mode
- [ ] Mobile app
- [ ] Cloud sync
- [ ] Social features (sharing, comments)
- [ ] Multiple file format support (EPUB, MOBI)
- [ ] Text-to-speech

## License

MIT License - Feel free to use and modify for your own projects.

## Credits

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Google Fonts](https://fonts.google.com) for typography
