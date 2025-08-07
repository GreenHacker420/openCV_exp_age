"""
Face Tracking and Temporal Smoothing Service
Provides consistent age and emotion predictions across frames by tracking faces
and applying temporal smoothing to reduce fluctuations.
"""

import numpy as np
import cv2
import logging
from typing import Dict, List, Optional, Tuple
from collections import deque
import time

logger = logging.getLogger(__name__)

class FaceTracker:
    """
    Tracks faces across frames and applies temporal smoothing to predictions.
    """
    
    def __init__(self, 
                 max_tracks: int = 3,
                 max_age_history: int = 10,
                 max_emotion_history: int = 5,
                 iou_threshold: float = 0.3,
                 max_missing_frames: int = 10):
        """
        Initialize face tracker.
        
        Args:
            max_tracks: Maximum number of faces to track simultaneously
            max_age_history: Number of age predictions to keep for smoothing
            max_emotion_history: Number of emotion predictions to keep for smoothing
            iou_threshold: IoU threshold for face matching
            max_missing_frames: Maximum frames a face can be missing before removal
        """
        self.max_tracks = max_tracks
        self.max_age_history = max_age_history
        self.max_emotion_history = max_emotion_history
        self.iou_threshold = iou_threshold
        self.max_missing_frames = max_missing_frames
        
        # Track storage
        self.tracks: Dict[int, Dict] = {}
        self.next_track_id = 0
        self.frame_count = 0
        
    def calculate_iou(self, box1: List[int], box2: List[int]) -> float:
        """
        Calculate Intersection over Union (IoU) between two bounding boxes.
        
        Args:
            box1, box2: Bounding boxes in format [x, y, w, h]
            
        Returns:
            IoU value between 0 and 1
        """
        try:
            x1, y1, w1, h1 = box1
            x2, y2, w2, h2 = box2
            
            # Convert to [x1, y1, x2, y2] format
            box1_coords = [x1, y1, x1 + w1, y1 + h1]
            box2_coords = [x2, y2, x2 + w2, y2 + h2]
            
            # Calculate intersection
            x_left = max(box1_coords[0], box2_coords[0])
            y_top = max(box1_coords[1], box2_coords[1])
            x_right = min(box1_coords[2], box2_coords[2])
            y_bottom = min(box1_coords[3], box2_coords[3])
            
            if x_right < x_left or y_bottom < y_top:
                return 0.0
            
            intersection = (x_right - x_left) * (y_bottom - y_top)
            
            # Calculate union
            area1 = w1 * h1
            area2 = w2 * h2
            union = area1 + area2 - intersection
            
            if union == 0:
                return 0.0
            
            return intersection / union
            
        except Exception as e:
            logger.error(f"Error calculating IoU: {str(e)}")
            return 0.0
    
    def match_faces_to_tracks(self, faces: List[Dict]) -> List[Tuple[int, Optional[int]]]:
        """
        Match detected faces to existing tracks.
        
        Args:
            faces: List of detected faces with bbox information
            
        Returns:
            List of (face_index, track_id) pairs. track_id is None for new faces.
        """
        matches = []
        used_track_ids = set()
        
        for face_idx, face in enumerate(faces):
            best_track_id = None
            best_iou = 0.0
            
            face_bbox = face.get('bbox', [0, 0, 0, 0])
            
            # Find best matching track
            for track_id, track in self.tracks.items():
                if track_id in used_track_ids:
                    continue
                
                track_bbox = track.get('last_bbox', [0, 0, 0, 0])
                iou = self.calculate_iou(face_bbox, track_bbox)
                
                if iou > best_iou and iou > self.iou_threshold:
                    best_iou = iou
                    best_track_id = track_id
            
            if best_track_id is not None:
                used_track_ids.add(best_track_id)
            
            matches.append((face_idx, best_track_id))
        
        return matches
    
    def smooth_age_prediction(self, track_id: int, new_age: float, confidence: float) -> Tuple[float, float]:
        """
        Apply temporal smoothing to age predictions.
        
        Args:
            track_id: Track identifier
            new_age: New age prediction
            confidence: Confidence of new prediction
            
        Returns:
            Smoothed age and confidence
        """
        track = self.tracks[track_id]
        
        # Add new prediction to history
        track['age_history'].append({
            'age': new_age,
            'confidence': confidence,
            'frame': self.frame_count
        })
        
        # Keep only recent history
        if len(track['age_history']) > self.max_age_history:
            track['age_history'].popleft()
        
        # Calculate weighted average (higher weight for higher confidence)
        total_weight = 0.0
        weighted_sum = 0.0
        
        for pred in track['age_history']:
            # Give more weight to recent predictions and high confidence
            recency_weight = 1.0 - (self.frame_count - pred['frame']) / self.max_age_history
            weight = pred['confidence'] * recency_weight
            
            weighted_sum += pred['age'] * weight
            total_weight += weight
        
        if total_weight > 0:
            smoothed_age = weighted_sum / total_weight
            # Calculate average confidence
            avg_confidence = sum(p['confidence'] for p in track['age_history']) / len(track['age_history'])
        else:
            smoothed_age = new_age
            avg_confidence = confidence
        
        return smoothed_age, avg_confidence
    
    def smooth_emotion_prediction(self, track_id: int, emotions: Dict[str, float], 
                                dominant_emotion: str, confidence: float) -> Tuple[Dict[str, float], str, float]:
        """
        Apply temporal smoothing to emotion predictions.
        
        Args:
            track_id: Track identifier
            emotions: Emotion probability dictionary
            dominant_emotion: Dominant emotion
            confidence: Confidence of prediction
            
        Returns:
            Smoothed emotions, dominant emotion, and confidence
        """
        track = self.tracks[track_id]
        
        # Add new prediction to history
        track['emotion_history'].append({
            'emotions': emotions.copy(),
            'dominant_emotion': dominant_emotion,
            'confidence': confidence,
            'frame': self.frame_count
        })
        
        # Keep only recent history
        if len(track['emotion_history']) > self.max_emotion_history:
            track['emotion_history'].popleft()
        
        # Calculate smoothed emotions
        emotion_names = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        smoothed_emotions = {emotion: 0.0 for emotion in emotion_names}
        total_weight = 0.0
        
        for pred in track['emotion_history']:
            # Give more weight to recent predictions
            recency_weight = 1.0 - (self.frame_count - pred['frame']) / self.max_emotion_history
            weight = pred['confidence'] * recency_weight
            
            for emotion in emotion_names:
                if emotion in pred['emotions']:
                    smoothed_emotions[emotion] += pred['emotions'][emotion] * weight
            
            total_weight += weight
        
        if total_weight > 0:
            for emotion in smoothed_emotions:
                smoothed_emotions[emotion] /= total_weight
        else:
            smoothed_emotions = emotions
        
        # Find dominant emotion
        smoothed_dominant = max(smoothed_emotions.items(), key=lambda x: x[1])[0]
        smoothed_confidence = smoothed_emotions[smoothed_dominant]
        
        return smoothed_emotions, smoothed_dominant, smoothed_confidence
    
    def update_tracks(self, faces: List[Dict]) -> List[Dict]:
        """
        Update face tracks with new detections and apply temporal smoothing.
        
        Args:
            faces: List of detected faces
            
        Returns:
            List of faces with smoothed predictions and track IDs
        """
        self.frame_count += 1
        
        # Match faces to existing tracks
        matches = self.match_faces_to_tracks(faces)
        
        # Update existing tracks and create new ones
        updated_faces = []
        active_track_ids = set()
        
        for face_idx, track_id in matches:
            face = faces[face_idx].copy()
            
            if track_id is None:
                # Create new track
                if len(self.tracks) < self.max_tracks:
                    track_id = self.next_track_id
                    self.next_track_id += 1
                    
                    self.tracks[track_id] = {
                        'age_history': deque(),
                        'emotion_history': deque(),
                        'last_bbox': face.get('bbox', [0, 0, 0, 0]),
                        'last_seen': self.frame_count,
                        'created_frame': self.frame_count
                    }
                else:
                    # Skip if we've reached max tracks
                    updated_faces.append(face)
                    continue
            
            # Update track
            track = self.tracks[track_id]
            track['last_bbox'] = face.get('bbox', [0, 0, 0, 0])
            track['last_seen'] = self.frame_count
            active_track_ids.add(track_id)
            
            # Apply temporal smoothing
            if face.get('age') is not None:
                smoothed_age, smoothed_age_conf = self.smooth_age_prediction(
                    track_id, face['age'], face.get('age_confidence', 0.5)
                )
                face['age'] = round(smoothed_age, 1)
                face['age_confidence'] = smoothed_age_conf
            
            if face.get('emotions') is not None:
                smoothed_emotions, smoothed_dominant, smoothed_emotion_conf = self.smooth_emotion_prediction(
                    track_id, face.get('emotions', {}), 
                    face.get('dominant_emotion', 'neutral'),
                    face.get('emotion_confidence', 0.5)
                )
                face['emotions'] = smoothed_emotions
                face['dominant_emotion'] = smoothed_dominant
                face['emotion_confidence'] = smoothed_emotion_conf
            
            # Add track information
            face['track_id'] = track_id
            face['track_age'] = self.frame_count - track['created_frame']
            
            updated_faces.append(face)
        
        # Remove old tracks
        tracks_to_remove = []
        for track_id, track in self.tracks.items():
            if (track_id not in active_track_ids and 
                self.frame_count - track['last_seen'] > self.max_missing_frames):
                tracks_to_remove.append(track_id)
        
        for track_id in tracks_to_remove:
            del self.tracks[track_id]
            logger.debug(f"Removed track {track_id} due to inactivity")
        
        return updated_faces
    
    def get_track_statistics(self) -> Dict:
        """Get statistics about current tracks."""
        return {
            'active_tracks': len(self.tracks),
            'frame_count': self.frame_count,
            'track_ids': list(self.tracks.keys())
        }
