"""
MiVOLO Age Estimation Service using state-of-the-art transformer architecture.
Provides highly accurate age and gender prediction from facial images.
"""

import cv2
import numpy as np
import logging
import os
import sys
from typing import Dict, Optional, Tuple, List
from pathlib import Path

logger = logging.getLogger(__name__)

class MiVOLOAgeEstimator:
    """
    MiVOLO (Multi-input Transformer) age estimation service.
    Achieves state-of-the-art accuracy with 3.65 MAE on Lagenda dataset.
    """
    
    def __init__(self, model_path: Optional[str] = None, enable_gpu: bool = False):
        """
        Initialize the MiVOLO age estimator.

        Args:
            model_path (str): Path to the MiVOLO model weights file
            enable_gpu (bool): Whether to use GPU acceleration if available
        """
        self.enable_gpu = enable_gpu
        self.model = None
        self.device = None
        self._use_fallback = False

        # Confidence and accuracy thresholds (adjusted for real-world performance)
        self.min_confidence_threshold = 0.25  # Lowered for more realistic expectations
        self.age_variance_threshold = 15  # Maximum acceptable age variance
        self.face_size_threshold = 50    # Minimum face size for reliable prediction
        
        # Add MiVOLO path to sys.path
        mivolo_path = os.path.join(os.path.dirname(__file__), "..", "models", "mivolo")
        if mivolo_path not in sys.path:
            sys.path.append(mivolo_path)
        
        # Default model path
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__), 
                "..", "models", "mivolo", "mivolo_imdb.pth.tar"
            )
        
        self.model_path = model_path
        
        try:
            self._initialize_model()
            logger.info(f"MiVOLO age estimator initialized successfully with model: {model_path}")
        except Exception as e:
            logger.error(f"Failed to initialize MiVOLO age estimator: {str(e)}")
            self._use_fallback = True
    
    def _initialize_model(self):
        """Initialize the MiVOLO model."""
        try:
            import torch
            from mivolo.model.mi_volo import MiVOLO
            
            # Check if model file exists
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"MiVOLO model file not found: {self.model_path}")
            
            # Set device
            if self.enable_gpu and torch.cuda.is_available():
                self.device = torch.device('cuda')
                logger.info("Using GPU for MiVOLO inference")
            else:
                self.device = torch.device('cpu')
                logger.info("Using CPU for MiVOLO inference")
            
            # Initialize MiVOLO model
            self.model = MiVOLO(
                ckpt_path=self.model_path,
                device=str(self.device),
                half=False,  # Disable half precision for CPU
                disable_faces=False,
                use_persons=False,  # Face-only mode for now
                verbose=True
            )
            
            self._use_fallback = False
            logger.info("MiVOLO model loaded successfully")
            
        except ImportError as e:
            logger.warning(f"MiVOLO dependencies not available: {str(e)}, using fallback")
            self._use_fallback = True
        except Exception as e:
            logger.error(f"Failed to initialize MiVOLO model: {str(e)}")
            self._use_fallback = True
    
    def estimate_age(self, face_image: np.ndarray) -> Dict:
        """
        Estimate age from a face image using MiVOLO model.

        Args:
            face_image (np.ndarray): Face image in BGR format

        Returns:
            Dict: Age estimation results
        """
        try:
            if self._use_fallback:
                return self._fallback_age_estimation(face_image)

            # Check face quality before processing
            if not self._is_face_suitable_for_processing(face_image):
                logger.debug("Face not suitable for MiVOLO processing, using fallback")
                return self._fallback_age_estimation(face_image)

            # Preprocess the image
            processed_image = self._preprocess_image(face_image)

            # Use MiVOLO's direct model inference for face-only prediction
            # This bypasses the complex YOLO detection pipeline and uses just the neural network

            # Preprocess face image for MiVOLO
            processed_face = self._preprocess_face_for_mivolo(face_image)

            # Direct model inference
            import torch
            with torch.no_grad():
                # For face-only model, we use just the face input
                if self.model.meta.with_persons_model:
                    # Create dummy person input (zeros) since we only have face
                    person_input = torch.zeros_like(processed_face)
                    model_input = torch.cat((processed_face, person_input), dim=1)
                else:
                    model_input = processed_face

                # Run inference
                output = self.model.inference(model_input)

                # Extract age and gender from output
                if self.model.meta.only_age:
                    age_output = output
                    gender_prob = None
                else:
                    age_output = output[:, 2]  # Age is the 3rd output
                    gender_output = output[:, :2].softmax(-1)  # Gender is first 2 outputs
                    gender_prob = gender_output[0]

                # Convert age to actual value
                raw_age = age_output[0].item()
                predicted_age = raw_age * (self.model.meta.max_age - self.model.meta.min_age) + self.model.meta.avg_age
                predicted_age = max(1, min(95, round(predicted_age, 1)))  # Clamp to model's training range

                # Extract gender
                gender = 'unknown'
                gender_confidence = 0.5
                if gender_prob is not None:
                    gender_idx = gender_prob.argmax().item()
                    gender = 'male' if gender_idx == 0 else 'female'
                    gender_confidence = float(gender_prob.max().item())

                # Calculate more realistic confidence based on model uncertainty
                age_confidence = self._calculate_age_confidence(predicted_age, raw_age, gender_confidence)
            
            return {
                'age': int(round(predicted_age)),
                'confidence': age_confidence,
                'age_range': self._get_age_range(predicted_age),
                'method': 'mivolo',
                'gender': gender,
                'gender_confidence': gender_confidence
            }
            
        except Exception as e:
            logger.error(f"Error estimating age with MiVOLO: {str(e)}")
            return self._fallback_age_estimation(face_image)
    
    def _preprocess_image(self, face_image: np.ndarray) -> 'torch.Tensor':
        """
        Preprocess face image for MiVOLO model input.
        
        Args:
            face_image (np.ndarray): Input face image in BGR format
            
        Returns:
            torch.Tensor: Preprocessed image ready for model input
        """
        try:
            import torch
            import torchvision.transforms as transforms
            
            # Resize to 224x224 (standard input size for MiVOLO)
            resized = cv2.resize(face_image, (224, 224))
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            
            # Define transforms (ImageNet normalization)
            transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
            # Apply transforms
            tensor_image = transform(rgb_image)
            
            # Move to device
            tensor_image = tensor_image.to(self.device)
            
            return tensor_image
            
        except Exception as e:
            logger.error(f"Error preprocessing image for MiVOLO: {str(e)}")
            # Return a default tensor
            import torch
            return torch.zeros((3, 224, 224), device=self.device)

    def _preprocess_face_for_mivolo(self, face_image: np.ndarray) -> 'torch.Tensor':
        """
        Preprocess face image specifically for MiVOLO model direct inference.

        Args:
            face_image (np.ndarray): Input face image in BGR format

        Returns:
            torch.Tensor: Preprocessed image ready for MiVOLO model input
        """
        try:
            import torch
            from mivolo.data.misc import prepare_classification_images

            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)

            # Prepare using MiVOLO's preprocessing function
            # This handles resizing, normalization, and tensor conversion
            face_crops = [rgb_image]  # List of face crops

            processed_tensor = prepare_classification_images(
                face_crops,
                self.model.input_size,
                self.model.data_config["mean"],
                self.model.data_config["std"],
                device=self.device
            )

            return processed_tensor

        except Exception as e:
            logger.error(f"Error preprocessing face for MiVOLO: {str(e)}")
            # Return a default tensor
            import torch
            return torch.zeros((1, 3, 224, 224), device=self.device)

    def _is_face_suitable_for_processing(self, face_image: np.ndarray) -> bool:
        """
        Check if face image is suitable for reliable age estimation.

        Args:
            face_image (np.ndarray): Face image to check

        Returns:
            bool: True if face is suitable for processing
        """
        try:
            h, w = face_image.shape[:2]

            # Check minimum face size
            if min(h, w) < self.face_size_threshold:
                logger.debug(f"Face too small: {w}x{h} < {self.face_size_threshold}")
                return False

            # Check image quality (blur detection)
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            # If image is too blurry, skip MiVOLO processing
            if laplacian_var < 100:  # Threshold for blur detection
                logger.debug(f"Face too blurry: variance {laplacian_var} < 100")
                return False

            # Check brightness
            mean_brightness = np.mean(gray)
            if mean_brightness < 50 or mean_brightness > 200:
                logger.debug(f"Poor lighting: brightness {mean_brightness}")
                return False

            return True

        except Exception as e:
            logger.error(f"Error checking face suitability: {str(e)}")
            return False

    def _calculate_age_confidence(self, predicted_age: float, raw_output: float, gender_confidence: float) -> float:
        """
        Calculate realistic confidence score for age prediction.

        Args:
            predicted_age: Final predicted age
            raw_output: Raw model output
            gender_confidence: Gender prediction confidence

        Returns:
            Confidence score between 0 and 1
        """
        try:
            # Base confidence from model output certainty
            # Raw output closer to 0 or 1 indicates higher confidence
            output_certainty = 1.0 - abs(raw_output - 0.5) * 2

            # Age range confidence (model is more confident for certain age ranges)
            if 15 <= predicted_age <= 65:
                age_range_confidence = 0.9  # High confidence for typical adult ages
            elif 5 <= predicted_age <= 80:
                age_range_confidence = 0.7  # Medium confidence for extended range
            else:
                age_range_confidence = 0.5  # Lower confidence for extreme ages

            # Combine factors
            base_confidence = (output_certainty * 0.4 +
                             age_range_confidence * 0.4 +
                             gender_confidence * 0.2)

            # Apply minimum threshold
            final_confidence = max(self.min_confidence_threshold, base_confidence)

            # Boost confidence for stable predictions (temporal smoothing effect)
            if hasattr(self, '_last_age') and abs(predicted_age - self._last_age) < 2:
                final_confidence = min(0.85, final_confidence * 1.2)  # Boost for stability

            self._last_age = predicted_age

            return min(0.85, final_confidence)  # Cap at 85% to be realistic

        except Exception as e:
            logger.error(f"Error calculating age confidence: {str(e)}")
            return 0.5
    
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
    
    def _get_age_range(self, age: float) -> str:
        """
        Get age range category for a given age.
        
        Args:
            age (float): Estimated age
            
        Returns:
            str: Age range category
        """
        age = int(age)
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
                    'method': 'error',
                    'gender': 'unknown',
                    'gender_confidence': 0.1
                })
        
        return results
