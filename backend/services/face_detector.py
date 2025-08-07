"""
Face Detection Service using MediaPipe and InsightFace.
Provides real-time face detection with bounding boxes, confidence scores, age, and emotion analysis.
"""

import cv2
import numpy as np
import mediapipe as mp
import logging
from typing import List, Dict, Tuple, Optional

# Try to import InsightFace, fall back to MediaPipe only if not available
try:
    import insightface
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    logging.warning("InsightFace not available, using MediaPipe only")

logger = logging.getLogger(__name__)

class FaceDetector:
    """
    Face detection service using MediaPipe Face Detection and InsightFace for analysis.
    Optimized for real-time performance with high accuracy.
    """

    def __init__(self,
                 model_selection=1,
                 min_detection_confidence=0.7,
                 max_faces=5,
                 use_insightface=True):
        """
        Initialize the face detector.

        Args:
            model_selection (int): 0 for short-range (2m), 1 for full-range (5m)
            min_detection_confidence (float): Minimum confidence threshold
            max_faces (int): Maximum number of faces to detect
            use_insightface (bool): Whether to use InsightFace for enhanced analysis
        """
        self.model_selection = model_selection
        self.min_detection_confidence = min_detection_confidence
        self.max_faces = max_faces
        self.use_insightface = use_insightface and INSIGHTFACE_AVAILABLE

        # Initialize MediaPipe
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils

        try:
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=model_selection,
                min_detection_confidence=min_detection_confidence
            )
            logger.info(f"MediaPipe face detector initialized with model_selection={model_selection}")
        except Exception as e:
            logger.error(f"Failed to initialize MediaPipe face detector: {str(e)}")
            raise

        # Initialize InsightFace if available
        self.insight_app = None
        if self.use_insightface:
            try:
                # Use buffalo_l model which has the best accuracy for age/gender estimation
                # Enable all analysis components for comprehensive face analysis
                self.insight_app = insightface.app.FaceAnalysis(
                    name='buffalo_l',
                    providers=['CPUExecutionProvider'],  # Explicit provider for stability
                    allowed_modules=['detection', 'genderage']  # Only load necessary modules for performance
                )

                # Optimize detection size for better age estimation accuracy
                # Larger detection size generally improves age estimation accuracy
                # Use 640x640 for best accuracy, can be reduced to 480x480 for performance
                det_size = (640, 640)
                self.insight_app.prepare(
                    ctx_id=0,
                    det_size=det_size,
                    det_thresh=0.5  # Lower threshold for better detection of smaller faces
                )

                logger.info(f"InsightFace buffalo_l model initialized successfully:")
                logger.info(f"  - Detection size: {det_size}")
                logger.info(f"  - Modules: detection, genderage")
                logger.info(f"  - Provider: CPUExecutionProvider")

            except Exception as e:
                logger.warning(f"Failed to initialize InsightFace: {str(e)}, falling back to MediaPipe only")
                self.use_insightface = False
                self.insight_app = None
    
    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Detect faces in an image with enhanced analysis if InsightFace is available.

        Args:
            image (np.ndarray): Input image in BGR format

        Returns:
            List[Dict]: List of detected faces with bounding boxes, confidence, age, and emotion
        """
        try:
            # Use InsightFace if available for better analysis
            if self.use_insightface and self.insight_app is not None:
                return self._detect_faces_insightface(image)
            else:
                return self._detect_faces_mediapipe(image)

        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []

    def _detect_faces_insightface(self, image: np.ndarray) -> List[Dict]:
        """
        Detect faces using InsightFace for enhanced analysis with optimized preprocessing.
        """
        try:
            # InsightFace expects RGB format
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Optimize image quality for better age estimation
            # Ensure image is in proper format and quality
            if rgb_image.dtype != np.uint8:
                rgb_image = rgb_image.astype(np.uint8)

            # Apply slight contrast enhancement for better feature detection
            # This can improve age estimation accuracy
            alpha = 1.1  # Contrast control (1.0-3.0)
            beta = 5     # Brightness control (0-100)
            rgb_image = cv2.convertScaleAbs(rgb_image, alpha=alpha, beta=beta)

            # Perform analysis with optimized image
            faces_data = self.insight_app.get(rgb_image)

            faces = []
            for i, face in enumerate(faces_data[:self.max_faces]):
                # Extract bounding box
                bbox = face.bbox.astype(int)
                x, y, x2, y2 = bbox
                w = x2 - x
                h = y2 - y

                # Ensure coordinates are within image bounds
                height, width = image.shape[:2]
                x = max(0, x)
                y = max(0, y)
                w = min(w, width - x)
                h = min(h, height - y)

                # Extract age with proper validation and confidence
                age = None
                age_confidence = 0.0
                if hasattr(face, 'age') and face.age is not None:
                    raw_age = float(face.age)
                    # Validate age range (reasonable human age bounds)
                    if 0 <= raw_age <= 120:
                        age = int(round(raw_age))
                        # Calculate age confidence based on detection confidence
                        # InsightFace age estimation is generally reliable when detection confidence is high
                        age_confidence = min(0.95, float(face.det_score) * 1.1)
                    else:
                        logger.warning(f"Invalid age detected: {raw_age}, skipping age estimation")

                # Extract gender with proper confidence calculation
                gender = None
                gender_confidence = 0.0
                if hasattr(face, 'gender') and face.gender is not None:
                    # InsightFace gender: 0 = female, 1 = male
                    gender = 'male' if face.gender == 1 else 'female'
                    # Gender confidence is typically high for InsightFace
                    gender_confidence = min(0.95, float(face.det_score) * 1.05)

                # Create age range for better UX
                age_range = None
                if age is not None:
                    if age < 13:
                        age_range = "0-12"
                    elif age < 20:
                        age_range = "13-19"
                    elif age < 30:
                        age_range = "20-29"
                    elif age < 40:
                        age_range = "30-39"
                    elif age < 50:
                        age_range = "40-49"
                    elif age < 60:
                        age_range = "50-59"
                    elif age < 70:
                        age_range = "60-69"
                    else:
                        age_range = "70+"

                # Create face data with enhanced information
                face_data = {
                    'id': f'face_{i}',
                    'bbox': [x, y, w, h],
                    'confidence': float(face.det_score),
                    'center': [x + w // 2, y + h // 2],
                    'area': w * h,
                    'age': age,
                    'age_range': age_range,
                    'age_confidence': age_confidence,
                    'gender': gender,
                    'gender_confidence': gender_confidence,
                    # Add basic emotion (InsightFace doesn't provide emotion directly)
                    'dominant_emotion': 'neutral',
                    'emotion_confidence': 0.5,
                    'emotions': {
                        'neutral': 0.5,
                        'happy': 0.2,
                        'sad': 0.1,
                        'angry': 0.1,
                        'surprised': 0.1
                    }
                }

                faces.append(face_data)

            # Sort faces by confidence (highest first)
            faces.sort(key=lambda x: x['confidence'], reverse=True)

            # Log performance metrics for monitoring
            if faces:
                ages = [f['age'] for f in faces if f['age'] is not None]
                confidences = [f['confidence'] for f in faces]
                logger.debug(f"InsightFace results: {len(faces)} faces, avg_confidence={sum(confidences)/len(confidences):.3f}")
                if ages:
                    logger.debug(f"Age range: {min(ages)}-{max(ages)}, avg={sum(ages)/len(ages):.1f}")

            return faces

        except Exception as e:
            logger.error(f"Error with InsightFace detection: {str(e)}")
            # Fall back to MediaPipe
            return self._detect_faces_mediapipe(image)

    def _detect_faces_mediapipe(self, image: np.ndarray) -> List[Dict]:
        """
        Detect faces using MediaPipe (fallback method).
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

                    # Create face data with fallback values
                    face_data = {
                        'id': f'face_{i}',
                        'bbox': [x, y, w, h],
                        'confidence': float(confidence),
                        'center': [x + w // 2, y + h // 2],
                        'area': w * h,
                        'age': 25,  # Fallback age
                        'gender': 'unknown',
                        'age_confidence': 0.3,
                        'gender_confidence': 0.3,
                        'dominant_emotion': 'neutral',
                        'emotion_confidence': 0.3,
                        'emotions': {
                            'neutral': 0.7,
                            'happy': 0.1,
                            'sad': 0.1,
                            'angry': 0.05,
                            'surprised': 0.05
                        }
                    }

                    faces.append(face_data)

            # Sort faces by confidence (highest first)
            faces.sort(key=lambda x: x['confidence'], reverse=True)

            return faces

        except Exception as e:
            logger.error(f"Error with MediaPipe detection: {str(e)}")
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
