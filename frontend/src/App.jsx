import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UploadResource from './pages/UploadResource';
import MyResources from './pages/MyResources';
import BrowseResources from './pages/BrowseResources';
import Navbar from './components/Navbar';
import './styles/theme.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App">
                    <Navbar />
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/upload"
                            element={
                                <ProtectedRoute>
                                    <UploadResource />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-resources"
                            element={
                                <ProtectedRoute>
                                    <MyResources />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/browse"
                            element={
                                <ProtectedRoute>
                                    <BrowseResources />
                                </ProtectedRoute>
                            }
                        />

                        {/* Default Route - Redirect to profile if logged in, otherwise to login */}
                        <Route path="/" element={<Navigate to="/upload" replace />} />

                        {/* 404 - Redirect to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
