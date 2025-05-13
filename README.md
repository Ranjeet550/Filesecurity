# Secure File Transfer Application

A web application for secure file transfer with password protection and location tracking.

## Features

- User authentication (login/register)
- Secure file upload with system-generated passwords
- Password-protected file downloads
- User location tracking for uploads and downloads
- User management system (admin only)
- Dashboard with file statistics

## Tech Stack

- **Frontend**: React, Vite, Ant Design
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local storage with password protection

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd secure-file-transfer
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in the server directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/secure-file-transfer
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
```

### 3. Set up the frontend

```bash
cd ../client
npm install
```

### 4. Create uploads directory

```bash
cd ../server
mkdir uploads
```

## Running the Application

### 1. Start the backend server

```bash
cd server
npm run dev
```

The server will run on http://localhost:5000

### 2. Start the frontend development server

```bash
cd ../client
npm run dev
```

The client will run on http://localhost:5173

## Usage

1. Register a new account or login with existing credentials
2. Upload files through the upload page
3. Share the generated password with the recipient
4. Recipients can download files using the provided link and password
5. Admins can manage users through the user management page

## Security Features

- Password protection for all uploaded files
- Secure file storage
- JWT authentication for users
- Location tracking for uploads and downloads
- Role-based access control

## License

MIT
