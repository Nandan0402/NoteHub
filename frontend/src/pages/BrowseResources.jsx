import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import resourceService from '../services/resourceService';
import '../styles/resources.css';

const BrowseResources = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    const resourceTypes = [
        'Notes',
        'Question Papers',
        'Solutions',
        'Project Reports',
        'Study Material'
    ];

    useEffect(() => {
        fetchResources();
    }, [filterType, filterSemester, filterSubject, searchTerm]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const filters = {
                type: filterType,
                semester: filterSemester,
                subject: filterSubject,
                search: searchTerm
            };
            const data = await resourceService.browseResources(filters);
            setResources(data);
            setError('');
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Please complete your profile to browse resources');
            } else {
                setError('Failed to load resources');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (resource) => {
        try {
            setError('');
            await resourceService.downloadResource(resource._id, resource.file_name);
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Access denied. This private resource is only available to students from ' + resource.uploader_college);
            } else {
                setError('Failed to download file');
            }
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
                        <h1 className="neon-text">Browse Resources</h1>
                        <p className="resource-subtitle">Discover and download study materials from the community</p>
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
                        <p>Try adjusting your filters or be the first to upload!</p>
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
                                        <span style={{ fontWeight: '600', color: 'var(--primary-purple)' }}>
                                            {resource.uploader_name}
                                        </span>
                                        <span style={{ fontSize: '0.75rem' }}>
                                            {resource.uploader_college}
                                        </span>
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseResources;
