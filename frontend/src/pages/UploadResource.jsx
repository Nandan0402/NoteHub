import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import resourceService from '../services/resourceService';
import '../styles/resources.css';

const UploadResource = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        semester: '',
        resourceType: 'Notes',
        year: new Date().getFullYear(),
        description: '',
        tags: [],
        privacy: 'Private'
    });

    const [tagInput, setTagInput] = useState('');

    const resourceTypes = [
        'Notes',
        'Question Papers',
        'Solutions',
        'Project Reports',
        'Study Material'
    ];

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        // Validate file size (50MB)
        const maxSize = 50 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setError('File size exceeds 50MB limit');
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddTag = (e) => {
        e.preventDefault();
        if (tagInput.trim() && formData.tags.length < 10) {
            if (!formData.tags.includes(tagInput.trim().toLowerCase())) {
                setFormData({
                    ...formData,
                    tags: [...formData.tags, tagInput.trim().toLowerCase()]
                });
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setLoading(true);

        try {
            await resourceService.uploadResource(file, formData);
            setSuccess('Resource uploaded successfully!');

            // Reset form
            setFile(null);
            setFormData({
                title: '',
                subject: '',
                semester: '',
                resourceType: 'Notes',
                year: new Date().getFullYear(),
                description: '',
                tags: [],
                privacy: 'Private'
            });

            // Redirect to my resources after 2 seconds
            setTimeout(() => {
                navigate('/my-resources');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload resource');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="resource-page">
            <div className="resource-container">
                <div className="resource-header">
                    <h1 className="neon-text">Upload Resource</h1>
                    <p className="resource-subtitle">Share your study materials with the community</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} className="upload-form">
                    {/* File Upload Area */}
                    <div
                        className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'file-selected' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                        />

                        {!file ? (
                            <div className="upload-placeholder">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <p>Drag & drop your file here</p>
                                <p className="upload-hint">or click to browse</p>
                                <p className="upload-info">Supported: PDF, DOC, DOCX, PPT, PPTX, Images (max 50MB)</p>
                            </div>
                        ) : (
                            <div className="file-preview">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                    <polyline points="13 2 13 9 20 9" />
                                </svg>
                                <div className="file-info">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-size">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-remove-file"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Resource Metadata Form */}
                    <div className="form-grid">
                        <div className="input-group">
                            <label htmlFor="title" className="input-label">Resource Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className="input-field"
                                placeholder="e.g., Data Structures Mid-Term Notes"
                                value={formData.title}
                                onChange={handleChange}
                                minLength="3"
                                maxLength="200"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="subject" className="input-label">Subject/Course *</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                className="input-field"
                                placeholder="e.g., Data Structures and Algorithms"
                                value={formData.subject}
                                onChange={handleChange}
                                minLength="2"
                                maxLength="100"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="semester" className="input-label">Semester *</label>
                            <select
                                id="semester"
                                name="semester"
                                className="input-field"
                                value={formData.semester}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                                    <option key={sem} value={sem}>Semester {sem}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="resourceType" className="input-label">Resource Type *</label>
                            <select
                                id="resourceType"
                                name="resourceType"
                                className="input-field"
                                value={formData.resourceType}
                                onChange={handleChange}
                                required
                            >
                                {resourceTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="year" className="input-label">Year/Batch *</label>
                            <input
                                type="number"
                                id="year"
                                name="year"
                                className="input-field"
                                placeholder="e.g., 2024"
                                value={formData.year}
                                onChange={handleChange}
                                min="2000"
                                max={new Date().getFullYear() + 5}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Privacy Setting *</label>
                            <div className="privacy-options">
                                <label className="privacy-option">
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value="Private"
                                        checked={formData.privacy === 'Private'}
                                        onChange={handleChange}
                                    />
                                    <div className="privacy-option-content">
                                        <span className="privacy-icon">🔒</span>
                                        <div>
                                            <strong>Private</strong>
                                            <p>Only students from your college can access</p>
                                        </div>
                                    </div>
                                </label>
                                <label className="privacy-option">
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value="Public"
                                        checked={formData.privacy === 'Public'}
                                        onChange={handleChange}
                                    />
                                    <div className="privacy-option-content">
                                        <span className="privacy-icon">🌐</span>
                                        <div>
                                            <strong>Public</strong>
                                            <p>Students from any college can access</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="description" className="input-label">Description (Optional)</label>
                        <textarea
                            id="description"
                            name="description"
                            className="input-field"
                            placeholder="Add a brief description about this resource..."
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Tags/Keywords</label>
                        <div className="tags-input-container">
                            <div className="tags-display">
                                {formData.tags.map((tag, index) => (
                                    <span key={index} className="tag-pill">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="tag-remove"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="tag-input-wrapper">
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Add tag (e.g., arrays, recursion)"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddTag(e);
                                        }
                                    }}
                                    disabled={formData.tags.length >= 10}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="btn btn-secondary"
                                    disabled={!tagInput.trim() || formData.tags.length >= 10}
                                >
                                    Add Tag
                                </button>
                            </div>
                            <p className="tag-hint">{formData.tags.length}/10 tags</p>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/my-resources')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !file}
                        >
                            {loading ? 'Uploading...' : 'Upload Resource'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadResource;
