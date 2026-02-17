from flask import Blueprint, request, jsonify, send_file
from auth_middleware import verify_token as verify_firebase_token
from auth_middleware import verify_token as verify_firebase_token
from models import Resource, Review
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
        uid = request.uid
        
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
        
        # Get user profile to add branch and college info
        user_profile = db.profiles.find_one({'uid': uid})
        branch = user_profile.get('branch', 'General') if user_profile else 'General'
        college = user_profile.get('college', 'Unknown') if user_profile else 'Unknown'
        
        # Sanitize and prepare resource data
        resource_data = Resource.sanitize_resource_data(form_data)
        resource_data.update({
            'uid': uid,
            'branch': branch,
            'college': college,
            'file_id': str(file_id),
            'file_name': file.filename,
            'file_size': file_size,
            'file_type': file.content_type,
            'views': 0,
            'downloads': 0,
            'ratings': [],
            'avg_rating': 0.0,
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
        uid = request.uid
        
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
            # Ensure new fields exist for display
            resource['views'] = resource.get('views', 0)
            resource['downloads'] = resource.get('downloads', 0)
            resource['avg_rating'] = resource.get('avg_rating', 0.0)
        
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
            
        # Increment views
        db.resources.update_one(
            {'_id': ObjectId(resource_id)},
            {'$inc': {'views': 1}}
        )
        resource['views'] = resource.get('views', 0) + 1
        
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
        uid = request.uid
        
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
        
        # Increment download count
        db.resources.update_one(
            {'_id': ObjectId(resource_id)},
            {'$inc': {'downloads': 1}}
        )
        
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

@resources_bp.route('/view/<resource_id>', methods=['GET'])
@verify_firebase_token
def view_resource(resource_id):
    """View a resource file inline with access control"""
    try:
        uid = request.uid
        
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
        
        # Increment view count
        db.resources.update_one(
            {'_id': ObjectId(resource_id)},
            {'$inc': {'views': 1}}
        )
        
        # Get file from GridFS
        file_data = storage_service.get_file(resource['file_id'])
        
        if not file_data:
            return jsonify({'error': 'File not found'}), 404
        
        # Stream file to client
        return send_file(
            io.BytesIO(file_data.read()),
            mimetype=resource['file_type'],
            as_attachment=False,
            download_name=resource['file_name']
        )
    
    except Exception as e:
        print(f"Error viewing resource: {e}")
        return jsonify({'error': 'Failed to view resource'}), 500

@resources_bp.route('/<resource_id>', methods=['PUT'])
@verify_firebase_token
def update_resource(resource_id):
    """Update resource metadata (only by owner)"""
    try:
        uid = request.uid
        
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
        uid = request.uid
        
        # Get current user's college
        current_user_profile = db.profiles.find_one({'uid': uid})
        if not current_user_profile:
            return jsonify({'error': 'User profile not found. Please complete your profile to browse resources.'}), 403
        
        current_college = current_user_profile.get('college', '').strip().lower()
        
        # Get query parameters for filtering
        resource_type = request.args.get('type')
        semester = request.args.get('semester')
        subject = request.args.get('subject')
        branch = request.args.get('branch')
        year = request.args.get('year')
        privacy = request.args.get('privacy')
        search = request.args.get('search')
        sort_by = request.args.get('sort', 'latest') # latest, popular, rated
        
        # Build query for accessible resources
        # Query logic: 
        # (Public OR (Private AND Same College)) AND (Filters)
        
        # Base Accessibility Query
        # To optimize, we find same college UIDs only if we are browsing private or all
        
        # Base Accessibility Query
        # Optimized to use the 'college' field directly on resources
        
        if privacy == 'Public':
            access_query = {'privacy': 'Public'}
        elif privacy == 'Private':
            # Private resources are only visible if they belong to the same college
            access_query = {
                'privacy': 'Private', 
                'college': {'$regex': f'^{current_college}$', '$options': 'i'}
            }
        else:
            # All accessible: Public OR (Private AND Same College)
            access_query = {
                '$or': [
                    {'privacy': 'Public'},
                    {
                        'privacy': 'Private',
                        'college': {'$regex': f'^{current_college}$', '$options': 'i'}
                    }
                ]
            }
        
        # Start constructing the final query
        # If we have a complex search or existing $or from access_query, we need to be careful with $and
        
        filters = {}
        if resource_type:
            filters['resource_type'] = resource_type
        if semester:
            filters['semester'] = int(semester)
        if subject:
            filters['subject'] = {'$regex': subject, '$options': 'i'}
        if branch:
            filters['branch'] = branch
        if year:
            filters['year'] = int(year)
            
        # Search query
        search_query = {}
        if search:
            search_query = {
                '$or': [
                    {'title': {'$regex': search, '$options': 'i'}},
                    {'subject': {'$regex': search, '$options': 'i'}},
                    {'tags': {'$regex': search, '$options': 'i'}},
                    {'branch': {'$regex': search, '$options': 'i'}}
                ]
            }
            
        # Combine all parts
        # If access_query uses $or, search_query uses $or, we need to wrap them in an $and
        
        final_query = {'$and': []}
        final_query['$and'].append(access_query)
        if filters:
            final_query['$and'].append(filters)
        if search_query:
            final_query['$and'].append(search_query)
            
        # Optimization: if $and has only one element, unwrap it. 
        # But for safety and simplicity, keeping it wrapped is fine for MongoDB.
        if not filters and not search_query:
             # Just access query
             final_query = access_query
        
        # Sorting
        sort_order = [('created_at', -1)] # Default latest
        if sort_by == 'popular':
            sort_order = [('downloads', -1), ('views', -1)]
        elif sort_by == 'rated':
            sort_order = [('avg_rating', -1), ('created_at', -1)]
        
        # Fetch resources
        resources = list(db.resources.find(final_query).sort(sort_order))
        
        # Enrich resources with uploader information
        for resource in resources:
            resource['_id'] = str(resource['_id'])
            resource['created_at'] = resource['created_at'].isoformat()
            resource['updated_at'] = resource['updated_at'].isoformat()
            resource['views'] = resource.get('views', 0)
            resource['downloads'] = resource.get('downloads', 0)
            resource['avg_rating'] = resource.get('avg_rating', 0.0)
            
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

@resources_bp.route('/<resource_id>/reviews', methods=['POST'])
@verify_firebase_token
def add_review(resource_id):
    """Add or update a review for a resource"""
    try:
        uid = request.uid
        data = request.json
        
        # Get user profile for name
        user_profile = db.profiles.find_one({'uid': uid})
        user_name = user_profile.get('name', 'Anonymous') if user_profile else 'Anonymous'
        
        # Validate review data
        is_valid, error_msg = Review.validate_review_data(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
            
        current_time = datetime.utcnow()
        
        # Check if resource exists
        resource = db.resources.find_one({'_id': ObjectId(resource_id)})
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
            
        # Check if user already reviewed
        existing_review = db.reviews.find_one({
            'resource_id': str(resource_id),
            'uid': uid
        })
        
        review_data = {
            'resource_id': str(resource_id),
            'uid': uid,
            'user_name': user_name,
            'rating': float(data['rating']),
            'comment': data.get('comment', '').strip(),
            'updated_at': current_time
        }
        
        if existing_review:
            # Update existing review
            db.reviews.update_one(
                {'_id': existing_review['_id']},
                {'$set': review_data}
            )
        else:
            # Create new review
            review_data['created_at'] = current_time
            db.reviews.insert_one(review_data)
            
        # Recalculate average rating for resource
        pipeline = [
            {'$match': {'resource_id': str(resource_id)}},
            {'$group': {
                '_id': '$resource_id',
                'avg_rating': {'$avg': '$rating'},
                'count': {'$sum': 1}
            }}
        ]
        
        stats = list(db.reviews.aggregate(pipeline))
        
        new_avg = 0.0
        review_count = 0
        if stats:
            new_avg = stats[0]['avg_rating']
            review_count = stats[0]['count']
            
        # Update resource stats
        db.resources.update_one(
            {'_id': ObjectId(resource_id)},
            {'$set': {
                'avg_rating': new_avg,
                'review_count': review_count
            }}
        )
        
        return jsonify({
            'message': 'Review submitted successfully',
            'avg_rating': new_avg,
            'review_count': review_count,
            'review': review_data
        }), 200
        
    except Exception as e:
        print(f"Error adding review: {e}")
        return jsonify({'error': f'Failed to submit review: {str(e)}'}), 500

@resources_bp.route('/<resource_id>/reviews', methods=['GET'])
@verify_firebase_token
def get_reviews(resource_id):
    """Get all reviews for a resource"""
    try:
        reviews = list(db.reviews.find({'resource_id': resource_id}).sort('updated_at', -1))
        
        for review in reviews:
            review['_id'] = str(review['_id'])
            review['created_at'] = review['created_at'].isoformat()
            review['updated_at'] = review['updated_at'].isoformat()
            
        return jsonify({'reviews': reviews}), 200
        
    except Exception as e:
        print(f"Error fetching reviews: {e}")
        return jsonify({'error': 'Failed to fetch reviews'}), 500



@resources_bp.route('/<resource_id>', methods=['DELETE'])
@verify_firebase_token
def delete_resource(resource_id):
    """Delete a resource (only by owner)"""
    try:
        uid = request.uid
        
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
