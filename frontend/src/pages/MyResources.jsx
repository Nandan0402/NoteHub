import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import resourceService from '../services/resourceService';
import '../styles/resources.css';

const MyResources = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [editingResource, setEditingResource] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const resourceTypes = [
        'Notes',
        'Question Papers',
        'Solutions',
        'Project Reports',
        'Study Material'
    ];

    useEffect(() => {
        fetchResources();
    }, [filterType, filterSemester, searchTerm]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const filters = {
                type: filterType,
                semester: filterSemester,
                search: searchTerm
            };
            const data = await resourceService.getMyResources(filters);
            setResources(data);
            setError('');
        } catch (err) {
            setError('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (resource) => {
        try {
            await resourceService.downloadResource(resource._id, resource.file_name);
        } catch (err) {
            setError('Failed to download file');
        }
    };

    const handleDelete = async (resourceId) => {
        try {
            await resourceService.deleteResource(resourceId);
            setResources(resources.filter(r => r._id !== resourceId));
            setDeleteConfirm(null);
            setError('');
        } catch (err) {
            setError('Failed to delete resource');
        }
    };

    const handleUpdate = async (resourceId, updatedData) => {
        try {
            await resourceService.updateResource(resourceId, updatedData);
            await fetchResources();
            setEditingResource(null);
            setError('');
        } catch (err) {
            setError('Failed to update resource');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return '📄';
        if (['doc', 'docx'].includes(ext)) return '📝';
        if (['ppt', 'pptx'].includes(ext)) return '📊';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
        return '📁';
    };

    return (
        <div className="resource-page">
            <div className="resource-container wide">
                <div className="resource-header">
                    <div>
                        <h1 className="neon-text">My Resources</h1>
                        <p className="resource-subtitle">Manage your uploaded study materials</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/upload')}
                    >
                        + Upload Resource
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Filters */}
                <div className="filters-container glass">
                    <div className="filter-group">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by title, subject, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <select
                            className="input-field"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {resourceTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <select
                            className="input-field"
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                        >
                            <option value="">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Resources Grid */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading resources...</p>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="empty-state glass">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                            <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <h3>No resources found</h3>
                        <p>Upload your first resource to get started!</p>
                        <button
                            className="btn btn-primary mt-2"
                            onClick={() => navigate('/upload')}
                        >
                            Upload Resource
                        </button>
                    </div>
                ) : (
                    <div className="resources-grid">
                        {resources.map(resource => (
                            <div key={resource._id} className="resource-card glass neon-glow">
                                <div className="resource-card-header">
                                    <span className="file-icon">{getFileIcon(resource.file_name)}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span className="resource-type-badge">{resource.resource_type}</span>
                                        <span className={`privacy-badge ${resource.privacy === 'Public' ? 'public' : 'private'}`}>
                                            <span className="privacy-badge-icon">{resource.privacy === 'Public' ? '🌐' : '🔒'}</span>
                                            {resource.privacy || 'Private'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="resource-title">{resource.title}</h3>
                                <p className="resource-subject">{resource.subject}</p>

                                <div className="resource-meta">
                                    <span>📚 Semester {resource.semester}</span>
                                    <span>📅 {resource.year}</span>
                                </div>

                                {resource.description && (
                                    <p className="resource-description">{resource.description}</p>
                                )}

                                {resource.tags && resource.tags.length > 0 && (
                                    <div className="resource-tags">
                                        {resource.tags.map((tag, index) => (
                                            <span key={index} className="tag-pill small">{tag}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="resource-footer">
                                    <div className="resource-info">
                                        <span className="file-size">{formatFileSize(resource.file_size)}</span>
                                        <span className="upload-date">{formatDate(resource.created_at)}</span>
                                    </div>

                                    <div className="resource-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleDownload(resource)}
                                            title="Download"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => setEditingResource(resource)}
                                            title="Edit"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => setDeleteConfirm(resource)}
                                            title="Delete"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingResource && (
                <EditResourceModal
                    resource={editingResource}
                    onClose={() => setEditingResource(null)}
                    onSave={handleUpdate}
                    resourceTypes={resourceTypes}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal glass-strong neon-glow" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Resource?</h3>
                        <p>Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDelete(deleteConfirm._id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Edit Resource Modal Component
const EditResourceModal = ({ resource, onClose, onSave, resourceTypes }) => {
    const [formData, setFormData] = useState({
        title: resource.title,
        subject: resource.subject,
        semester: resource.semester,
        resourceType: resource.resource_type,
        year: resource.year,
        description: resource.description || '',
        tags: resource.tags || [],
        privacy: resource.privacy || 'Private'
    });

    const [tagInput, setTagInput] = useState('');

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(resource._id, formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal glass-strong neon-glow" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Resource</h3>
                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="input-group">
                        <label className="input-label">Title</label>
                        <input
                            type="text"
                            name="title"
                            className="input-field"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Subject</label>
                        <input
                            type="text"
                            name="subject"
                            className="input-field"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">Semester</label>
                            <select
                                name="semester"
                                className="input-field"
                                value={formData.semester}
                                onChange={handleChange}
                                required
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                                    <option key={sem} value={sem}>Semester {sem}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Type</label>
                            <select
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
                            <label className="input-label">Year</label>
                            <input
                                type="number"
                                name="year"
                                className="input-field"
                                value={formData.year}
                                onChange={handleChange}
                                min="2000"
                                max={new Date().getFullYear() + 5}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Privacy Setting</label>
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
                                        <p>Only students from your college</p>
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
                                        <p>Students from any college</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea
                            name="description"
                            className="input-field"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Tags</label>
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
                                placeholder="Add tag"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddTag(e);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="btn btn-secondary"
                                disabled={!tagInput.trim() || formData.tags.length >= 10}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyResources;
