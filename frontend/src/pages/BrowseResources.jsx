import React, { useState, useEffect } from 'react'; // Verified update
import { useNavigate } from 'react-router-dom';
import resourceService from '../services/resourceService';
import FileViewerModal from '../components/FileViewerModal';
import ReviewModal from '../components/ReviewModal';
import '../styles/resources.css';

const BrowseResources = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showViewer, setShowViewer] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [currentReviewResource, setCurrentReviewResource] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterPrivacy, setFilterPrivacy] = useState('');
    const [sortBy, setSortBy] = useState('latest');

    const resourceTypes = [
        'Notes',
        'Question Papers',
        'Solutions',
        'Project Reports',
        'Study Material'
    ];

    const branches = [
        { value: 'CSE', label: 'Computer Science & Engineering (CSE)' },
        { value: 'ECE', label: 'Electronics & Communication (ECE)' },
        { value: 'ME', label: 'Mechanical Engineering (ME)' },
        { value: 'CE', label: 'Civil Engineering (CE)' },
        { value: 'EE', label: 'Electrical Engineering (EE)' },
        { value: 'IT', label: 'Information Technology (IT)' },
        { value: 'AIDS', label: 'AI & Data Science' },
        { value: 'General', label: 'Other / General' }
    ];
    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i + 1); // Current year + 1 down to past 5 years

    useEffect(() => {
        fetchResources();
    }, [filterType, filterSemester, filterSubject, filterBranch, filterYear, filterPrivacy, sortBy, searchTerm]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const filters = {
                type: filterType,
                semester: filterSemester,
                subject: filterSubject,
                branch: filterBranch,
                year: filterYear,
                privacy: filterPrivacy,
                sort: sortBy,
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



    const handleView = async (resource) => {
        try {
            setError('');
            // Optimistic view count update
            setResources(prev => prev.map(r =>
                r._id === resource._id ? { ...r, views: (r.views || 0) + 1 } : r
            ));

            const fileBlob = await resourceService.viewResource(resource._id);
            const fileUrl = window.URL.createObjectURL(fileBlob);

            setCurrentFile({
                url: fileUrl,
                resource: resource
            });
            setShowViewer(true);
        } catch (err) {
            console.error("View error:", err);
            if (err.response?.status === 403) {
                setError('Access denied. This private resource is only available to students from ' + resource.uploader_college);
            } else {
                setError('Failed to view file. It might not be available.');
            }
        }
    };

    const handleDownload = async (resource) => {
        try {
            setError('');
            await resourceService.downloadResource(resource._id, resource.file_name);
            // Refresh logic could be added here to update download count locally
            // But strict consistency isn't critical, so we can skip or optimistically update
            setResources(prev => prev.map(r =>
                r._id === resource._id ? { ...r, downloads: (r.downloads || 0) + 1 } : r
            ));
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Access denied. This private resource is only available to students from ' + resource.uploader_college);
            } else {
                setError('Failed to download file');
            }
        }
    };

    const handleRate = (resource) => {
        setCurrentReviewResource(resource);
        setShowReviewModal(true);
    };

    const handleReviewSubmitted = (newAvgRating, newReviewCount) => {
        setResources(prev => prev.map(r =>
            r._id === currentReviewResource._id
                ? { ...r, avg_rating: newAvgRating, review_count: newReviewCount }
                : r
        ));
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
                    <div className="filter-row">
                        <div className="filter-group search-group">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search by title, subject, tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <select
                                className="input-field"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="latest">Latest Uploads</option>
                                <option value="popular">Most Popular</option>
                                <option value="rated">Highest Rated</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-row">
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
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                            >
                                <option value="">All Branches</option>
                                {branches.map(branch => (
                                    <option key={branch.value} value={branch.value}>{branch.label}</option>
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
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                                    <option key={sem} value={sem}>Semester {sem}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <select
                                className="input-field"
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                            >
                                <option value="">All Years</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <select
                                className="input-field"
                                value={filterPrivacy}
                                onChange={(e) => setFilterPrivacy(e.target.value)}
                            >
                                <option value="">All Privacy</option>
                                <option value="Public">Public</option>
                                <option value="Private">Private</option>
                            </select>
                        </div>
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
                                <p className="resource-subject">{resource.subject} • {resource.branch || 'General'}</p>

                                <div className="resource-meta">
                                    <span>📚 Sem {resource.semester}</span>
                                    <span>📅 {resource.year}</span>
                                </div>

                                <div className="resource-stats" style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#ccc', margin: '0.5rem 0' }}>
                                    <span title="Views">👁️ {resource.views || 0}</span>
                                    <span title="Downloads">⬇️ {resource.downloads || 0}</span>
                                    <span title="Rating">⭐ {resource.avg_rating ? resource.avg_rating.toFixed(1) : '0.0'} ({resource.review_count || 0})</span>
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
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleView(resource)}
                                            style={{ marginRight: '8px' }}
                                        >
                                            View
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleRate(resource)}
                                            title="Rate"
                                        >
                                            ⭐
                                        </button>
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
                {currentFile && (
                    <FileViewerModal
                        isOpen={showViewer}
                        onClose={() => {
                            setShowViewer(false);
                            if (currentFile.url) {
                                window.URL.revokeObjectURL(currentFile.url);
                            }
                            setCurrentFile(null);
                        }}
                        fileUrl={currentFile.url}
                        resource={currentFile.resource}
                    />
                )}

                {currentReviewResource && (
                    <ReviewModal
                        isOpen={showReviewModal}
                        onClose={() => {
                            setShowReviewModal(false);
                            setCurrentReviewResource(null);
                        }}
                        resource={currentReviewResource}
                        onReviewSubmitted={handleReviewSubmitted}
                    />
                )}
            </div>
        </div>
    );
};

export default BrowseResources;
