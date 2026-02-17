# NoteHub - User Authentication & Profile System

A full-stack web application featuring user authentication and profile management built with React, Python Flask, Firebase Authentication, and MongoDB.

## 🎨 Features

- **User Authentication**
  - Email/Password registration and login
  - Google OAuth sign-in
  - Password reset functionality
  - Session persistence

- **User Profiles**
  - Complete profile management (Create, Read, Update, Delete)
  - Profile picture upload (stored as base64 in MongoDB)
  - Required fields: Name, College, Branch, Semester
  - Optional fields: Bio, Profile Picture

- **Modern UI/UX**
  - Neon purple and black theme
  - Glassmorphism effects
  - Responsive design for mobile and desktop
  - Smooth animations and transitions

## 🛠️ Technology Stack

### Frontend
- React 18
- React Router for navigation
- Firebase Authentication (Client SDK)
- Axios for API calls
- Custom CSS with neon theme

### Backend
- Flask (Python)
- Firebase Admin SDK for token verification
- MongoDB for data storage
- CORS enabled for frontend communication

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB account (MongoDB Atlas recommended)
- Firebase project

## 🚀 Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google sign-in
4. Get your web config:
   - Project Settings > General > Your apps > Web app
   - Copy the Firebase configuration object
5. Generate Admin SDK credentials:
   - Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-admin-credentials.json` in the `backend` folder

### 2. MongoDB Setup

1. Create a MongoDB account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Whitelist your IP address

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env file and add your credentials:
# - MONGODB_URI (from MongoDB Atlas)
# - FIREBASE_CREDENTIALS_PATH (path to your Firebase Admin SDK JSON file)
# - SECRET_KEY (generate a random secret key)
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env file and add your Firebase web config:
# - REACT_APP_FIREBASE_API_KEY
# - REACT_APP_FIREBASE_AUTH_DOMAIN
# - REACT_APP_FIREBASE_PROJECT_ID
# - REACT_APP_FIREBASE_STORAGE_BUCKET
# - REACT_APP_FIREBASE_MESSAGING_SENDER_ID
# - REACT_APP_FIREBASE_APP_ID
```

## 🎯 Running the Application

### Start Backend Server

```bash
cd backend
python app.py
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

## 📱 Usage

1. **Registration**: 
   - Navigate to `/register`
   - Sign up with email/password or Google
   - You'll be redirected to create your profile

2. **Login**:
   - Navigate to `/login`
   - Sign in with your credentials
   - Use "Remember me" for persistent sessions

3. **Profile Management**:
   - After login, you'll see the profile page
   - Create your profile with required information
   - Upload a profile picture (optional)
   - Edit your profile anytime

## 🔒 Security Features

- Firebase Authentication for secure user management
- JWT token-based API authentication
- Password validation and encryption
- CORS protection
- Input sanitization and validation

## 📂 Project Structure

```
NoteHub/
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   └── profile.py
│   ├── app.py
│   ├── auth_middleware.py
│   ├── config.py
│   ├── models.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── firebase/
│   │   │   └── config.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── theme.css
│   │   │   ├── auth.css
│   │   │   └── profile.css
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🎨 Theme Customization

The application uses CSS custom properties for easy theme customization. Edit `frontend/src/styles/theme.css` to modify:
- Primary colors
- Background colors
- Spacing
- Border radius
- Transitions

## 🐛 Troubleshooting

**Backend won't start:**
- Ensure MongoDB connection string is correct
- Verify Firebase Admin SDK credentials file exists
- Check all environment variables are set

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check CORS settings in `backend/app.py`
- Verify API URL in frontend `.env` file

**Authentication errors:**
- Check Firebase project configuration
- Verify API keys are correct
- Ensure Firebase services are enabled

## 📄 API Endpoints

- `GET /api/health` - Health check
- `GET /api/profile` - Get current user profile (Protected)
- `POST /api/profile` - Create user profile (Protected)
- `PUT /api/profile` - Update user profile (Protected)
- `DELETE /api/profile` - Delete user profile (Protected)

## 🤝 Contributing

This is a demonstration project for educational purposes.

## 📝 License

This project is open source and available under the MIT License.
