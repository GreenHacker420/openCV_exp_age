"""
Face Detection Service using MediaPipe.
Provides real-time face detection with bounding boxes and confidence scores.
"""

import cv2
import numpy as np
import mediapipe as mp
import logging
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)

class FaceDetector:
    """
    Face detection service using MediaPipe Face Detection.
    Optimized for real-time performance with high accuracy.
    """
    
    def __init__(self, 
                 model_selection=1, 
                 min_detection_confidence=0.7,
                 max_faces=5):
        """
        Initialize the face detector.
        
        Args:
            model_selection (int): 0 for short-range (2m), 1 for full-range (5m)
            min_detection_confidence (float): Minimum confidence threshold
            max_faces (int): Maximum number of faces to detect
        """
        self.model_selection = model_selection
        self.min_detection_confidence = min_detection_confidence
        self.max_faces = max_faces
        
        # Initialize MediaPipe
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        
        try:
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=model_selection,
                min_detection_confidence=min_detection_confidence
            )
            logger.info(f"Face detector initialized with model_selection={model_selection}")
        except Exception as e:
            logger.error(f"Failed to initialize face detector: {str(e)}")
            raise
    
    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Detect faces in an image.
        
        Args:
            image (np.ndarray): Input image in BGR format
            
        Returns:
            List[Dict]: List of detected faces with bounding boxes and confidence
        """
        try:
            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Perform detection
            results = self.face_detection.process(rgb_image)
            
            faces = []
            if results.detections:
                height, width = image.shape[:2]
                
                for i, detection in enumerate(results.detections[:self.max_faces]):
                    # Extract bounding box
                    bbox = detection.location_data.relative_bounding_box
                    
                    # Convert relative coordinates to absolute
                    x = int(bbox.xmin * width)
                    y = int(bbox.ymin * height)
                    w = int(bbox.width * width)
                    h = int(bbox.height * height)
                    
                    # Ensure coordinates are within image bounds
                    x = max(0, x)
                    y = max(0, y)
                    w = min(w, width - x)
                    h = min(h, height - y)
                    
                    # Extract confidence score
                    confidence = detection.score[0] if detection.score else 0.0
                    
                    # Create face data
                    face_data = {
                        'id': f'face_{i}',
                        'bbox': [x, y, w, h],
                        'confidence': float(confidence),
                        'center': [x + w // 2, y + h // 2],
                        'area': w * h
                    }
                    
                    faces.append(face_data)
            
            # Sort faces by confidence (highest first)
            faces.sort(key=lambda x: x['confidence'], reverse=True)
            
            return faces
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []
    
    def detect_faces_with_landmarks(self, image: np.ndarray) -> List[Dict]:
        """
        Detect faces with facial landmarks (key points).
        
        Args:
            image (np.ndarray): Input image in BGR format
            
        Returns:
            List[Dict]: List of detected faces with landmarks
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Perform detection
            results = self.face_detection.process(rgb_image)
            
            faces = []
            if results.detections:
                height, width = image.shape[:2]
                
                for i, detection in enumerate(results.detections[:self.max_faces]):
                    # Extract bounding box
                    bbox = detection.location_data.relative_bounding_box
                    
                    # Convert to absolute coordinates
                    x = int(bbox.xmin * width)
                    y = int(bbox.ymin * height)
                    w = int(bbox.width * width)
                    h = int(bbox.height * height)
                    
                    # Ensure bounds
                    x = max(0, x)
                    y = max(0, y)
                    w = min(w, width - x)
                    h = min(h, height - y)
                    
                    # Extract key points if available
                    landmarks = []
                    if hasattr(detection.location_data, 'relative_keypoints'):
                        for keypoint in detection.location_data.relative_keypoints:
                            landmarks.append([
                                int(keypoint.x * width),
                                int(keypoint.y * height)
                            ])
                    
                    face_data = {
                        'id': f'face_{i}',
                        'bbox': [x, y, w, h],
                        'confidence': float(detection.score[0]) if detection.score else 0.0,
                        'landmarks': landmarks,
                        'center': [x + w // 2, y + h // 2],
                        'area': w * h
                    }
                    
                    faces.append(face_data)
            
            return faces
            
        except Exception as e:
            logger.error(f"Error detecting faces with landmarks: {str(e)}")
            return []
    
    def extract_face_regions(self, image: np.ndarray, faces: List[Dict], 
                           padding: float = 0.2) -> List[np.ndarray]:
        """
        Extract face regions from detected faces.
        
        Args:
            image (np.ndarray): Input image
            faces (List[Dict]): List of detected faces
            padding (float): Padding factor around face
            
        Returns:
            List[np.ndarray]: List of extracted face images
        """
        face_regions = []
        
        try:
            height, width = image.shape[:2]
            
            for face in faces:
                x, y, w, h = face['bbox']
                
                # Calculate padding
                pad_w = int(w * padding)
                pad_h = int(h * padding)
                
                # Calculate padded coordinates
                x1 = max(0, x - pad_w)
                y1 = max(0, y - pad_h)
                x2 = min(width, x + w + pad_w)
                y2 = min(height, y + h + pad_h)
                
                # Extract face region
                face_region = image[y1:y2, x1:x2]
                
                if face_region.size > 0:
                    face_regions.append(face_region)
                else:
                    logger.warning(f"Empty face region for face {face['id']}")
            
            return face_regions
            
        except Exception as e:
            logger.error(f"Error extracting face regions: {str(e)}")
            return []
    
    def draw_detections(self, image: np.ndarray, faces: List[Dict], 
                       draw_confidence: bool = True) -> np.ndarray:
        """
        Draw face detection results on image.
        
        Args:
            image (np.ndarray): Input image
            faces (List[Dict]): List of detected faces
            draw_confidence (bool): Whether to draw confidence scores
            
        Returns:
            np.ndarray: Image with drawn detections
        """
        try:
            result = image.copy()
            
            for face in faces:
                x, y, w, h = face['bbox']
                confidence = face['confidence']
                
                # Choose color based on confidence
                if confidence > 0.8:
                    color = (0, 255, 0)  # Green for high confidence
                elif confidence > 0.6:
                    color = (0, 255, 255)  # Yellow for medium confidence
                else:
                    color = (0, 0, 255)  # Red for low confidence
                
                # Draw bounding box
                cv2.rectangle(result, (x, y), (x + w, y + h), color, 2)
                
                # Draw confidence score
                if draw_confidence:
                    text = f"{confidence:.2f}"
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = 0.6
                    thickness = 2
                    
                    # Get text size
                    (text_width, text_height), _ = cv2.getTextSize(text, font, font_scale, thickness)
                    
                    # Draw text background
                    cv2.rectangle(result, (x, y - text_height - 10), 
                                (x + text_width, y), color, -1)
                    
                    # Draw text
                    cv2.putText(result, text, (x, y - 5), font, font_scale, 
                              (0, 0, 0), thickness)
                
                # Draw landmarks if available
                if 'landmarks' in face and face['landmarks']:
                    for landmark in face['landmarks']:
                        cv2.circle(result, tuple(landmark), 3, color, -1)
            
            return result
            
        except Exception as e:
            logger.error(f"Error drawing detections: {str(e)}")
            return image
    
    def get_largest_face(self, faces: List[Dict]) -> Optional[Dict]:
        """
        Get the largest detected face by area.
        
        Args:
            faces (List[Dict]): List of detected faces
            
        Returns:
            Optional[Dict]: Largest face or None if no faces
        """
        if not faces:
            return None
        
        return max(faces, key=lambda x: x['area'])
    
    def filter_faces_by_confidence(self, faces: List[Dict], 
                                 min_confidence: float = 0.7) -> List[Dict]:
        """
        Filter faces by minimum confidence threshold.
        
        Args:
            faces (List[Dict]): List of detected faces
            min_confidence (float): Minimum confidence threshold
            
        Returns:
            List[Dict]: Filtered faces
        """
        return [face for face in faces if face['confidence'] >= min_confidence]
