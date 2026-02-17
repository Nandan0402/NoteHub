import React, { useState } from 'react';

const StarRating = ({ rating, onChange, readOnly = false, size = 'md' }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const stars = [1, 2, 3, 4, 5];
    const getSize = () => {
        switch (size) {
            case 'sm': return '1rem';
            case 'lg': return '2rem';
            default: return '1.5rem';
        }
    };

    const handleMouseEnter = (star) => {
        if (!readOnly) setHoverRating(star);
    };

    const handleMouseLeave = () => {
        if (!readOnly) setHoverRating(0);
    };

    const handleClick = (star) => {
        if (!readOnly && onChange) onChange(star);
    };

    return (
        <div className="star-rating" style={{ display: 'inline-flex', gap: '2px' }}>
            {stars.map((star) => (
                <span
                    key={star}
                    className="star"
                    style={{
                        cursor: readOnly ? 'default' : 'pointer',
                        fontSize: getSize(),
                        color: (hoverRating || rating) >= star ? '#ffd700' : '#444',
                        transition: 'color 0.2s ease, transform 0.1s ease',
                        textShadow: (hoverRating || rating) >= star ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                    }}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default StarRating;
