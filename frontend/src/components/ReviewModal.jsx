import React, { useState, useEffect } from 'react';
import resourceService from '../services/resourceService';
import StarRating from './StarRating';
import '../styles/resources.css'; // Reusing existing styles or add specific ones

const ReviewModal = ({ isOpen, onClose, resource, onReviewSubmitted }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && resource) {
            fetchReviews();
            // Reset form
            setUserRating(0);
            setUserComment('');
            setError('');
        }
    }, [isOpen, resource]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const data = await resourceService.getReviews(resource._id);
            setReviews(data);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userRating === 0) {
            setError('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            const response = await resourceService.addReview(resource._id, {
                rating: userRating,
                comment: userComment
            });

            // Refresh reviews
            fetchReviews();
            if (onReviewSubmitted) {
                onReviewSubmitted(response.avg_rating, response.review_count);
            }
            alert('Review submitted successfully!');
            // Optional: Close modal or stay to see your review in list
        } catch (err) {
            console.error(err);
            setError('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <h2 className="neon-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Reviews: {resource.title}</h2>

                <div style={{ padding: '0 1rem', marginBottom: '1rem', flexShrink: 0 }}>
                    <div className="glass" style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Write a Review</h4>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <StarRating rating={userRating} onChange={setUserRating} size="lg" />
                            </div>
                            <textarea
                                className="input-field"
                                placeholder="Share your thoughts..."
                                value={userComment}
                                onChange={(e) => setUserComment(e.target.value)}
                                rows="3"
                                style={{ width: '100%', resize: 'none', marginBottom: '0.5rem' }}
                            />
                            {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', margin: '0.5rem 0' }}>{error}</p>}
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Post Review'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="reviews-list" style={{ overflowY: 'auto', padding: '0 1rem 1rem 1rem', flexGrow: 1 }}>
                    {loading ? (
                        <p>Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <p style={{ color: '#aaa', textAlign: 'center' }}>No reviews yet. Be the first!</p>
                    ) : (
                        reviews.map(review => (
                            <div key={review._id} className="review-item glass" style={{ marginBottom: '0.8rem', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--primary-purple)' }}>{review.user_name}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                        {new Date(review.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <StarRating rating={review.rating} readOnly size="sm" />
                                {review.comment && (
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: '#ddd' }}>{review.comment}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
