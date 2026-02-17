import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { Search, Upload, FileText, User, School, BookOpen } from 'lucide-react';
import '../styles/dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            const response = await profileAPI.getProfile();
            if (response.exists) {
                setProfile(response.profile);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container fade-in">
            {/* precise-ui-glass-card */}
            <div className="dashboard-header glass-strong neon-glow">
                <div className="header-content">
                    <h1>Welcome back, <span className="neon-text">{profile?.name || 'Student'}</span>!</h1>
                    <p className="college-name">
                        <School className="icon-sm" />
                        {profile?.college || 'Your College'}
                    </p>
                </div>
                <div className="header-actions">
                    <button onClick={() => navigate('/upload')} className="btn btn-primary neon-box-shadow">
                        <Upload className="icon-sm" />
                        Upload Resource
                    </button>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* User Details Card */}
                <div className="dashboard-card glass">
                    <div className="card-header">
                        <User className="icon-md neon-icon" />
                        <h2>Your Profile</h2>
                    </div>
                    <div className="card-content">
                        <div className="info-row">
                            <span className="label">Branch:</span>
                            <span className="value">{profile?.branch || '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Semester:</span>
                            <span className="value">{profile?.semester || '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Email:</span>
                            <span className="value">{profile?.email || user?.email}</span>
                        </div>
                        <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm mt-3">
                            View Full Profile
                        </button>
                    </div>
                </div>

                {/* Quick Search Card */}
                <div className="dashboard-card glass">
                    <div className="card-header">
                        <Search className="icon-md neon-icon" />
                        <h2>Find Resources</h2>
                    </div>
                    <div className="card-content">
                        <p className="mb-3">Search for notes, papers, and more.</p>
                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="text"
                                placeholder="Search by title, subject..."
                                className="input-field"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary mt-2 w-full">Search</button>
                        </form>
                    </div>
                </div>

                {/* Quick Actions / Stats */}
                <div className="dashboard-card glass">
                    <div className="card-header">
                        <BookOpen className="icon-md neon-icon" />
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="card-content actions-grid">
                        <button onClick={() => navigate('/my-resources')} className="action-btn">
                            <FileText className="icon-sm" />
                            My Uploads
                        </button>
                        <button onClick={() => navigate('/browse')} className="action-btn">
                            <Search className="icon-sm" />
                            Browse All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
