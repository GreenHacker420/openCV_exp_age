"""
DEX Age Estimation Service using VGG-16 with Deep EXpectation regression.
Provides accurate age prediction from facial images using the DEX model.
"""

import cv2
import numpy as np
import logging
import os
from typing import Dict, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

class DEXAgeEstimator:
    """
    DEX (Deep EXpectation) age estimation service using VGG-16 architecture.
    Implements deep expectation regression for more accurate age prediction.
    """
    
    def __init__(self, model_path: Optional[str] = None, img_size: int = 224, enable_gpu: bool = False):
        """
        Initialize the DEX age estimator.

        Args:
            model_path (str): Path to the DEX model weights file
            img_size (int): Input image size for the model
            enable_gpu (bool): Whether to use GPU acceleration if available
        """
        self.img_size = img_size
        self.enable_gpu = enable_gpu
        self.model = None
        self._use_fallback = False
        self._batch_size = 1  # Process one face at a time for real-time performance

        # Default model path
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__),
                "..", "models", "dex", "weights.28-3.73.hdf5"
            )

        self.model_path = model_path

        try:
            self._initialize_model()
            logger.info(f"DEX age estimator initialized successfully with model: {model_path}")
        except Exception as e:
            logger.error(f"Failed to initialize DEX age estimator: {str(e)}")
            self._use_fallback = True
    
    def _initialize_model(self):
        """Initialize the DEX model."""
        try:
            import tensorflow as tf
            from tensorflow import keras
            
            # Check if model file exists
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"DEX model file not found: {self.model_path}")
            
            # Create the DEX model architecture
            self.model = self._create_dex_model()
            
            # Load the pre-trained weights
            self.model.load_weights(self.model_path)
            
            self._use_fallback = False
            logger.info("DEX model loaded successfully")
            
        except ImportError:
            logger.warning("TensorFlow not available, using fallback age estimation")
            self._use_fallback = True
        except Exception as e:
            logger.error(f"Failed to initialize DEX model: {str(e)}")
            self._use_fallback = True
    
    def _create_dex_model(self):
        """
        Create the DEX model architecture based on VGG-16.
        This implements the Deep EXpectation regression approach.
        """
        try:
            import tensorflow as tf
            from tensorflow import keras
            from tensorflow.keras import layers
            
            # Input layer
            inputs = keras.Input(shape=(self.img_size, self.img_size, 3))
            
            # VGG-16 based feature extraction
            # Block 1
            x = layers.Conv2D(64, (3, 3), activation='relu', padding='same', name='block1_conv1')(inputs)
            x = layers.Conv2D(64, (3, 3), activation='relu', padding='same', name='block1_conv2')(x)
            x = layers.MaxPooling2D((2, 2), strides=(2, 2), name='block1_pool')(x)
            
            # Block 2
            x = layers.Conv2D(128, (3, 3), activation='relu', padding='same', name='block2_conv1')(x)
            x = layers.Conv2D(128, (3, 3), activation='relu', padding='same', name='block2_conv2')(x)
            x = layers.MaxPooling2D((2, 2), strides=(2, 2), name='block2_pool')(x)
            
            # Block 3
            x = layers.Conv2D(256, (3, 3), activation='relu', padding='same', name='block3_conv1')(x)
            x = layers.Conv2D(256, (3, 3), activation='relu', padding='same', name='block3_conv2')(x)
            x = layers.Conv2D(256, (3, 3), activation='relu', padding='same', name='block3_conv3')(x)
            x = layers.MaxPooling2D((2, 2), strides=(2, 2), name='block3_pool')(x)
            
            # Block 4
            x = layers.Conv2D(512, (3, 3), activation='relu', padding='same', name='block4_conv1')(x)
            x = layers.Conv2D(512, (3, 3), activation='relu', padding='same', name='block4_conv2')(x)
            x = layers.Conv2D(512, (3, 3), activation='relu', padding='same', name='block4_conv3')(x)
            x = layers.MaxPooling2D((2, 2), strides=(2, 2), name='block4_pool')(x)
            
            # Block 5
            x = layers.Conv2D(512, (3, 3), activation='relu', padding='same', name='block5_conv1')(x)
            x = layers.Conv2D(512, (3, 3), activation='relu', padding='same', name='block5_conv2')(x)
            x = layers.Conv2D(512, (3, 3), activation='relu', padding='same', name='block5_conv3')(x)
            x = layers.MaxPooling2D((2, 2), strides=(2, 2), name='block5_pool')(x)
            
            # Flatten and fully connected layers
            x = layers.Flatten(name='flatten')(x)
            x = layers.Dense(4096, activation='relu', name='fc1')(x)
            x = layers.Dropout(0.5, name='dropout1')(x)
            x = layers.Dense(4096, activation='relu', name='fc2')(x)
            x = layers.Dropout(0.5, name='dropout2')(x)
            
            # Gender prediction head
            gender_pred = layers.Dense(1, activation='sigmoid', name='gender_prediction')(x)
            
            # Age prediction head - DEX approach with 101 age classes (0-100)
            age_pred = layers.Dense(101, activation='softmax', name='age_prediction')(x)
            
            # Create model
            model = keras.Model(inputs=inputs, outputs=[gender_pred, age_pred], name='dex_model')
            
            return model
            
        except Exception as e:
            logger.error(f"Error creating DEX model architecture: {str(e)}")
            raise
    
    def estimate_age(self, face_image: np.ndarray) -> Dict:
        """
        Estimate age from a face image using DEX model.
        
        Args:
            face_image (np.ndarray): Face image in BGR format
            
        Returns:
            Dict: Age estimation results
        """
        try:
            if self._use_fallback:
                return self._fallback_age_estimation(face_image)
            
            # Preprocess the image
            processed_image = self._preprocess_image(face_image)
            
            # Make prediction
            predictions = self.model.predict(processed_image, verbose=0)
            gender_pred, age_pred = predictions
            
            # Calculate age using expectation (weighted average)
            ages = np.arange(0, 101)
            predicted_age = np.sum(age_pred[0] * ages)
            
            # Calculate confidence as the maximum probability
            age_confidence = float(np.max(age_pred[0]))
            
            # Ensure age is within reasonable bounds
            predicted_age = max(0, min(100, int(round(predicted_age))))
            
            return {
                'age': predicted_age,
                'confidence': age_confidence,
                'age_range': self._get_age_range(predicted_age),
                'method': 'dex',
                'gender': 'male' if gender_pred[0][0] < 0.5 else 'female',
                'gender_confidence': float(1 - gender_pred[0][0]) if gender_pred[0][0] < 0.5 else float(gender_pred[0][0])
            }
            
        except Exception as e:
            logger.error(f"Error estimating age with DEX: {str(e)}")
            return self._fallback_age_estimation(face_image)
    
    def _preprocess_image(self, face_image: np.ndarray) -> np.ndarray:
        """
        Preprocess face image for DEX model input.
        
        Args:
            face_image (np.ndarray): Input face image in BGR format
            
        Returns:
            np.ndarray: Preprocessed image ready for model input
        """
        try:
            # Resize to model input size
            resized = cv2.resize(face_image, (self.img_size, self.img_size))
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            
            # Normalize pixel values to [0, 1]
            normalized = rgb_image.astype(np.float32) / 255.0
            
            # Add batch dimension
            batch_input = np.expand_dims(normalized, axis=0)
            
            return batch_input
            
        except Exception as e:
            logger.error(f"Error preprocessing image for DEX: {str(e)}")
            # Return a default preprocessed image
            return np.zeros((1, self.img_size, self.img_size, 3), dtype=np.float32)
    
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
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            height, width = gray.shape
            
            # Calculate basic features
            face_area = height * width
            texture_variance = np.var(gray)
            
            # Simple age estimation based on face characteristics
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
                'confidence': 0.6,
                'age_range': self._get_age_range(estimated_age),
                'method': 'fallback',
                'gender': 'unknown',
                'gender_confidence': 0.5
            }
            
        except Exception as e:
            logger.error(f"Error in fallback age estimation: {str(e)}")
            return {
                'age': 25,
                'confidence': 0.3,
                'age_range': '(25-32)',
                'method': 'default',
                'gender': 'unknown',
                'gender_confidence': 0.5
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
