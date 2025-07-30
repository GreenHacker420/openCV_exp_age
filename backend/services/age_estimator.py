"""
Age Estimation Service using InsightFace.
Provides accurate age prediction from facial images.
"""

import cv2
import numpy as np
import logging
from typing import List, Dict, Optional, Tuple
import os

logger = logging.getLogger(__name__)

class AgeEstimator:
    """
    Age estimation service using InsightFace models.
    Provides real-time age prediction with confidence scoring.
    """
    
    def __init__(self, model_name='buffalo_l', providers=None):
        """
        Initialize the age estimator.
        
        Args:
            model_name (str): InsightFace model name
            providers (list): Execution providers for ONNX runtime
        """
        self.model_name = model_name
        self.providers = providers or ['CPUExecutionProvider']
        self.app = None
        
        # Age ranges for classification models
        self.age_ranges = [
            '(0-2)', '(4-6)', '(8-12)', '(15-20)', 
            '(25-32)', '(38-43)', '(48-53)', '(60-100)'
        ]
        
        try:
            self._initialize_model()
            logger.info(f"Age estimator initialized with model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize age estimator: {str(e)}")
            # Fallback to simple age estimation
            self._use_fallback = True
    
    def _initialize_model(self):
        """Initialize the InsightFace model."""
        try:
            import insightface
            
            # Initialize InsightFace app
            self.app = insightface.app.FaceAnalysis(
                name=self.model_name,
                providers=self.providers
            )
            
            # Prepare the model
            self.app.prepare(ctx_id=0, det_size=(640, 640))
            self._use_fallback = False
            
        except ImportError:
            logger.warning("InsightFace not available, using fallback age estimation")
            self._use_fallback = True
        except Exception as e:
            logger.error(f"Failed to initialize InsightFace: {str(e)}")
            self._use_fallback = True
    
    def estimate_age(self, face_image: np.ndarray) -> Dict:
        """
        Estimate age from a face image.
        
        Args:
            face_image (np.ndarray): Face image in BGR format
            
        Returns:
            Dict: Age estimation results
        """
        try:
            if self._use_fallback:
                return self._fallback_age_estimation(face_image)
            
            # Use InsightFace for age estimation
            faces = self.app.get(face_image)
            
            if faces:
                face = faces[0]  # Use the first detected face
                age = int(face.age) if hasattr(face, 'age') else None
                
                if age is not None:
                    return {
                        'age': age,
                        'confidence': 0.85,  # InsightFace doesn't provide confidence
                        'age_range': self._get_age_range(age),
                        'method': 'insightface'
                    }
            
            # If no face detected or no age attribute
            return self._fallback_age_estimation(face_image)
            
        except Exception as e:
            logger.error(f"Error estimating age: {str(e)}")
            return self._fallback_age_estimation(face_image)
    
    def _fallback_age_estimation(self, face_image: np.ndarray) -> Dict:
        """
        Fallback age estimation using simple heuristics.
        
        Args:
            face_image (np.ndarray): Face image
            
        Returns:
            Dict: Age estimation results
        """
        try:
            # Simple heuristic based on image properties
            # This is a placeholder - in production, you'd use a proper model
            
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            
            # Calculate some basic features
            height, width = gray.shape
            
            # Simple heuristics (this is very basic and not accurate)
            # In a real implementation, you'd use proper facial features
            
            # Estimate based on face size and texture
            face_area = height * width
            texture_variance = np.var(gray)
            
            # Very simple age estimation (not accurate, just for demo)
            if face_area < 5000:
                estimated_age = 15 + int(texture_variance / 100) % 20
            elif face_area < 15000:
                estimated_age = 25 + int(texture_variance / 150) % 25
            else:
                estimated_age = 35 + int(texture_variance / 200) % 30
            
            # Clamp age to reasonable range
            estimated_age = max(5, min(80, estimated_age))
            
            return {
                'age': estimated_age,
                'confidence': 0.6,  # Lower confidence for fallback
                'age_range': self._get_age_range(estimated_age),
                'method': 'fallback'
            }
            
        except Exception as e:
            logger.error(f"Error in fallback age estimation: {str(e)}")
            return {
                'age': 25,  # Default age
                'confidence': 0.3,
                'age_range': '(25-32)',
                'method': 'default'
            }
    
    def _get_age_range(self, age: int) -> str:
        """
        Get age range category for a given age.
        
        Args:
            age (int): Estimated age
            
        Returns:
            str: Age range category
        """
        if age <= 2:
            return '(0-2)'
        elif age <= 6:
            return '(4-6)'
        elif age <= 12:
            return '(8-12)'
        elif age <= 20:
            return '(15-20)'
        elif age <= 32:
            return '(25-32)'
        elif age <= 43:
            return '(38-43)'
        elif age <= 53:
            return '(48-53)'
        else:
            return '(60-100)'
    
    def estimate_ages_batch(self, face_images: List[np.ndarray]) -> List[Dict]:
        """
        Estimate ages for multiple face images.
        
        Args:
            face_images (List[np.ndarray]): List of face images
            
        Returns:
            List[Dict]: List of age estimation results
        """
        results = []
        
        for i, face_image in enumerate(face_images):
            try:
                result = self.estimate_age(face_image)
                result['face_index'] = i
                results.append(result)
            except Exception as e:
                logger.error(f"Error estimating age for face {i}: {str(e)}")
                results.append({
                    'face_index': i,
                    'age': 25,
                    'confidence': 0.1,
                    'age_range': '(25-32)',
                    'method': 'error'
                })
        
        return results
    
    def get_age_statistics(self, ages: List[int]) -> Dict:
        """
        Calculate age statistics for a group of people.
        
        Args:
            ages (List[int]): List of estimated ages
            
        Returns:
            Dict: Age statistics
        """
        if not ages:
            return {}
        
        try:
            ages_array = np.array(ages)
            
            return {
                'count': len(ages),
                'mean_age': float(np.mean(ages_array)),
                'median_age': float(np.median(ages_array)),
                'min_age': int(np.min(ages_array)),
                'max_age': int(np.max(ages_array)),
                'std_age': float(np.std(ages_array)),
                'age_distribution': self._get_age_distribution(ages)
            }
            
        except Exception as e:
            logger.error(f"Error calculating age statistics: {str(e)}")
            return {}
    
    def _get_age_distribution(self, ages: List[int]) -> Dict:
        """
        Get age distribution by ranges.
        
        Args:
            ages (List[int]): List of ages
            
        Returns:
            Dict: Age distribution
        """
        distribution = {range_name: 0 for range_name in self.age_ranges}
        
        for age in ages:
            age_range = self._get_age_range(age)
            if age_range in distribution:
                distribution[age_range] += 1
        
        return distribution
    
    def validate_age_estimate(self, age: int, confidence: float) -> bool:
        """
        Validate if an age estimate is reasonable.
        
        Args:
            age (int): Estimated age
            confidence (float): Confidence score
            
        Returns:
            bool: True if estimate seems valid
        """
        # Basic validation rules
        if age < 0 or age > 120:
            return False
        
        if confidence < 0.3:
            return False
        
        return True
    
    def preprocess_face_for_age(self, face_image: np.ndarray, 
                               target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
        """
        Preprocess face image for age estimation.
        
        Args:
            face_image (np.ndarray): Input face image
            target_size (Tuple[int, int]): Target size for model input
            
        Returns:
            np.ndarray: Preprocessed image
        """
        try:
            # Resize image
            resized = cv2.resize(face_image, target_size, interpolation=cv2.INTER_AREA)
            
            # Normalize pixel values
            normalized = resized.astype(np.float32) / 255.0
            
            # Convert BGR to RGB if needed
            if len(normalized.shape) == 3 and normalized.shape[2] == 3:
                normalized = cv2.cvtColor(normalized, cv2.COLOR_BGR2RGB)
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error preprocessing face for age estimation: {str(e)}")
            return face_image
