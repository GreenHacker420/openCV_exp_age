"""
Emotion Detection Service using deep learning models.
Provides real-time emotion recognition from facial expressions.
"""

import cv2
import numpy as np
import logging
import os
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

class EmotionDetector:
    """
    Emotion detection service using deep learning models.
    Supports multiple emotion recognition approaches.
    """
    
    def __init__(self, model_type='opencv_dnn'):
        """
        Initialize the emotion detector.
        
        Args:
            model_type (str): Type of model to use ('opencv_dnn', 'tensorflow', 'fallback')
        """
        self.model_type = model_type
        self.emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.model = None
        self._use_fallback = False
        
        try:
            self._initialize_model()
            logger.info(f"Emotion detector initialized with model type: {model_type}")
        except Exception as e:
            logger.error(f"Failed to initialize emotion detector: {str(e)}")
            self._use_fallback = True
    
    def _initialize_model(self):
        """Initialize the emotion detection model."""
        try:
            if self.model_type == 'opencv_dnn':
                self._initialize_opencv_model()
            elif self.model_type == 'tensorflow':
                self._initialize_tensorflow_model()
            else:
                self._use_fallback = True
                
        except Exception as e:
            logger.warning(f"Failed to initialize {self.model_type} model, using fallback")
            self._use_fallback = True
    
    def _initialize_opencv_model(self):
        """Initialize OpenCV DNN emotion model."""
        try:
            # This would load a pre-trained emotion model
            # For now, we'll use a placeholder that triggers fallback
            model_path = 'models/emotion/emotion_model.onnx'
            
            if not os.path.exists(model_path):
                raise FileNotFoundError("Emotion model not found")
            
            self.model = cv2.dnn.readNetFromONNX(model_path)
            self._use_fallback = False
            
        except Exception as e:
            logger.warning(f"OpenCV emotion model not available: {str(e)}")
            self._use_fallback = True
    
    def _initialize_tensorflow_model(self):
        """Initialize TensorFlow emotion model."""
        try:
            import tensorflow as tf
            
            model_path = 'models/emotion/emotion_model.h5'
            
            if not os.path.exists(model_path):
                raise FileNotFoundError("TensorFlow emotion model not found")
            
            self.model = tf.keras.models.load_model(model_path)
            self._use_fallback = False
            
        except ImportError:
            logger.warning("TensorFlow not available")
            self._use_fallback = True
        except Exception as e:
            logger.warning(f"TensorFlow emotion model not available: {str(e)}")
            self._use_fallback = True
    
    def detect_emotion(self, face_image: np.ndarray) -> Dict:
        """
        Detect emotion from a face image.
        
        Args:
            face_image (np.ndarray): Face image in BGR format
            
        Returns:
            Dict: Emotion detection results
        """
        try:
            if self._use_fallback:
                return self._fallback_emotion_detection(face_image)
            
            if self.model_type == 'opencv_dnn':
                return self._detect_emotion_opencv(face_image)
            elif self.model_type == 'tensorflow':
                return self._detect_emotion_tensorflow(face_image)
            else:
                return self._fallback_emotion_detection(face_image)
                
        except Exception as e:
            logger.error(f"Error detecting emotion: {str(e)}")
            return self._fallback_emotion_detection(face_image)
    
    def _detect_emotion_opencv(self, face_image: np.ndarray) -> Dict:
        """Detect emotion using OpenCV DNN model."""
        try:
            # Preprocess image
            blob = cv2.dnn.blobFromImage(
                face_image, 
                scalefactor=1.0, 
                size=(48, 48), 
                mean=(0, 0, 0), 
                swapRB=True, 
                crop=False
            )
            
            # Set input and run forward pass
            self.model.setInput(blob)
            predictions = self.model.forward()
            
            # Convert predictions to emotion scores
            emotion_scores = predictions[0]
            emotion_dict = {
                emotion: float(score) 
                for emotion, score in zip(self.emotions, emotion_scores)
            }
            
            # Get dominant emotion
            dominant_emotion = max(emotion_dict, key=emotion_dict.get)
            confidence = emotion_dict[dominant_emotion]
            
            return {
                'emotions': emotion_dict,
                'dominant_emotion': dominant_emotion,
                'confidence': confidence,
                'method': 'opencv_dnn'
            }
            
        except Exception as e:
            logger.error(f"Error in OpenCV emotion detection: {str(e)}")
            return self._fallback_emotion_detection(face_image)
    
    def _detect_emotion_tensorflow(self, face_image: np.ndarray) -> Dict:
        """Detect emotion using TensorFlow model."""
        try:
            # Preprocess image
            processed_image = self._preprocess_for_tensorflow(face_image)
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            emotion_scores = predictions[0]
            
            # Convert to emotion dictionary
            emotion_dict = {
                emotion: float(score) 
                for emotion, score in zip(self.emotions, emotion_scores)
            }
            
            # Get dominant emotion
            dominant_emotion = max(emotion_dict, key=emotion_dict.get)
            confidence = emotion_dict[dominant_emotion]
            
            return {
                'emotions': emotion_dict,
                'dominant_emotion': dominant_emotion,
                'confidence': confidence,
                'method': 'tensorflow'
            }
            
        except Exception as e:
            logger.error(f"Error in TensorFlow emotion detection: {str(e)}")
            return self._fallback_emotion_detection(face_image)
    
    def _fallback_emotion_detection(self, face_image: np.ndarray) -> Dict:
        """
        Fallback emotion detection using simple heuristics.
        
        Args:
            face_image (np.ndarray): Face image
            
        Returns:
            Dict: Emotion detection results
        """
        try:
            # Simple heuristic based on image properties
            # This is a placeholder - in production, you'd use a proper model
            
            # Convert to grayscale
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            
            # Calculate basic features
            brightness = np.mean(gray)
            contrast = np.std(gray)
            
            # Very simple emotion estimation (not accurate, just for demo)
            # In a real implementation, you'd analyze facial features
            
            # Generate pseudo-random but consistent emotions based on image properties
            seed = int(brightness + contrast) % 100
            np.random.seed(seed)
            
            # Create emotion scores with some randomness but bias toward neutral/happy
            base_scores = np.random.random(7) * 0.3
            
            # Bias toward neutral and happy for demo purposes
            base_scores[4] += 0.4  # neutral
            base_scores[3] += 0.3  # happy
            
            # Normalize scores
            base_scores = base_scores / np.sum(base_scores)
            
            emotion_dict = {
                emotion: float(score) 
                for emotion, score in zip(self.emotions, base_scores)
            }
            
            # Get dominant emotion
            dominant_emotion = max(emotion_dict, key=emotion_dict.get)
            confidence = emotion_dict[dominant_emotion]
            
            return {
                'emotions': emotion_dict,
                'dominant_emotion': dominant_emotion,
                'confidence': min(confidence, 0.7),  # Cap confidence for fallback
                'method': 'fallback'
            }
            
        except Exception as e:
            logger.error(f"Error in fallback emotion detection: {str(e)}")
            # Return default neutral emotion
            return {
                'emotions': {emotion: 0.14 if emotion != 'neutral' else 0.16 for emotion in self.emotions},
                'dominant_emotion': 'neutral',
                'confidence': 0.5,
                'method': 'default'
            }
    
    def _preprocess_for_tensorflow(self, face_image: np.ndarray) -> np.ndarray:
        """Preprocess face image for TensorFlow model."""
        try:
            # Resize to model input size (typically 48x48 for emotion models)
            resized = cv2.resize(face_image, (48, 48))
            
            # Convert to grayscale if model expects it
            if len(resized.shape) == 3:
                gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            else:
                gray = resized
            
            # Normalize pixel values
            normalized = gray.astype(np.float32) / 255.0
            
            # Add batch dimension
            batch_input = np.expand_dims(normalized, axis=0)
            
            # Add channel dimension if needed
            if len(batch_input.shape) == 3:
                batch_input = np.expand_dims(batch_input, axis=-1)
            
            return batch_input
            
        except Exception as e:
            logger.error(f"Error preprocessing image for TensorFlow: {str(e)}")
            return np.zeros((1, 48, 48, 1), dtype=np.float32)
    
    def detect_emotions_batch(self, face_images: List[np.ndarray]) -> List[Dict]:
        """
        Detect emotions for multiple face images.
        
        Args:
            face_images (List[np.ndarray]): List of face images
            
        Returns:
            List[Dict]: List of emotion detection results
        """
        results = []
        
        for i, face_image in enumerate(face_images):
            try:
                result = self.detect_emotion(face_image)
                result['face_index'] = i
                results.append(result)
            except Exception as e:
                logger.error(f"Error detecting emotion for face {i}: {str(e)}")
                results.append({
                    'face_index': i,
                    'emotions': {emotion: 0.14 for emotion in self.emotions},
                    'dominant_emotion': 'neutral',
                    'confidence': 0.1,
                    'method': 'error'
                })
        
        return results
    
    def get_emotion_statistics(self, emotion_results: List[Dict]) -> Dict:
        """
        Calculate emotion statistics for a group of people.
        
        Args:
            emotion_results (List[Dict]): List of emotion detection results
            
        Returns:
            Dict: Emotion statistics
        """
        if not emotion_results:
            return {}
        
        try:
            # Aggregate emotion scores
            emotion_totals = {emotion: 0.0 for emotion in self.emotions}
            dominant_emotions = []
            
            for result in emotion_results:
                emotions = result.get('emotions', {})
                for emotion, score in emotions.items():
                    if emotion in emotion_totals:
                        emotion_totals[emotion] += score
                
                dominant = result.get('dominant_emotion')
                if dominant:
                    dominant_emotions.append(dominant)
            
            # Calculate averages
            count = len(emotion_results)
            emotion_averages = {
                emotion: total / count 
                for emotion, total in emotion_totals.items()
            }
            
            # Count dominant emotions
            dominant_counts = {}
            for emotion in dominant_emotions:
                dominant_counts[emotion] = dominant_counts.get(emotion, 0) + 1
            
            return {
                'count': count,
                'average_emotions': emotion_averages,
                'dominant_emotion_counts': dominant_counts,
                'most_common_emotion': max(dominant_counts, key=dominant_counts.get) if dominant_counts else 'neutral'
            }
            
        except Exception as e:
            logger.error(f"Error calculating emotion statistics: {str(e)}")
            return {}
    
    def validate_emotion_result(self, result: Dict) -> bool:
        """
        Validate emotion detection result.
        
        Args:
            result (Dict): Emotion detection result
            
        Returns:
            bool: True if result is valid
        """
        try:
            # Check required fields
            if 'emotions' not in result or 'dominant_emotion' not in result:
                return False
            
            # Check emotion scores sum to approximately 1
            emotions = result['emotions']
            total_score = sum(emotions.values())
            if not (0.8 <= total_score <= 1.2):
                return False
            
            # Check dominant emotion is in emotions dict
            dominant = result['dominant_emotion']
            if dominant not in emotions:
                return False
            
            return True
            
        except Exception:
            return False
