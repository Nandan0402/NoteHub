from flask import Blueprint, request, jsonify
from auth_middleware import verify_token, get_current_user
from models import UserProfile
from datetime import datetime

profile_bp = Blueprint('profile', __name__)

# This will be injected by app.py
db = None

def init_profile_routes(database):
    """Initialize routes with database connection"""
    global db
    db = database

@profile_bp.route('/api/profile', methods=['GET'])
@verify_token
def get_profile():
    """Get current user's profile"""
    try:
        user = get_current_user()
        
        # Find profile in database
        profile_data = db.profiles.find_one({'uid': user['uid']})
        
        if not profile_data:
            return jsonify({'error': 'Profile not found', 'exists': False}), 404
        
        # Remove MongoDB _id from response
        profile_data.pop('_id', None)
        
        return jsonify({
            'success': True,
            'profile': profile_data,
            'exists': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500

@profile_bp.route('/api/profile', methods=['POST'])
@verify_token
def create_profile():
    """Create a new user profile"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if profile already exists
        existing_profile = db.profiles.find_one({'uid': user['uid']})
        if existing_profile:
            return jsonify({'error': 'Profile already exists. Use PUT to update.'}), 400
        
        # Sanitize data
        sanitized_data = UserProfile.sanitize_profile_data(data)
        
        # Validate data
        is_valid, error_message = UserProfile.validate_profile_data(sanitized_data)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Add user information
        sanitized_data['uid'] = user['uid']
        sanitized_data['email'] = user['email']
        
        # Create profile object
        profile = UserProfile(sanitized_data)
        
        # Save to database
        result = db.profiles.insert_one(profile.to_dict())
        
        # Get the created profile
        created_profile = db.profiles.find_one({'_id': result.inserted_id})
        created_profile.pop('_id', None)
        
        return jsonify({
            'success': True,
            'message': 'Profile created successfully',
            'profile': created_profile
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create profile: {str(e)}'}), 500

@profile_bp.route('/api/profile', methods=['PUT'])
@verify_token
def update_profile():
    """Update existing user profile"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check if profile exists
        existing_profile = db.profiles.find_one({'uid': user['uid']})
        if not existing_profile:
            return jsonify({'error': 'Profile not found. Use POST to create.'}), 404
        
        # Sanitize data
        sanitized_data = UserProfile.sanitize_profile_data(data)
        
        # Validate data
        is_valid, error_message = UserProfile.validate_profile_data(sanitized_data)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Update timestamp
        sanitized_data['updated_at'] = datetime.utcnow()
        
        # Update in database
        db.profiles.update_one(
            {'uid': user['uid']},
            {'$set': sanitized_data}
        )
        
        # Get updated profile
        updated_profile = db.profiles.find_one({'uid': user['uid']})
        updated_profile.pop('_id', None)
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': updated_profile
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@profile_bp.route('/api/profile', methods=['DELETE'])
@verify_token
def delete_profile():
    """Delete user profile"""
    try:
        user = get_current_user()
        
        # Delete profile
        result = db.profiles.delete_one({'uid': user['uid']})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Profile not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Profile deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete profile: {str(e)}'}), 500
