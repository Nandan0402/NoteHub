import React from 'react';
import '../styles/FileViewerModal.css';

const FileViewerModal = ({ isOpen, onClose, fileUrl, resource }) => {
    if (!isOpen || !resource) return null;

    const isPdf = resource.file_type === 'application/pdf';
    const isImage = resource.file_type.startsWith('image/');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content viewer-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h3>{resource.title}</h3>
                <div className="viewer-body">
                    {isPdf ? (
                        <iframe src={fileUrl} title={resource.title} width="100%" height="600px" />
                    ) : isImage ? (
                        <img src={fileUrl} alt={resource.title} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }} />
                    ) : (
                        <div className="viewer-fallback">
                            <p>This file type cannot be previewed.</p>
                            <a href={fileUrl} download={resource.file_name} className="btn btn-primary">Download File</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileViewerModal;
