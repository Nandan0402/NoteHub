import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import '../styles/profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        college: '',
        branch: '',
        semester: '',
        bio: '',
        profile_picture: ''
    });

    useEffect(() => {
        // Only load profile if user is authenticated
        if (user) {
            loadProfile();
        } else {
            // If no user, redirect to login
            setLoading(false);
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) {
            setError('Please login to view your profile');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(''); // Clear previous errors
        try {
            const response = await profileAPI.getProfile();
            if (response.exists) {
                setProfile(response.profile);
                setFormData(response.profile);
                setImagePreview(response.profile.profile_picture || '');
            } else {
                // New user, needs to create profile
                setIsEditing(true);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                // Profile doesn't exist, show form
                setIsEditing(true);
            } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError('Failed to load profile. Please try again.');
                console.error('Profile load error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setFormData({
                ...formData,
                profile_picture: base64String
            });
            setImagePreview(base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const isNewProfile = !profile;

            if (profile) {
                // Update existing profile
                await profileAPI.updateProfile(formData);
                setSuccess('Profile updated successfully!');
            } else {
                // Create new profile
                await profileAPI.createProfile(formData);
                setSuccess('Profile created successfully! Redirecting to upload...');
            }

            await loadProfile();
            setIsEditing(false);

            // Redirect to upload page for new profiles
            if (isNewProfile) {
                setTimeout(() => {
                    navigate('/upload');
                }, 1500);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            setError('Failed to logout');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card glass-strong neon-glow fade-in">
                <div className="profile-header">
                    <h1 className="neon-text">{isEditing ? (profile ? 'Edit Profile' : 'Create Profile') : 'My Profile'}</h1>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {!isEditing && profile ? (
                    <div className="profile-view fade-in">
                        <div className="profile-picture-container">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile" className="profile-picture neon-glow" />
                            ) : (
                                <div className="profile-picture-placeholder">
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                            )}
                        </div>

                        <div className="profile-info">
                            <div className="info-item">
                                <label>Name</label>
                                <p>{profile.name}</p>
                            </div>
                            <div className="info-item">
                                <label>Email</label>
                                <p>{profile.email}</p>
                            </div>
                            <div className="info-item">
                                <label>College/Institution</label>
                                <p>{profile.college}</p>
                            </div>
                            <div className="info-item">
                                <label>Branch/Department</label>
                                <p>{profile.branch}</p>
                            </div>
                            <div className="info-item">
                                <label>Semester/Year</label>
                                <p>{profile.semester}</p>
                            </div>
                            {profile.bio && (
                                <div className="info-item">
                                    <label>Bio</label>
                                    <p>{profile.bio}</p>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setIsEditing(true)} className="btn btn-primary w-full mt-2">
                            Edit Profile
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="profile-form fade-in">
                        <div className="profile-picture-upload">
                            <label className="upload-label">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="profile-picture neon-glow" />
                                ) : (
                                    <div className="profile-picture-placeholder glass">
                                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <p className="mt-1">Upload Photo</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        <div className="input-group">
                            <label htmlFor="name" className="input-label">Full Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="input-field"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="college" className="input-label">College/Institution *</label>
                            <input
                                type="text"
                                id="college"
                                name="college"
                                className="input-field"
                                placeholder="Enter your college name"
                                value={formData.college}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="branch" className="input-label">Branch/Department *</label>
                            <input
                                type="text"
                                id="branch"
                                name="branch"
                                className="input-field"
                                placeholder="e.g., Computer Science"
                                value={formData.branch}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="semester" className="input-label">Current Semester/Year *</label>
                            <select
                                id="semester"
                                name="semester"
                                className="input-field"
                                value={formData.semester}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                    <option key={sem} value={sem}>Semester {sem}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="bio" className="input-label">Bio (Optional)</label>
                            <textarea
                                id="bio"
                                name="bio"
                                className="input-field"
                                placeholder="Tell us about yourself..."
                                value={formData.bio}
                                onChange={handleChange}
                                maxLength={500}
                            />
                            <small className="char-count">{formData.bio.length}/500 characters</small>
                        </div>

                        <div className="button-group">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
                            </button>
                            {profile && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData(profile);
                                        setImagePreview(profile.profile_picture || '');
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;
