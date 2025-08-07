#!/usr/bin/env python3
"""
Test script for DEX and EmoNeXt integration.
Tests the new models with sample data to ensure they work correctly.
"""

import sys
import os
import numpy as np
import cv2
import logging

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_dex_age_estimator():
    """Test the DEX age estimator."""
    try:
        from services.dex_age_estimator import DEXAgeEstimator
        
        logger.info("Testing DEX Age Estimator...")
        
        # Create a sample face image (random noise for testing)
        sample_face = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        # Initialize the estimator
        dex_estimator = DEXAgeEstimator()
        
        # Test age estimation
        result = dex_estimator.estimate_age(sample_face)
        
        logger.info(f"DEX Age Estimation Result: {result}")
        
        # Validate result structure
        required_keys = ['age', 'confidence', 'age_range', 'method']
        for key in required_keys:
            if key not in result:
                logger.error(f"Missing key in DEX result: {key}")
                return False
        
        logger.info("DEX Age Estimator test passed!")
        return True
        
    except Exception as e:
        logger.error(f"DEX Age Estimator test failed: {str(e)}")
        return False

def test_emonext_detector():
    """Test the EmoNeXt emotion detector."""
    try:
        from services.emonext_detector import EmoNeXtDetector
        
        logger.info("Testing EmoNeXt Emotion Detector...")
        
        # Create a sample face image (random noise for testing)
        sample_face = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        # Initialize the detector
        emonext_detector = EmoNeXtDetector(model_size="tiny")
        
        # Test emotion detection
        result = emonext_detector.detect_emotion(sample_face)
        
        logger.info(f"EmoNeXt Emotion Detection Result: {result}")
        
        # Validate result structure
        required_keys = ['emotions', 'dominant_emotion', 'confidence', 'method']
        for key in required_keys:
            if key not in result:
                logger.error(f"Missing key in EmoNeXt result: {key}")
                return False
        
        # Check emotions dictionary
        emotions = result.get('emotions', {})
        expected_emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        for emotion in expected_emotions:
            if emotion not in emotions:
                logger.error(f"Missing emotion in result: {emotion}")
                return False
        
        logger.info("EmoNeXt Emotion Detector test passed!")
        return True
        
    except Exception as e:
        logger.error(f"EmoNeXt Emotion Detector test failed: {str(e)}")
        return False

def test_integrated_face_detector():
    """Test the integrated face detector with DEX and EmoNeXt."""
    try:
        from services.face_detector import FaceDetector
        
        logger.info("Testing Integrated Face Detector...")
        
        # Create a sample image with a simple face-like pattern
        sample_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Add a simple rectangular pattern to simulate a face
        cv2.rectangle(sample_image, (200, 150), (400, 350), (255, 255, 255), -1)
        cv2.rectangle(sample_image, (220, 180), (240, 200), (0, 0, 0), -1)  # Left eye
        cv2.rectangle(sample_image, (360, 180), (380, 200), (0, 0, 0), -1)  # Right eye
        cv2.rectangle(sample_image, (290, 250), (310, 280), (0, 0, 0), -1)  # Nose
        cv2.rectangle(sample_image, (270, 300), (330, 320), (0, 0, 0), -1)  # Mouth
        
        # Initialize the face detector with integrated models
        face_detector = FaceDetector(
            use_dex=True,
            use_emonext=True,
            use_insightface=True
        )
        
        # Test face detection
        faces = face_detector.detect_faces(sample_image)
        
        logger.info(f"Detected {len(faces)} faces")
        
        if faces:
            for i, face in enumerate(faces):
                logger.info(f"Face {i}: {face}")
                
                # Validate face structure
                required_keys = ['id', 'bbox', 'confidence', 'center', 'area']
                for key in required_keys:
                    if key not in face:
                        logger.error(f"Missing key in face result: {key}")
                        return False
        
        logger.info("Integrated Face Detector test passed!")
        return True
        
    except Exception as e:
        logger.error(f"Integrated Face Detector test failed: {str(e)}")
        return False

def test_video_processor():
    """Test the video processor with the new integration."""
    try:
        from services.face_detector import FaceDetector
        from services.video_processor import VideoProcessor
        
        logger.info("Testing Video Processor...")
        
        # Create a sample frame
        sample_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Add a simple face pattern
        cv2.rectangle(sample_frame, (200, 150), (400, 350), (255, 255, 255), -1)
        cv2.rectangle(sample_frame, (220, 180), (240, 200), (0, 0, 0), -1)
        cv2.rectangle(sample_frame, (360, 180), (380, 200), (0, 0, 0), -1)
        cv2.rectangle(sample_frame, (290, 250), (310, 280), (0, 0, 0), -1)
        cv2.rectangle(sample_frame, (270, 300), (330, 320), (0, 0, 0), -1)
        
        # Initialize services
        face_detector = FaceDetector(
            use_dex=True,
            use_emonext=True,
            use_insightface=True
        )
        
        video_processor = VideoProcessor(
            face_detector=face_detector,
            age_estimator=None,
            emotion_detector=None
        )
        
        # Process the frame
        results = video_processor.process_frame(sample_frame)
        
        logger.info(f"Video Processor Results: {results}")
        
        # Validate results structure
        required_keys = ['faces', 'analysis', 'frame_info']
        for key in required_keys:
            if key not in results:
                logger.error(f"Missing key in video processor results: {key}")
                return False
        
        logger.info("Video Processor test passed!")
        return True
        
    except Exception as e:
        logger.error(f"Video Processor test failed: {str(e)}")
        return False

def main():
    """Run all tests."""
    logger.info("Starting integration tests...")
    
    tests = [
        ("DEX Age Estimator", test_dex_age_estimator),
        ("EmoNeXt Detector", test_emonext_detector),
        ("Integrated Face Detector", test_integrated_face_detector),
        ("Video Processor", test_video_processor)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        logger.info(f"\n{'='*50}")
        logger.info(f"Running test: {test_name}")
        logger.info(f"{'='*50}")
        
        try:
            if test_func():
                logger.info(f"✅ {test_name} PASSED")
                passed += 1
            else:
                logger.error(f"❌ {test_name} FAILED")
        except Exception as e:
            logger.error(f"❌ {test_name} FAILED with exception: {str(e)}")
    
    logger.info(f"\n{'='*50}")
    logger.info(f"Test Results: {passed}/{total} tests passed")
    logger.info(f"{'='*50}")
    
    if passed == total:
        logger.info("🎉 All tests passed!")
        return True
    else:
        logger.error(f"💥 {total - passed} tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
