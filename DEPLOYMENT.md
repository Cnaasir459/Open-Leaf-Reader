# OpenLeaf Reader Deployment Configuration

## Quick Deploy Options

### Option 1: Render.com (Recommended - Free Tier Available)

1. **Push to GitHub**
   ```bash
   cd /workspace/openleaf-reader
   git init
   git add .
   git commit -m "OpenLeaf Reader - Digital Library"
   # Push to your GitHub repository
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com) and sign up
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**: Add `PORT` with value `10000`
   - Click "Create Web Service"

3. **Your app will be available at**: `https://your-app-name.onrender.com`

---

### Option 2: Railway.app (Simplest Deployment)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variable**
   ```bash
   railway variables set PORT=10000
   ```

4. **Your app URL**: Provided by Railway after deployment

---

### Option 3: Coolify (Self-Hosted Alternative)

1. **Install Coolify** on your server
   - Follow: [coolify.io/docs](https://coolify.io/docs)

2. **Create New Project**
   - Type: Node.js
   - Repository: Your GitHub repo
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: `3000`

---

### Option 4: DigitalOcean App Platform

1. **Push code to GitHub**

2. **Create App on DigitalOcean**
   - Connect GitHub repository
   - Choose Node.js framework
   - Configure build and start commands
   - Set port environment variable

---

## Environment Variables

Required for production:

```bash
PORT=3000                    # Application port
NODE_ENV=production         # Set to production
SESSION_SECRET=your-secret  # Change this for security
```

Optional:

```bash
# Database (using SQLite by default)
DATABASE_URL=path/to/library.db

# File upload limits
MAX_FILE_SIZE=52428800      # 50MB in bytes
```

---

## Production Checklist

- [ ] Change `SESSION_SECRET` in server.js or environment
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper port (usually 80 or 443 for HTTPS)
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure file upload directory permissions
- [ ] Set up regular database backups
- [ ] Monitor application logs
- [ ] Configure proper CORS settings if needed
- [ ] Set up rate limiting for production

---

## Files Required for Deployment

```
openleaf-reader/
├── server.js              # Main application
├── package.json           # Dependencies
├── README.md             # Documentation
├── sessions/             # Session storage (auto-created)
├── uploads/              # File uploads (auto-created)
│   ├── books/
│   └── covers/
└── public/               # Static files
    ├── index.html
    ├── dashboard.html
    ├── reader.html
    ├── css/
    ├── js/
    └── lib/
```

---

## Troubleshooting

### Application won't start
- Check if port is available
- Ensure all dependencies are installed: `npm install`
- Check logs for errors: `npm start`

### Database issues
- Ensure `sessions/` directory is writable
- Check file permissions: `chmod 755 sessions/ uploads/`

### File upload errors
- Verify `uploads/books/` and `uploads/covers/` directories exist
- Check directory permissions: `chmod 755 uploads/`
- Verify `MAX_FILE_SIZE` in multer configuration

### Session problems
- Ensure session directory is writable
- Check `SESSION_SECRET` is set and secure
- Verify cookies are enabled in browser

---

## Performance Optimization

For production deployment:

1. **Use PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

2. **Enable compression**
   ```bash
   npm install compression
   ```

3. **Add rate limiting**
   ```bash
   npm install express-rate-limit
   ```

4. **Use reverse proxy** (Nginx/Apache)

---

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Ensure all directories have proper permissions
4. Confirm Node.js version compatibility (18+)

---

## Deployment Status

✅ **Application Ready**
- All dependencies installed
- Database schema created
- Static files configured
- Ready for deployment to any Node.js hosting platform

Current Status: Running locally on port 3000
