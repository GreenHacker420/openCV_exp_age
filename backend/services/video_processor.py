"""
Video Processing Service that orchestrates facial analysis.
Combines face detection, age estimation, and emotion recognition.
"""

import cv2
import numpy as np
import logging
import time
from typing import List, Dict, Optional, Tuple
from datetime import datetime

from .face_detector import FaceDetector
from .age_estimator import AgeEstimator
from .emotion_detector import EmotionDetector
from utils.image_utils import resize_image, extract_face_region

logger = logging.getLogger(__name__)

class VideoProcessor:
    """
    Main video processing service that orchestrates all facial analysis.
    Optimized for real-time performance with configurable processing options.
    """
    
    def __init__(self, 
                 face_detector: FaceDetector,
                 age_estimator: AgeEstimator,
                 emotion_detector: EmotionDetector,
                 max_frame_size: int = 640,
                 frame_skip: int = 2,
                 enable_age: bool = True,
                 enable_emotion: bool = True,
                 enable_gender: bool = True):
        """
        Initialize the video processor.
        
        Args:
            face_detector: Face detection service
            age_estimator: Age estimation service
            emotion_detector: Emotion detection service
            max_frame_size: Maximum frame dimension for processing
            frame_skip: Process every Nth frame for performance
            enable_age: Enable age estimation
            enable_emotion: Enable emotion detection
            enable_gender: Enable gender detection
        """
        self.face_detector = face_detector
        self.age_estimator = age_estimator
        self.emotion_detector = emotion_detector
        
        self.max_frame_size = max_frame_size
        self.frame_skip = frame_skip
        self.enable_age = enable_age
        self.enable_emotion = enable_emotion
        self.enable_gender = enable_gender
        
        # Performance tracking
        self.frame_count = 0
        self.processing_times = []
        self.last_results = {}
        self.result_cache = {}
        
        logger.info("Video processor initialized")
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process a single video frame for facial analysis.
        
        Args:
            frame (np.ndarray): Input video frame in BGR format
            
        Returns:
            Dict: Processing results containing faces and analysis
        """
        start_time = time.time()
        
        try:
            # Increment frame counter
            self.frame_count += 1
            
            # Skip frames for performance if configured
            if self.frame_skip > 1 and self.frame_count % self.frame_skip != 0:
                return self.last_results
            
            # Resize frame for processing
            processed_frame = resize_image(frame, self.max_frame_size)
            
            # Detect faces
            faces = self.face_detector.detect_faces(processed_frame)
            
            # Initialize results
            results = {
                'faces': faces,
                'analysis': [],
                'frame_info': {
                    'original_size': frame.shape[:2],
                    'processed_size': processed_frame.shape[:2],
                    'frame_number': self.frame_count,
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            # Perform detailed analysis if faces detected
            if faces:
                analysis_results = self._analyze_faces(processed_frame, faces)
                results['analysis'] = analysis_results
            
            # Update performance metrics
            processing_time = (time.time() - start_time) * 1000
            self._update_performance_metrics(processing_time)
            
            # Cache results
            self.last_results = results
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return {
                'faces': [],
                'analysis': [],
                'error': str(e),
                'frame_info': {
                    'frame_number': self.frame_count,
                    'timestamp': datetime.now().isoformat()
                }
            }
    
    def _analyze_faces(self, frame: np.ndarray, faces: List[Dict]) -> List[Dict]:
        """
        Perform detailed analysis on detected faces.
        
        Args:
            frame (np.ndarray): Input frame
            faces (List[Dict]): Detected faces
            
        Returns:
            List[Dict]: Analysis results for each face
        """
        analysis_results = []
        
        try:
            # Extract face regions
            face_regions = self.face_detector.extract_face_regions(frame, faces)
            
            for i, (face, face_region) in enumerate(zip(faces, face_regions)):
                if face_region.size == 0:
                    continue
                
                face_analysis = {
                    'face_id': face['id'],
                    'bbox': face['bbox'],
                    'confidence': face['confidence']
                }
                
                # Age estimation
                if self.enable_age and self.age_estimator:
                    try:
                        age_result = self.age_estimator.estimate_age(face_region)
                        face_analysis.update({
                            'age': age_result.get('age'),
                            'age_confidence': age_result.get('confidence'),
                            'age_range': age_result.get('age_range'),
                            'age_method': age_result.get('method')
                        })
                    except Exception as e:
                        logger.error(f"Error in age estimation for face {i}: {str(e)}")
                        face_analysis.update({
                            'age': None,
                            'age_confidence': 0.0,
                            'age_error': str(e)
                        })
                
                # Emotion detection
                if self.enable_emotion and self.emotion_detector:
                    try:
                        emotion_result = self.emotion_detector.detect_emotion(face_region)
                        face_analysis.update({
                            'emotions': emotion_result.get('emotions', {}),
                            'dominant_emotion': emotion_result.get('dominant_emotion'),
                            'emotion_confidence': emotion_result.get('confidence'),
                            'emotion_method': emotion_result.get('method')
                        })
                    except Exception as e:
                        logger.error(f"Error in emotion detection for face {i}: {str(e)}")
                        face_analysis.update({
                            'emotions': {},
                            'dominant_emotion': 'neutral',
                            'emotion_confidence': 0.0,
                            'emotion_error': str(e)
                        })
                
                # Gender detection (if enabled and available)
                if self.enable_gender:
                    try:
                        # This would use the same InsightFace model as age estimation
                        # For now, we'll add a placeholder
                        gender_result = self._estimate_gender(face_region)
                        face_analysis.update({
                            'gender': gender_result.get('gender'),
                            'gender_confidence': gender_result.get('confidence')
                        })
                    except Exception as e:
                        logger.error(f"Error in gender detection for face {i}: {str(e)}")
                        face_analysis.update({
                            'gender': None,
                            'gender_confidence': 0.0,
                            'gender_error': str(e)
                        })
                
                analysis_results.append(face_analysis)
            
            return analysis_results
            
        except Exception as e:
            logger.error(f"Error analyzing faces: {str(e)}")
            return []
    
    def _estimate_gender(self, face_region: np.ndarray) -> Dict:
        """
        Estimate gender from face region.
        
        Args:
            face_region (np.ndarray): Face image
            
        Returns:
            Dict: Gender estimation result
        """
        try:
            # This is a placeholder implementation
            # In a real system, you'd use InsightFace or another gender model
            
            # Simple heuristic based on image properties (not accurate)
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray)
            
            # Pseudo-random but consistent gender assignment
            gender = 'Male' if int(brightness) % 2 == 0 else 'Female'
            confidence = 0.6  # Lower confidence for placeholder
            
            return {
                'gender': gender,
                'confidence': confidence,
                'method': 'placeholder'
            }
            
        except Exception as e:
            logger.error(f"Error estimating gender: {str(e)}")
            return {
                'gender': 'Unknown',
                'confidence': 0.0,
                'method': 'error'
            }
    
    def _update_performance_metrics(self, processing_time: float):
        """Update performance tracking metrics."""
        try:
            self.processing_times.append(processing_time)
            
            # Keep only last 100 measurements
            if len(self.processing_times) > 100:
                self.processing_times = self.processing_times[-100:]
            
        except Exception as e:
            logger.error(f"Error updating performance metrics: {str(e)}")
    
    def get_performance_metrics(self) -> Dict:
        """
        Get current performance metrics.
        
        Returns:
            Dict: Performance statistics
        """
        try:
            if not self.processing_times:
                return {
                    'avg_processing_time': 0,
                    'fps': 0,
                    'frames_processed': self.frame_count
                }
            
            avg_time = np.mean(self.processing_times)
            fps = 1000 / avg_time if avg_time > 0 else 0
            
            return {
                'avg_processing_time': avg_time,
                'min_processing_time': min(self.processing_times),
                'max_processing_time': max(self.processing_times),
                'fps': fps,
                'frames_processed': self.frame_count,
                'total_measurements': len(self.processing_times)
            }
            
        except Exception as e:
            logger.error(f"Error getting performance metrics: {str(e)}")
            return {}
    
    def reset_metrics(self):
        """Reset performance metrics."""
        self.frame_count = 0
        self.processing_times = []
        self.last_results = {}
        logger.info("Performance metrics reset")
    
    def set_processing_options(self, **kwargs):
        """
        Update processing options dynamically.
        
        Args:
            **kwargs: Processing options to update
        """
        if 'max_frame_size' in kwargs:
            self.max_frame_size = kwargs['max_frame_size']
        
        if 'frame_skip' in kwargs:
            self.frame_skip = kwargs['frame_skip']
        
        if 'enable_age' in kwargs:
            self.enable_age = kwargs['enable_age']
        
        if 'enable_emotion' in kwargs:
            self.enable_emotion = kwargs['enable_emotion']
        
        if 'enable_gender' in kwargs:
            self.enable_gender = kwargs['enable_gender']
        
        logger.info(f"Processing options updated: {kwargs}")
    
    def process_batch(self, frames: List[np.ndarray]) -> List[Dict]:
        """
        Process multiple frames in batch.
        
        Args:
            frames (List[np.ndarray]): List of video frames
            
        Returns:
            List[Dict]: List of processing results
        """
        results = []
        
        for i, frame in enumerate(frames):
            try:
                result = self.process_frame(frame)
                result['batch_index'] = i
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing frame {i} in batch: {str(e)}")
                results.append({
                    'batch_index': i,
                    'faces': [],
                    'analysis': [],
                    'error': str(e)
                })
        
        return results
    
    def get_summary_statistics(self, results: List[Dict]) -> Dict:
        """
        Generate summary statistics from processing results.
        
        Args:
            results (List[Dict]): List of processing results
            
        Returns:
            Dict: Summary statistics
        """
        try:
            total_faces = 0
            ages = []
            emotions = []
            genders = []
            
            for result in results:
                analysis = result.get('analysis', [])
                total_faces += len(analysis)
                
                for face_analysis in analysis:
                    if face_analysis.get('age'):
                        ages.append(face_analysis['age'])
                    
                    if face_analysis.get('dominant_emotion'):
                        emotions.append(face_analysis['dominant_emotion'])
                    
                    if face_analysis.get('gender'):
                        genders.append(face_analysis['gender'])
            
            # Calculate statistics
            age_stats = self.age_estimator.get_age_statistics(ages) if ages else {}
            emotion_stats = self.emotion_detector.get_emotion_statistics(
                [{'dominant_emotion': e, 'emotions': {}} for e in emotions]
            ) if emotions else {}
            
            gender_counts = {}
            for gender in genders:
                gender_counts[gender] = gender_counts.get(gender, 0) + 1
            
            return {
                'total_frames': len(results),
                'total_faces': total_faces,
                'avg_faces_per_frame': total_faces / len(results) if results else 0,
                'age_statistics': age_stats,
                'emotion_statistics': emotion_stats,
                'gender_distribution': gender_counts,
                'performance': self.get_performance_metrics()
            }
            
        except Exception as e:
            logger.error(f"Error generating summary statistics: {str(e)}")
            return {}
