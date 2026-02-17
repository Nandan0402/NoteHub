import axios from 'axios';
import { auth } from '../firebase/config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token from Firebase
const getAuthToken = async () => {
    if (auth.currentUser) {
        return auth.currentUser.getIdToken();
    }
    return null;
};

// Create axios instance with auth header
const createAuthRequest = async () => {
    const token = await getAuthToken();
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

const resourceService = {
    /**
     * Upload a new resource with file
     * @param {File} file - The file to upload
     * @param {Object} metadata - Resource metadata
     * @returns {Promise<Object>} - Uploaded resource data
     */
    uploadResource: async (file, metadata) => {
        const config = await createAuthRequest();

        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('file', file);

        // Append metadata fields
        formData.append('title', metadata.title);
        formData.append('subject', metadata.subject);
        formData.append('semester', metadata.semester);
        formData.append('resource_type', metadata.resourceType);
        formData.append('year', metadata.year);

        if (metadata.description) {
            formData.append('description', metadata.description);
        }

        if (metadata.tags && metadata.tags.length > 0) {
            formData.append('tags', JSON.stringify(metadata.tags));
        }

        if (metadata.privacy) {
            formData.append('privacy', metadata.privacy);
        }

        const response = await axios.post(
            `${API_URL}/resources/upload`,
            formData,
            {
                ...config,
                headers: {
                    ...config.headers,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return response.data;
    },

    /**
     * Get all resources uploaded by the current user
     * @param {Object} filters - Optional filters (type, semester, search)
     * @returns {Promise<Array>} - List of resources
     */
    getMyResources: async (filters = {}) => {
        const config = await createAuthRequest();

        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.semester) params.append('semester', filters.semester);
        if (filters.search) params.append('search', filters.search);

        const response = await axios.get(
            `${API_URL}/resources/my-resources?${params.toString()}`,
            config
        );

        return response.data.resources;
    },

    /**
     * Get a single resource by ID
     * @param {string} resourceId - Resource ID
     * @returns {Promise<Object>} - Resource data
     */
    getResource: async (resourceId) => {
        const config = await createAuthRequest();
        const response = await axios.get(
            `${API_URL}/resources/${resourceId}`,
            config
        );
        return response.data.resource;
    },

    /**
     * Download a resource file
     * @param {string} resourceId - Resource ID
     * @param {string} fileName - File name for download
     */
    downloadResource: async (resourceId, fileName) => {
        const config = await createAuthRequest();
        const response = await axios.get(
            `${API_URL}/resources/download/${resourceId}`,
            {
                ...config,
                responseType: 'blob'
            }
        );

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Update resource metadata
     * @param {string} resourceId - Resource ID
     * @param {Object} metadata - Updated metadata
     * @returns {Promise<Object>} - Updated resource data
     */
    updateResource: async (resourceId, metadata) => {
        const config = await createAuthRequest();
        const response = await axios.put(
            `${API_URL}/resources/${resourceId}`,
            {
                title: metadata.title,
                subject: metadata.subject,
                semester: metadata.semester,
                resource_type: metadata.resourceType,
                year: metadata.year,
                description: metadata.description || '',
                tags: metadata.tags || [],
                privacy: metadata.privacy || 'Private'
            },
            config
        );
        return response.data;
    },

    /**
     * Delete a resource
     * @param {string} resourceId - Resource ID
     * @returns {Promise<Object>} - Delete confirmation
     */
    deleteResource: async (resourceId) => {
        const config = await createAuthRequest();
        const response = await axios.delete(
            `${API_URL}/resources/${resourceId}`,
            config
        );
        return response.data;
    },

    /**
     * Browse all accessible resources (public + private from same college)
     * @param {Object} filters - Optional filters (type, semester, subject, search)
     * @returns {Promise<Array>} - List of accessible resources
     */
    browseResources: async (filters = {}) => {
        const config = await createAuthRequest();

        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.semester) params.append('semester', filters.semester);
        if (filters.subject) params.append('subject', filters.subject);
        if (filters.search) params.append('search', filters.search);

        const response = await axios.get(
            `${API_URL}/resources/browse?${params.toString()}`,
            config
        );

        return response.data.resources;
    }
};

export default resourceService;
