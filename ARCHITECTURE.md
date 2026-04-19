# Project Architecture Documentation

## Directory Structure

```
d:\DBMS\
├── main.py                    # FastAPI application entry point (port 8000)
├── database.py               # SQLAlchemy database configuration
├── models.py                 # ORM models (User, Post, Comment, etc.)
├── schemas.py                # Pydantic request/response schemas
├── index.html                # HTML frontend (root fallback)
├── index.combined.html       # Combined HTML version (backup)
├── style.css                 # Primary stylesheet (root, also in static/)
├── style.next.css           # Alternative stylesheet (root, also in static/)
├── abc.js                    # Frontend JavaScript (root, also in static/)
├── create_admin.py           # Admin user creation script
├── simple_admin.py           # Simple admin interface
├── CSS_ENHANCEMENTS.md      # CSS documentation
├── ARCHITECTURE.md           # This file
│
├── static/                   # 📁 ORGANIZED STATIC FILES
│   ├── index.html           # HTML frontend
│   ├── abc.js              # Frontend JavaScript (94.8 KB)
│   ├── style.css           # Primary stylesheet (49.7 KB)
│   ├── style.next.css      # Alternative stylesheet (30.7 KB)
│   └── Images/
│       └── MYPHOTO.jpeg.jpeg # Creator profile image
│
├── routers/                  # API endpoint modules
│   ├── __init__.py          # Router imports (includes all 9 routers)
│   ├── auth.py             # Authentication endpoints
│   ├── users.py            # User management endpoints
│   ├── posts.py            # Post management endpoints
│   ├── comments.py         # Comment management endpoints
│   ├── follows.py          # Follow relationship endpoints
│   ├── messages.py         # Direct message endpoints
│   ├── notifications.py    # Notification endpoints
│   ├── ai.py               # AI/ML analysis & recommendations
│   └── nsfw.py             # Content moderation endpoints
│
├── Images/                   # Legacy image directory (root level)
│   └── MYPHOTO.jpeg.jpeg    # Also copied to static/Images/
│
└── Social-Media-Platform/   # 📁 DUPLICATE DIRECTORY (can be removed)
    ├── Models/
    ├── routers/
    └── ...other duplicates...
```

## How Static Files Are Served

### Configuration in main.py:
- Static folder is mounted at `/static` prefix
- All routes check both `static/` folder AND root directory for backward compatibility
- This allows files in both locations to work without conflicts

### Static File Routes:
1. **HTML**: `GET /` → serves index.html from static/ or root
2. **CSS**: `GET /static/style.css` → serves style.css 
3. **CSS**: `GET /static/style.next.css` → serves style.next.css
4. **JS**: `GET /static/abc.js` → serves abc.js
5. **Images**: `GET /static/Images/{filename}` → serves images with correct MIME types
6. **Favicon**: `GET /favicon.ico` → serves favicon if it exists

### File Resolution Priority (in code):
```
static/filename → root/filename → 404 error
```

## API Endpoints

### Base URL: `http://localhost:8000`

**Authentication**: `/api/auth`
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/refresh` - Refresh token

**Users**: `/api/users`
- GET `/api/users/{user_id}` - Get user profile
- PUT `/api/users/{user_id}` - Update profile
- GET `/api/users/{user_id}/posts` - Get user posts

**Posts**: `/api/posts`
- POST `/api/posts` - Create post
- GET `/api/posts` - Get feed
- GET `/api/posts/{post_id}` - Get post details
- DELETE `/api/posts/{post_id}` - Delete post

**Comments**: `/api/comments`
- POST `/api/comments` - Add comment
- GET `/api/comments/{post_id}` - Get post comments
- DELETE `/api/comments/{comment_id}` - Delete comment

**Follows**: `/api/follows`
- POST `/api/follows` - Follow user
- DELETE `/api/follows/{user_id}` - Unfollow user

**Messages**: `/api/messages`
- POST `/api/messages` - Send DM
- GET `/api/messages/{user_id}` - Get conversation
- GET `/api/messages` - Get all conversations

**Notifications**: `/api/notifications`
- GET `/api/notifications` - Get user notifications
- DELETE `/api/notifications/{notification_id}` - Mark as read

**AI Analysis**: `/api/ai`
- POST `/api/ai/analyze` - Analyze content (sentiment, engagement, etc.)
- POST `/api/ai/recommend` - Get recommendations
- POST `/api/ai/chat` - AI chatbot

**Content Moderation**: `/api/nsfw`
- POST `/api/nsfw/analyze` - Analyze for inappropriate content

## Database

- **Type**: SQLite (development)
- **Location**: `connect_hub.db`
- **ORM**: SQLAlchemy
- **Models**:
  - User (authentication, profile)
  - Post (status updates)
  - Comment (post comments)
  - Like (post/comment likes)
  - Follow (user relationships)
  - Notification (activity notifications)
  - DirectMessage (private messages)
  - email (email tracking)

## Frontend Features

The index.html includes:
- Landing page with hero section
- Creator spotlight
- Post composer with AI insights
- AI Studio panel (draft analysis, recommendations)
- Feed with category filtering
- Multiple modal dialogs:
  - Authentication
  - User profile
  - Comments view
  - Notifications
  - Settings
  - Direct messages
  - NSFW content viewer
  - AI chatbot

## AI/ML Engine (routers/ai.py)

Features:
- **Content Analysis**: Sentiment detection, engagement prediction
- **Tokenization**: Breaking down text into meaningful units
- **Keyword Extraction**: Identifying important terms
- **Vectorization**: Converting text to numerical representations
- **Category Detection**: Auto-categorizing posts
- **User Profiling**: Building interest profiles
- **Recommendations**: Suggesting content based on interests

## Recent Changes

### File Organization (Latest):
✅ Created `/static` folder with proper structure
✅ Copied all static files (CSS, JS, HTML, Images) to static/
✅ Updated main.py routes to serve from both static/ and root
✅ Maintained backward compatibility with root-level files

### Code Fixes:
✅ Fixed 11 SQLAlchemy type errors in ai.py
✅ Implemented proper MIME type handling
✅ Connected all 9 routers to main application
✅ Configured CORS for all origins

## File Sizes

| File | Size |
|------|------|
| abc.js | 94.8 KB |
| style.css | 49.7 KB |
| style.next.css | 30.7 KB |
| index.html | 25.9 KB |
| MYPHOTO.jpeg.jpeg | 189.4 KB |

## Running the Application

```bash
# Start the FastAPI server
python main.py

# Server will be available at: http://localhost:8000
# Swagger documentation: http://localhost:8000/docs
# ReDoc documentation: http://localhost:8000/redoc
```

## Development Notes

- Remove the `Social-Media-Platform/` duplicate directory when ready
- Keep both root-level and static/ copies of files for backward compatibility
- All new static files should be added to the `/static` folder
- Frontend references use `/static/` prefix for all assets
- Backend serves static files with automatic MIME type detection

## Important Paths

- **Static assets prefix**: `/static/`
- **API base prefix**: `/api/`
- **Database file**: `./connect_hub.db`
- **Root path**: `/` (serves index.html)
