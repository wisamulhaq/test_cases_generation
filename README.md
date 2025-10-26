# Biruni.AI Test Cases Generator

An AI-powered test case generation system with Google authentication, MongoDB user management, and community guidelines enforcement.
<img width="1699" height="982" alt="image" src="https://github.com/user-attachments/assets/4f1d42a7-2b32-4e33-a41c-1cc5ec6a2903" />
<img width="337" height="982" alt="image" src="https://github.com/user-attachments/assets/0f3af44b-cbbc-42b4-85c2-6f36a33bc4ec" />
<img width="1699" height="918" alt="image" src="https://github.com/user-attachments/assets/d82cec02-a3a8-4b7f-8936-7f5be14379ce" />




## 🎯 About

This application provides an intelligent test case generation system powered by Google's Gemini AI. Users can generate comprehensive test cases from requirements text or uploaded images, with built-in safety controls and user management.

## ✨ Features

- **AI-Powered Test Case Generation**: Generate test cases from requirements using Google Gemini AI
- **Image-Based Generation**: Generate test cases from uploaded screenshots/images
- **Google OAuth2 Authentication**: Secure login using Google accounts
- **User Management**: MongoDB-based user data and violation tracking
- **Community Guidelines**: 2-strike system with automatic user blocking
- **Query Optimizer**: AI-powered sidebar for query enhancement
- **Human Feedback**: Iterative improvement system for test case refinement

## 🛠️ Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Google OAuth2, JWT
- **AI**: Google Gemini AI
- **Storage**: Local file uploads

## 📁 Project Structure

```
test_cases_generation/
├── .env                          # Environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # Root package with all dependencies
├── README.md                     # Documentation
├── backend/
│   ├── package.json             # Minimal backend config
│   ├── server.js                # Main server file
│   ├── auth/
│   │   └── googleAuth.js        # Google OAuth2 & JWT handling
│   ├── database/
│   │   ├── mongodb.js           # Database connection
│   │   └── userManager.js       # User CRUD operations
│   ├── main/
│   │   └── main.js              # Main workflow orchestration
│   └── tools/                   # AI tools and utilities
│       ├── formatter.js
│       ├── humanFeedback.js
│       ├── intent.js
│       ├── languageCheck.js
│       ├── optimizer.js
│       ├── reviewer.js
│       ├── safetyGuardrails.js
│       ├── testCasesGeneration.js
│       └── testCasesGenerationByImage.js
├── frontend/
│   ├── package.json             # Minimal frontend config
│   ├── public/
│   │   └── index.html           # HTML template
│   └── src/
│       ├── App.js               # Main application component
│       ├── LoginPage.js         # Google Sign-In page
│       ├── BlockedUserPage.js   # User blocking interface
│       ├── QueryOptimizerPanel.js # Query enhancement sidebar
│       ├── index.css            # Styling
│       └── index.js             # React entry point
└── uploads/                     # Image upload directory
```

## 📦 Installation

```bash
# Install all dependencies
npm install
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Google API Key for Gemini AI
GOOGLE_API=your_google_api_key_here

# MongoDB Connection URL
MONGODB_URL=mongodb://localhost:27017/testcases_db

# Google OAuth2 Client Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 🚀 How to Run

### Run Both Backend and Frontend Together
```bash
npm run dev
```
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### Run Backend Only
```bash
npm run backend
```
- Server: `http://localhost:5000`

### Run Frontend Only
```bash
npm run frontend
```
- App: `http://localhost:3000`

---

**Built with ❤️ using React, Node.js, MongoDB, and Google Gemini AI**
