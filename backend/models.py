from datetime import datetime
from typing import Optional, Dict, Any, List
from bson import ObjectId
from config import Config

class UserProfile:
    """User Profile Model for MongoDB"""
    
    def __init__(self, user_data: Dict[str, Any]):
        """Initialize user profile from dictionary"""
        self.uid = user_data.get('uid')
        self.email = user_data.get('email')
        self.name = user_data.get('name')
        self.college = user_data.get('college')
        self.branch = user_data.get('branch')
        self.semester = user_data.get('semester')
        self.profile_picture = user_data.get('profile_picture', '')  # Base64 encoded string
        self.bio = user_data.get('bio', '')
        self.created_at = user_data.get('created_at', datetime.utcnow())
        self.updated_at = user_data.get('updated_at', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to dictionary for MongoDB storage"""
        return {
            'uid': self.uid,
            'email': self.email,
            'name': self.name,
            'college': self.college,
            'branch': self.branch,
            'semester': self.semester,
            'profile_picture': self.profile_picture,
            'bio': self.bio,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def validate_profile_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate profile data
        Returns: (is_valid, error_message)
        """
        required_fields = ['name', 'college', 'branch', 'semester']
        
        # Check required fields
        for field in required_fields:
            if field not in data or not data[field]:
                return False, f"Missing required field: {field}"
        
        # Validate name
        if len(data['name']) < 2 or len(data['name']) > 100:
            return False, "Name must be between 2 and 100 characters"
        
        # Validate college
        if len(data['college']) < 2 or len(data['college']) > 200:
            return False, "College name must be between 2 and 200 characters"
        
        # Validate branch
        if len(data['branch']) < 2 or len(data['branch']) > 100:
            return False, "Branch must be between 2 and 100 characters"
        
        # Validate semester
        try:
            semester = int(data['semester'])
            if semester < 1 or semester > 12:
                return False, "Semester must be between 1 and 12"
        except (ValueError, TypeError):
            return False, "Semester must be a valid number"
        
        # Validate bio (optional)
        if 'bio' in data and data['bio']:
            if len(data['bio']) > 500:
                return False, "Bio must not exceed 500 characters"
        
        # Validate profile picture (optional)
        if 'profile_picture' in data and data['profile_picture']:
            # Check if it's a base64 string
            if not data['profile_picture'].startswith('data:image/'):
                return False, "Profile picture must be a valid base64 encoded image"
            
            # Rough size check (base64 is ~1.37x larger than binary)
            if len(data['profile_picture']) > Config.MAX_PROFILE_PICTURE_SIZE:
                return False, f"Profile picture size exceeds maximum allowed size of {Config.MAX_PROFILE_PICTURE_SIZE / (1024 * 1024)}MB"
        
        return True, None
    
    @staticmethod
    def sanitize_profile_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize and clean profile data"""
        sanitized = {}
        
        # Copy only allowed fields
        allowed_fields = ['name', 'college', 'branch', 'semester', 'bio', 'profile_picture']
        for field in allowed_fields:
            if field in data:
                if field == 'semester':
                    sanitized[field] = int(data[field])
                else:
                    sanitized[field] = str(data[field]).strip()
        
        return sanitized


class Resource:
    """Resource Model for MongoDB - Academic resources with file storage"""
    
    RESOURCE_TYPES = [
        'Notes',
        'Question Papers',
        'Solutions',
        'Project Reports',
        'Study Material'
    ]
    
    PRIVACY_OPTIONS = ['Public', 'Private']
    
    def __init__(self, resource_data: Dict[str, Any]):
        """Initialize resource from dictionary"""
        self.uid = resource_data.get('uid')  # Owner's Firebase UID
        self.title = resource_data.get('title')
        self.subject = resource_data.get('subject')
        self.semester = resource_data.get('semester')
        self.semester = resource_data.get('semester')
        self.branch = resource_data.get('branch', 'General') # Branch/Department
        self.college = resource_data.get('college', 'Unknown') # College name
        self.resource_type = resource_data.get('resource_type')
        self.year = resource_data.get('year')
        self.description = resource_data.get('description', '')
        self.tags = resource_data.get('tags', [])  # List of keywords/tags
        self.privacy = resource_data.get('privacy', 'Private')  # Privacy setting: Public or Private
        
        # Stats
        self.views = resource_data.get('views', 0)
        self.downloads = resource_data.get('downloads', 0)
        self.ratings = resource_data.get('ratings', []) # List of {uid, rating, timestamp}
        self.avg_rating = resource_data.get('avg_rating', 0.0)
        
        # File metadata
        self.file_id = resource_data.get('file_id')  # GridFS file ID
        self.file_name = resource_data.get('file_name')
        self.file_size = resource_data.get('file_size')
        self.file_type = resource_data.get('file_type')
        
        # Timestamps
        self.created_at = resource_data.get('created_at', datetime.utcnow())
        self.updated_at = resource_data.get('updated_at', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert resource to dictionary for MongoDB storage"""
        return {
            'uid': self.uid,
            'title': self.title,
            'subject': self.subject,
            'semester': self.semester,
            'semester': self.semester,
            'branch': self.branch,
            'college': self.college,
            'resource_type': self.resource_type,
            'year': self.year,
            'description': self.description,
            'tags': self.tags,
            'privacy': self.privacy,
            'views': self.views,
            'downloads': self.downloads,
            'ratings': self.ratings,
            'avg_rating': self.avg_rating,
            'file_id': self.file_id,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def validate_resource_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate resource data
        Returns: (is_valid, error_message)
        """
        # Check required fields
        required_fields = ['title', 'subject', 'semester', 'resource_type', 'year']
        
        for field in required_fields:
            if field not in data or not data[field]:
                return False, f"Missing required field: {field}"
        
        # Validate title
        if len(data['title']) < 3 or len(data['title']) > 200:
            return False, "Title must be between 3 and 200 characters"
        
        # Validate subject
        if len(data['subject']) < 2 or len(data['subject']) > 100:
            return False, "Subject must be between 2 and 100 characters"
        
        # Validate semester
        try:
            semester = int(data['semester'])
            if semester < 1 or semester > 12:
                return False, "Semester must be between 1 and 12"
        except (ValueError, TypeError):
            return False, "Semester must be a valid number"
        
        # Validate resource type
        if data['resource_type'] not in Resource.RESOURCE_TYPES:
            return False, f"Resource type must be one of: {', '.join(Resource.RESOURCE_TYPES)}"
        
        # Validate year
        try:
            year = int(data['year'])
            current_year = datetime.now().year
            if year < 2000 or year > current_year + 5:
                return False, f"Year must be between 2000 and {current_year + 5}"
        except (ValueError, TypeError):
            return False, "Year must be a valid number"
        
        # Validate description (optional)
        if 'description' in data and data['description']:
            if len(data['description']) > 1000:
                return False, "Description must not exceed 1000 characters"
        
        # Validate tags (optional)
        if 'tags' in data and data['tags']:
            if not isinstance(data['tags'], list):
                return False, "Tags must be a list"
            if len(data['tags']) > 10:
                return False, "Maximum 10 tags allowed"
            for tag in data['tags']:
                if not isinstance(tag, str) or len(tag) > 50:
                    return False, "Each tag must be a string with max 50 characters"
        
        # Validate privacy (optional, defaults to Private)
        if 'privacy' in data and data['privacy']:
            if data['privacy'] not in Resource.PRIVACY_OPTIONS:
                return False, f"Privacy must be one of: {', '.join(Resource.PRIVACY_OPTIONS)}"
        
        return True, None
    
    @staticmethod
    def validate_file(file_name: str, file_size: int, file_type: str) -> tuple[bool, Optional[str]]:
        """
        Validate uploaded file
        Returns: (is_valid, error_message)
        """
        # Check file size
        if file_size > Config.MAX_FILE_SIZE:
            max_size_mb = Config.MAX_FILE_SIZE / (1024 * 1024)
            return False, f"File size exceeds maximum allowed size of {max_size_mb}MB"
        
        # Check file type
        if file_type not in Config.ALLOWED_FILE_TYPES and not any(
            file_name.lower().endswith(ext) for ext in Config.ALLOWED_FILE_EXTENSIONS
        ):
            return False, f"File type not allowed. Allowed types: {', '.join(Config.ALLOWED_FILE_EXTENSIONS)}"
        
        return True, None
    
    @staticmethod
    def sanitize_resource_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize and clean resource data"""
        sanitized = {}
        
        # Copy only allowed fields
        allowed_fields = ['title', 'subject', 'semester', 'branch', 'college', 'resource_type', 'year', 'description', 'tags', 'privacy']
        for field in allowed_fields:
            if field in data:
                if field == 'semester' or field == 'year':
                    sanitized[field] = int(data[field])
                elif field == 'tags':
                    # Clean and deduplicate tags
                    tags = data[field] if isinstance(data[field], list) else []
                    sanitized[field] = list(set([str(tag).strip().lower() for tag in tags if tag]))
                elif field == 'privacy':
                    # Ensure privacy is valid, default to Private
                    privacy_value = str(data[field]).strip() if field in data else 'Private'
                    sanitized[field] = privacy_value if privacy_value in Resource.PRIVACY_OPTIONS else 'Private'
                else:
                    sanitized[field] = str(data[field]).strip()
        
        # Ensure privacy field always exists with default value
        if 'privacy' not in sanitized:
            sanitized['privacy'] = 'Private'
        
        return sanitized


class Review:
    """Review Model for MongoDB - Resource ratings and comments"""
    
    def __init__(self, review_data: Dict[str, Any]):
        """Initialize review from dictionary"""
        self.resource_id = review_data.get('resource_id')
        self.uid = review_data.get('uid')
        self.user_name = review_data.get('user_name', 'Anonymous')
        self.rating = review_data.get('rating')
        self.comment = review_data.get('comment', '')
        self.created_at = review_data.get('created_at', datetime.utcnow())
        self.updated_at = review_data.get('updated_at', datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert review to dictionary for MongoDB storage"""
        return {
            'resource_id': self.resource_id,
            'uid': self.uid,
            'user_name': self.user_name,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def validate_review_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate review data
        Returns: (is_valid, error_message)
        """
        # Validate rating
        if 'rating' not in data:
            return False, "Rating is required"
        
        try:
            rating = float(data['rating'])
            if rating < 1 or rating > 5:
                return False, "Rating must be between 1 and 5"
        except (ValueError, TypeError):
            return False, "Rating must be a valid number"
        
        # Validate comment (optional but if present check length)
        if 'comment' in data and data['comment']:
            if len(data['comment']) > 500:
                return False, "Comment must not exceed 500 characters"
                
        return True, None

