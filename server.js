const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Get environment variable for session secret
const sessionSecret = process.env.SESSION_SECRET || 'openleaf-secret-key-2024';

// Ensure directories exist
const dirs = ['public/uploads/books', 'public/uploads/covers', 'sessions'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Initialize Database
const db = new Database(path.join(__dirname, 'library.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    cover_path TEXT,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reading_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER DEFAULT 0,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE(user_id, book_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE(user_id, book_id)
  );
`);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, 'public/uploads/books/');
    } else {
      cb(null, 'public/uploads/covers/');
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: 'sessions' }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Routes

// Serve main app
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve reader
app.get('/read/:id', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/?redirect=' + req.params.id);
  }
  res.sendFile(path.join(__dirname, 'public', 'reader.html'));
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, passwordHash);

    req.session.userId = result.lastInsertRowid;
    req.session.username = username;

    res.json({ success: true, user: { id: result.lastInsertRowid, username, email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// Book Routes
app.get('/api/books', requireAuth, (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT b.*, u.username as uploader,
        COALESCE(rp.current_page, 1) as current_page,
        COALESCE(rp.total_pages, 0) as total_pages,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ? AND book_id = b.id) as is_favorite
      FROM books b
      LEFT JOIN users u ON b.uploaded_by = u.id
      LEFT JOIN reading_progress rp ON rp.user_id = ? AND rp.book_id = b.id
    `;
    
    const params = [req.session.userId, req.session.userId];
    
    if (search) {
      query += ' WHERE b.title LIKE ? OR b.author LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const books = db.prepare(query).all(...params);
    res.json({ books });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/books/:id', requireAuth, (req, res) => {
  try {
    const book = db.prepare(`
      SELECT b.*, u.username as uploader,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ? AND book_id = b.id) as is_favorite
      FROM books b
      LEFT JOIN users u ON b.uploaded_by = u.id
      WHERE b.id = ?
    `).get(req.session.userId, req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get reading progress
    const progress = db.prepare('SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?')
      .get(req.session.userId, req.params.id);

    res.json({ book, progress });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

app.post('/api/books', requireAuth, upload.fields([
  { name: 'book', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, author, description } = req.body;

    if (!title || !author || !req.files['book']) {
      return res.status(400).json({ error: 'Title, author, and book file are required' });
    }

    const bookFile = req.files['book'][0];
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

    // Use default cover if none provided
    let coverPath = '/lib/default-cover.svg';
    if (coverFile) {
      coverPath = `/uploads/covers/${coverFile.filename}`;
    }

    const result = db.prepare(`
      INSERT INTO books (title, author, description, file_path, cover_path, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, author, description || '', `/uploads/books/${bookFile.filename}`, coverPath, req.session.userId);

    res.json({ 
      success: true, 
      book: { 
        id: result.lastInsertRowid, 
        title, 
        author, 
        file_path: `/uploads/books/${bookFile.filename}`,
        cover_path: coverPath
      }
    });
  } catch (error) {
    console.error('Upload book error:', error);
    res.status(500).json({ error: 'Failed to upload book' });
  }
});

app.delete('/api/books/:id', requireAuth, (req, res) => {
  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.uploaded_by !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this book' });
    }

    // Delete files
    const bookPath = path.join(__dirname, 'public', book.file_path);
    if (fs.existsSync(bookPath)) {
      fs.unlinkSync(bookPath);
    }

    if (book.cover_path && !book.cover_path.includes('default-cover')) {
      const coverPath = path.join(__dirname, 'public', book.cover_path);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    // Delete from database
    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Reading Progress
app.post('/api/progress', requireAuth, (req, res) => {
  try {
    const { bookId, currentPage, totalPages } = req.body;

    db.prepare(`
      INSERT OR REPLACE INTO reading_progress (user_id, book_id, current_page, total_pages, last_accessed)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(req.session.userId, bookId, currentPage || 1, totalPages || 0);

    res.json({ success: true });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

app.get('/api/progress/:bookId', requireAuth, (req, res) => {
  try {
    const progress = db.prepare('SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?')
      .get(req.session.userId, req.params.bookId);

    res.json({ progress: progress || { current_page: 1, total_pages: 0 } });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Favorites
app.post('/api/favorites/:bookId', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND book_id = ?')
      .get(req.session.userId, req.params.bookId);

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND book_id = ?')
        .run(req.session.userId, req.params.bookId);
      res.json({ favorited: false });
    } else {
      db.prepare('INSERT INTO favorites (user_id, book_id) VALUES (?, ?)')
        .run(req.session.userId, req.params.bookId);
      res.json({ favorited: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

app.get('/api/favorites', requireAuth, (req, res) => {
  try {
    const books = db.prepare(`
      SELECT b.*, u.username as uploader,
        COALESCE(rp.current_page, 1) as current_page,
        COALESCE(rp.total_pages, 0) as total_pages
      FROM books b
      LEFT JOIN users u ON b.uploaded_by = u.id
      LEFT JOIN reading_progress rp ON rp.user_id = ? AND rp.book_id = b.id
      INNER JOIN favorites f ON f.book_id = b.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.session.userId, req.session.userId);

    res.json({ books });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get user's uploaded books
app.get('/api/my-books', requireAuth, (req, res) => {
  try {
    const books = db.prepare(`
      SELECT b.*, 
        COALESCE(rp.current_page, 1) as current_page,
        COALESCE(rp.total_pages, 0) as total_pages
      FROM books b
      LEFT JOIN reading_progress rp ON rp.user_id = ? AND rp.book_id = b.id
      WHERE b.uploaded_by = ?
      ORDER BY b.created_at DESC
    `).all(req.session.userId, req.session.userId);

    res.json({ books });
  } catch (error) {
    console.error('Get my books error:', error);
    res.status(500).json({ error: 'Failed to fetch your books' });
  }
});

// Stats
app.get('/api/stats', requireAuth, (req, res) => {
  try {
    const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
    const myBooks = db.prepare('SELECT COUNT(*) as count FROM books WHERE uploaded_by = ?')
      .get(req.session.userId).count;
    const favoritesCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?')
      .get(req.session.userId).count;
    const booksRead = db.prepare('SELECT COUNT(DISTINCT book_id) as count FROM reading_progress WHERE user_id = ? AND total_pages > 0')
      .get(req.session.userId).count;

    res.json({
      stats: {
        totalBooks,
        myBooks,
        favoritesCount,
        booksRead
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenLeaf Reader running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server accessible on port: ${PORT}`);
});
