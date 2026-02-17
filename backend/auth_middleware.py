from functools import wraps
from flask import request, jsonify
import firebase_admin
from firebase_admin import auth

def verify_token(f):
    """
    Decorator to verify Firebase authentication token
    Extracts user information and adds it to request context
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS requests for CORS preflight
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header provided'}), 401
        
        try:
            # Extract token (format: "Bearer <token>")
            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Invalid authorization header format'}), 401
            
            token = auth_header.split('Bearer ')[1]
            
            # Verify the token with Firebase
            decoded_token = auth.verify_id_token(token)
            
            # Add user info to request context
            request.uid = decoded_token['uid']
            request.email = decoded_token.get('email')
            request.user_data = decoded_token
            
            return f(*args, **kwargs)
            
        except auth.InvalidIdTokenError:
            return jsonify({'error': 'Invalid authentication token'}), 401
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'Authentication token has expired'}), 401
        except auth.RevokedIdTokenError:
            return jsonify({'error': 'Authentication token has been revoked'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
    
    return decorated_function

def get_current_user():
    """
    Get current authenticated user from request context
    Returns: dict with uid and email
    """
    if hasattr(request, 'uid'):
        return {
            'uid': request.uid,
            'email': request.email
        }
    return None
