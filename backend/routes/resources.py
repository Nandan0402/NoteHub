from flask import Blueprint, request, jsonify, send_file
from auth_middleware import verify_token as verify_firebase_token
from models import Resource
from services.storage_service import StorageService
from bson import ObjectId
from datetime import datetime
import io

# Create blueprint
resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')

# Global variables (will be initialized by init function)
db = None
storage_service = None

def init_resources_routes(database):
    """Initialize routes with database connection"""
    global db, storage_service
    db = database
    storage_service = StorageService(db)

@resources_bp.route('/upload', methods=['POST'])
@verify_firebase_token
def upload_resource():
    """Upload a new resource with file"""
    try:
        # Get the authenticated user from request
        uid = request.user['uid']
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get form data
        form_data = request.form.to_dict()
        
        # Parse tags from JSON string if provided
        import json
        if 'tags' in form_data and isinstance(form_data['tags'], str):
            try:
                form_data['tags'] = json.loads(form_data['tags'])
            except:
                form_data['tags'] = []
        
        # Validate resource metadata
        is_valid, error_msg = Resource.validate_resource_data(form_data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Validate file
        file_size = len(file.read())
        file.seek(0)  # Reset file pointer
        
        is_valid, error_msg = Resource.validate_file(
            file.filename,
            file_size,
            file.content_type
        )
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Upload file to GridFS
        file_id = storage_service.upload_file(file, metadata={
            'uid': uid,
            'uploaded_at': datetime.utcnow()
        })
        
        # Sanitize and prepare resource data
        resource_data = Resource.sanitize_resource_data(form_data)
        resource_data.update({
            'uid': uid,
            'file_id': str(file_id),
            'file_name': file.filename,
            'file_size': file_size,
            'file_type': file.content_type,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        # Save resource metadata to database
        result = db.resources.insert_one(resource_data)
        resource_data['_id'] = str(result.inserted_id)
        
        # Convert datetime objects to strings for JSON response
        resource_data['created_at'] = resource_data['created_at'].isoformat()
        resource_data['updated_at'] = resource_data['updated_at'].isoformat()
        
        return jsonify({
            'message': 'Resource uploaded successfully',
            'resource': resource_data
        }), 201
    
    except Exception as e:
        print(f"Error uploading resource: {e}")
        return jsonify({'error': 'Failed to upload resource'}), 500

@resources_bp.route('/my-resources', methods=['GET'])
@verify_firebase_token
def get_my_resources():
    """Get all resources uploaded by the authenticated user"""
    try:
        uid = request.user['uid']
        
        # Get query parameters for filtering
        resource_type = request.args.get('type')
        semester = request.args.get('semester')
        search = request.args.get('search')
        
        # Build query
        query = {'uid': uid}
        
        if resource_type:
            query['resource_type'] = resource_type
        
        if semester:
            query['semester'] = int(semester)
        
        if search:
            # Search in title, subject, and tags
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'subject': {'$regex': search, '$options': 'i'}},
                {'tags': {'$regex': search, '$options': 'i'}}
            ]
        
        # Fetch resources
        resources = list(db.resources.find(query).sort('created_at', -1))
        
        # Convert ObjectId and datetime to strings
        for resource in resources:
            resource['_id'] = str(resource['_id'])
            resource['created_at'] = resource['created_at'].isoformat()
            resource['updated_at'] = resource['updated_at'].isoformat()
        
        return jsonify({'resources': resources}), 200
    
    except Exception as e:
        print(f"Error fetching resources: {e}")
        return jsonify({'error': 'Failed to fetch resources'}), 500

@resources_bp.route('/<resource_id>', methods=['GET'])
@verify_firebase_token
def get_resource(resource_id):
    """Get a single resource by ID"""
    try:
        # Fetch resource
        resource = db.resources.find_one({'_id': ObjectId(resource_id)})
        
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Convert ObjectId and datetime to strings
        resource['_id'] = str(resource['_id'])
        resource['created_at'] = resource['created_at'].isoformat()
        resource['updated_at'] = resource['updated_at'].isoformat()
        
        return jsonify({'resource': resource}), 200
    
    except Exception as e:
        print(f"Error fetching resource: {e}")
        return jsonify({'error': 'Failed to fetch resource'}), 500

@resources_bp.route('/download/<resource_id>', methods=['GET'])
@verify_firebase_token
def download_resource(resource_id):
    """Download a resource file with access control"""
    try:
        uid = request.user['uid']
        
        # Fetch resource metadata
        resource = db.resources.find_one({'_id': ObjectId(resource_id)})
        
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Check access control for private resources
        if resource.get('privacy', 'Private') == 'Private':
            # Get current user's college
            current_user_profile = db.profiles.find_one({'uid': uid})
            if not current_user_profile:
                return jsonify({'error': 'User profile not found. Please complete your profile.'}), 403
            
            # Get uploader's college
            uploader_profile = db.profiles.find_one({'uid': resource['uid']})
            if not uploader_profile:
                return jsonify({'error': 'Resource uploader profile not found'}), 404
            
            # Compare colleges (case-insensitive)
            current_college = current_user_profile.get('college', '').strip().lower()
            uploader_college = uploader_profile.get('college', '').strip().lower()
            
            if current_college != uploader_college:
                return jsonify({
                    'error': 'Access denied. This is a private resource available only to students from the same college.'
                }), 403
        
        # Get file from GridFS
        file_data = storage_service.get_file(resource['file_id'])
        
        if not file_data:
            return jsonify({'error': 'File not found'}), 404
        
        # Stream file to client
        return send_file(
            io.BytesIO(file_data.read()),
            mimetype=resource['file_type'],
            as_attachment=True,
            download_name=resource['file_name']
        )
    
    except Exception as e:
        print(f"Error downloading resource: {e}")
        return jsonify({'error': 'Failed to download resource'}), 500

@resources_bp.route('/<resource_id>', methods=['PUT'])
@verify_firebase_token
def update_resource(resource_id):
    """Update resource metadata (only by owner)"""
    try:
        uid = request.user['uid']
        
        # Fetch existing resource
        resource = db.resources.find_one({'_id': ObjectId(resource_id)})
        
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Check ownership
        if resource['uid'] != uid:
            return jsonify({'error': 'Unauthorized to update this resource'}), 403
        
        # Get update data
        update_data = request.json
        
        # Validate updated data
        is_valid, error_msg = Resource.validate_resource_data(update_data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Sanitize update data
        sanitized_data = Resource.sanitize_resource_data(update_data)
        sanitized_data['updated_at'] = datetime.utcnow()
        
        # Update resource
        db.resources.update_one(
            {'_id': ObjectId(resource_id)},
            {'$set': sanitized_data}
        )
        
        # Fetch updated resource
        updated_resource = db.resources.find_one({'_id': ObjectId(resource_id)})
        updated_resource['_id'] = str(updated_resource['_id'])
        updated_resource['created_at'] = updated_resource['created_at'].isoformat()
        updated_resource['updated_at'] = updated_resource['updated_at'].isoformat()
        
        return jsonify({
            'message': 'Resource updated successfully',
            'resource': updated_resource
        }), 200
    
    except Exception as e:
        print(f"Error updating resource: {e}")
        return jsonify({'error': 'Failed to update resource'}), 500

@resources_bp.route('/browse', methods=['GET'])
@verify_firebase_token
def browse_resources():
    """Browse all accessible resources (public + private from same college)"""
    try:
        uid = request.user['uid']
        
        # Get current user's college
        current_user_profile = db.profiles.find_one({'uid': uid})
        if not current_user_profile:
            return jsonify({'error': 'User profile not found. Please complete your profile to browse resources.'}), 403
        
        current_college = current_user_profile.get('college', '').strip().lower()
        
        # Get query parameters for filtering
        resource_type = request.args.get('type')
        semester = request.args.get('semester')
        subject = request.args.get('subject')
        search = request.args.get('search')
        
        # Build query for public resources OR private resources from same college
        # First, get all UIDs from the same college
        same_college_profiles = db.profiles.find({
            'college': {'$regex': f'^{current_college}$', '$options': 'i'}
        })
        same_college_uids = [profile['uid'] for profile in same_college_profiles]
        
        # Build base query
        query = {
            '$or': [
                {'privacy': 'Public'},
                {'privacy': 'Private', 'uid': {'$in': same_college_uids}}
            ]
        }
        
        # Add filters
        if resource_type:
            query['resource_type'] = resource_type
        
        if semester:
            query['semester'] = int(semester)
        
        if subject:
            query['subject'] = {'$regex': subject, '$options': 'i'}
        
        if search:
            # Remove the existing $or if present
            base_or = query.pop('$or')
            # Search in title, subject, and tags with privacy filter
            query['$and'] = [
                {'$or': base_or},
                {
                    '$or': [
                        {'title': {'$regex': search, '$options': 'i'}},
                        {'subject': {'$regex': search, '$options': 'i'}},
                        {'tags': {'$regex': search, '$options': 'i'}}
                    ]
                }
            ]
        
        # Fetch resources
        resources = list(db.resources.find(query).sort('created_at', -1))
        
        # Enrich resources with uploader information
        for resource in resources:
            resource['_id'] = str(resource['_id'])
            resource['created_at'] = resource['created_at'].isoformat()
            resource['updated_at'] = resource['updated_at'].isoformat()
            
            # Get uploader profile
            uploader_profile = db.profiles.find_one({'uid': resource['uid']})
            if uploader_profile:
                resource['uploader_name'] = uploader_profile.get('name', 'Anonymous')
                resource['uploader_college'] = uploader_profile.get('college', 'Unknown')
            else:
                resource['uploader_name'] = 'Anonymous'
                resource['uploader_college'] = 'Unknown'
        
        return jsonify({'resources': resources}), 200
    
    except Exception as e:
        print(f"Error browsing resources: {e}")
        return jsonify({'error': 'Failed to browse resources'}), 500

@resources_bp.route('/<resource_id>', methods=['DELETE'])
@verify_firebase_token
def delete_resource(resource_id):
    """Delete a resource (only by owner)"""
    try:
        uid = request.user['uid']
        
        # Fetch existing resource
        resource = db.resources.find_one({'_id': ObjectId(resource_id)})
        
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Check ownership
        if resource['uid'] != uid:
            return jsonify({'error': 'Unauthorized to delete this resource'}), 403
        
        # Delete file from GridFS
        storage_service.delete_file(resource['file_id'])
        
        # Delete resource from database
        db.resources.delete_one({'_id': ObjectId(resource_id)})
        
        return jsonify({'message': 'Resource deleted successfully'}), 200
    
    except Exception as e:
        print(f"Error deleting resource: {e}")
        return jsonify({'error': 'Failed to delete resource'}), 500
