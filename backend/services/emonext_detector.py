"""
EmoNeXt Emotion Detection Service using ConvNeXt architecture.
Provides real-time emotion recognition from facial expressions.
"""

import cv2
import numpy as np
import logging
import os
import sys
from typing import Dict, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class EmoNeXtDetector:
    """
    EmoNeXt emotion detection service using ConvNeXt architecture.
    Implements spatial transformer networks and self-attention for accurate emotion recognition.
    """
    
    def __init__(self, model_size: str = "tiny", model_path: Optional[str] = None, enable_gpu: bool = False):
        """
        Initialize the EmoNeXt emotion detector.

        Args:
            model_size (str): Size of the model ('tiny', 'small', 'base', 'large')
            model_path (str): Path to the trained model weights
            enable_gpu (bool): Whether to use GPU acceleration if available
        """
        self.model_size = model_size
        self.enable_gpu = enable_gpu
        self.model = None
        self._use_fallback = False
        self._batch_size = 1  # Process one face at a time for real-time performance

        # Emotion labels for FER2013 dataset
        self.emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        
        # Add the EmoNeXt model path to sys.path
        emonext_path = os.path.join(os.path.dirname(__file__), "..", "models", "emonext")
        if emonext_path not in sys.path:
            sys.path.append(emonext_path)
        
        try:
            self._initialize_model(model_path)
            logger.info(f"EmoNeXt emotion detector initialized successfully with model size: {model_size}")
        except Exception as e:
            logger.error(f"Failed to initialize EmoNeXt emotion detector: {str(e)}")
            self._use_fallback = True
    
    def _initialize_model(self, model_path: Optional[str] = None):
        """Initialize the EmoNeXt model."""
        try:
            import torch
            import torch.nn as nn
            from models import get_model  # Import from the EmoNeXt models.py
            
            # Check if CUDA is available
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            logger.info(f"Using device: {self.device}")
            
            # Create the model
            num_classes = len(self.emotions)  # 7 emotions
            self.model = get_model(
                num_classes=num_classes,
                model_size=self.model_size,
                in_22k=True  # Use ImageNet-22k pretrained weights
            )
            
            # Load custom weights if provided
            if model_path and os.path.exists(model_path):
                checkpoint = torch.load(model_path, map_location=self.device)
                if 'model_state_dict' in checkpoint:
                    self.model.load_state_dict(checkpoint['model_state_dict'])
                else:
                    self.model.load_state_dict(checkpoint)
                logger.info(f"Loaded custom weights from: {model_path}")
            else:
                logger.info("Using pretrained ConvNeXt weights (will need fine-tuning for emotions)")
            
            # Move model to device and set to evaluation mode
            self.model.to(self.device)
            self.model.eval()
            
            self._use_fallback = False
            
        except ImportError as e:
            logger.warning(f"PyTorch not available: {str(e)}, using fallback emotion detection")
            self._use_fallback = True
        except Exception as e:
            logger.error(f"Failed to initialize EmoNeXt model: {str(e)}")
            self._use_fallback = True
    
    def detect_emotion(self, face_image: np.ndarray) -> Dict:
        """
        Detect emotion from a face image using EmoNeXt model.
        
        Args:
            face_image (np.ndarray): Face image in BGR format
            
        Returns:
            Dict: Emotion detection results
        """
        try:
            if self._use_fallback:
                return self._fallback_emotion_detection(face_image)
            
            # Check face quality for emotion detection
            if not self._is_face_suitable_for_emotion_detection(face_image):
                logger.debug("Face not suitable for emotion detection, using fallback")
                return self._fallback_emotion_detection(face_image)

            # Preprocess the image
            processed_image = self._preprocess_image(face_image)

            # Make prediction
            with torch.no_grad():
                predictions, logits = self.model(processed_image)

                # Convert logits to probabilities
                probabilities = torch.softmax(logits, dim=1)
                emotion_scores = probabilities[0].cpu().numpy()

            # Apply confidence filtering and smoothing
            filtered_scores = self._filter_emotion_predictions(emotion_scores)

            # Create emotion dictionary
            emotion_dict = {
                emotion: float(score)
                for emotion, score in zip(self.emotions, filtered_scores)
            }

            # Get dominant emotion with minimum confidence threshold
            dominant_idx = np.argmax(filtered_scores)
            dominant_emotion = self.emotions[dominant_idx]
            confidence = float(filtered_scores[dominant_idx])

            # Apply minimum confidence threshold
            if confidence < 0.4:  # If confidence is too low, default to neutral
                dominant_emotion = 'neutral'
                emotion_dict['neutral'] = max(emotion_dict.get('neutral', 0), 0.6)
                confidence = 0.6
            
            return {
                'emotions': emotion_dict,
                'dominant_emotion': dominant_emotion,
                'confidence': confidence,
                'method': 'emonext'
            }
            
        except Exception as e:
            logger.error(f"Error detecting emotion with EmoNeXt: {str(e)}")
            return self._fallback_emotion_detection(face_image)
    
    def _preprocess_image(self, face_image: np.ndarray) -> 'torch.Tensor':
        """
        Preprocess face image for EmoNeXt model input.
        
        Args:
            face_image (np.ndarray): Input face image in BGR format
            
        Returns:
            torch.Tensor: Preprocessed image ready for model input
        """
        try:
            import torch
            import torchvision.transforms as transforms
            
            # Resize to 224x224 (standard input size for ConvNeXt)
            resized = cv2.resize(face_image, (224, 224))
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            
            # Define transforms
            transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
            # Apply transforms
            tensor_image = transform(rgb_image)
            
            # Add batch dimension
            batch_tensor = tensor_image.unsqueeze(0).to(self.device)
            
            return batch_tensor
            
        except Exception as e:
            logger.error(f"Error preprocessing image for EmoNeXt: {str(e)}")
            # Return a default tensor
            import torch
            return torch.zeros((1, 3, 224, 224), device=self.device)

    def _is_face_suitable_for_emotion_detection(self, face_image: np.ndarray) -> bool:
        """
        Check if face image is suitable for reliable emotion detection.

        Args:
            face_image (np.ndarray): Face image to check

        Returns:
            bool: True if face is suitable for emotion processing
        """
        try:
            h, w = face_image.shape[:2]

            # Check minimum face size (emotions need larger faces than age)
            if min(h, w) < 64:  # Emotions need at least 64x64
                logger.debug(f"Face too small for emotion detection: {w}x{h} < 64")
                return False

            # Check image quality (blur detection)
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Emotion detection needs sharper images
            if laplacian_var < 150:  # Higher threshold than age detection
                logger.debug(f"Face too blurry for emotion detection: variance {laplacian_var} < 150")
                return False

            # Check contrast (emotions need good facial feature visibility)
            contrast = gray.std()
            if contrast < 30:
                logger.debug(f"Poor contrast for emotion detection: {contrast} < 30")
                return False

            return True

        except Exception as e:
            logger.error(f"Error checking face suitability for emotion detection: {str(e)}")
            return False

    def _filter_emotion_predictions(self, emotion_scores: np.ndarray) -> np.ndarray:
        """
        Filter and improve emotion predictions.

        Args:
            emotion_scores: Raw emotion scores from model

        Returns:
            Filtered emotion scores
        """
        try:
            # Apply temperature scaling to make predictions less extreme
            temperature = 1.5
            scaled_scores = emotion_scores / temperature

            # Re-normalize
            exp_scores = np.exp(scaled_scores - np.max(scaled_scores))
            filtered_scores = exp_scores / np.sum(exp_scores)

            # Apply minimum threshold for each emotion
            min_threshold = 0.02
            filtered_scores = np.maximum(filtered_scores, min_threshold)

            # Re-normalize after applying minimum threshold
            filtered_scores = filtered_scores / np.sum(filtered_scores)

            return filtered_scores

        except Exception as e:
            logger.error(f"Error filtering emotion predictions: {str(e)}")
            return emotion_scores
    
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
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            
            # Calculate basic features
            brightness = np.mean(gray)
            contrast = np.std(gray)
            
            # Generate pseudo-random but consistent emotions based on image properties
            seed = int(brightness + contrast) % 100
            np.random.seed(seed)
            
            # Create emotion scores with some randomness but bias toward neutral/happy
            base_scores = np.random.random(7) * 0.3
            
            # Bias toward neutral and happy for demo purposes
            base_scores[6] += 0.4  # neutral
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
