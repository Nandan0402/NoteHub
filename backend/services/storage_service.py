from gridfs import GridFS
from bson import ObjectId
from typing import Optional, BinaryIO
from werkzeug.datastructures import FileStorage
import io

class StorageService:
    """Service for managing file storage using MongoDB GridFS"""
    
    def __init__(self, db):
        """Initialize GridFS with database connection"""
        self.fs = GridFS(db)
    
    def upload_file(self, file: FileStorage, metadata: dict = None) -> ObjectId:
        """
        Upload a file to GridFS
        
        Args:
            file: FileStorage object from Flask request
            metadata: Optional metadata dictionary
        
        Returns:
            ObjectId: The GridFS file ID
        """
        try:
            # Read file content
            file_content = file.read()
            
            # Reset file pointer for potential re-reads
            file.seek(0)
            
            # Store file with metadata
            file_id = self.fs.put(
                file_content,
                filename=file.filename,
                content_type=file.content_type,
                metadata=metadata or {}
            )
            
            return file_id
        
        except Exception as e:
            raise Exception(f"Failed to upload file: {str(e)}")
    
    def get_file(self, file_id: str):
        """
        Retrieve a file from GridFS
        
        Args:
            file_id: String representation of ObjectId
        
        Returns:
            GridOut object or None
        """
        try:
            obj_id = ObjectId(file_id)
            if self.fs.exists(obj_id):
                return self.fs.get(obj_id)
            return None
        except Exception as e:
            raise Exception(f"Failed to retrieve file: {str(e)}")
    
    def delete_file(self, file_id: str) -> bool:
        """
        Delete a file from GridFS
        
        Args:
            file_id: String representation of ObjectId
        
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            obj_id = ObjectId(file_id)
            if self.fs.exists(obj_id):
                self.fs.delete(obj_id)
                return True
            return False
        except Exception as e:
            raise Exception(f"Failed to delete file: {str(e)}")
    
    def file_exists(self, file_id: str) -> bool:
        """
        Check if a file exists in GridFS
        
        Args:
            file_id: String representation of ObjectId
        
        Returns:
            bool: True if exists, False otherwise
        """
        try:
            obj_id = ObjectId(file_id)
            return self.fs.exists(obj_id)
        except:
            return False
