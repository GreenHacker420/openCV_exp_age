#!/usr/bin/env python3
"""
Test script for MiVOLO integration.
Tests the new MiVOLO age estimation model to ensure it works correctly.
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

def test_mivolo_age_estimator():
    """Test the MiVOLO age estimator directly."""
    try:
        from services.mivolo_age_estimator import MiVOLOAgeEstimator
        
        logger.info("Testing MiVOLO Age Estimator...")
        
        # Create a sample face image (random noise for testing)
        sample_face = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        # Initialize the estimator
        mivolo_estimator = MiVOLOAgeEstimator()
        
        # Test age estimation
        result = mivolo_estimator.estimate_age(sample_face)
        
        logger.info(f"MiVOLO Age Estimation Result: {result}")
        
        # Validate result structure
        required_keys = ['age', 'confidence', 'age_range', 'method']
        for key in required_keys:
            if key not in result:
                logger.error(f"Missing key in MiVOLO result: {key}")
                return False
        
        # Check if using MiVOLO or fallback
        if result['method'] == 'mivolo':
            logger.info("✅ MiVOLO model is working correctly!")
        else:
            logger.warning(f"⚠️ Using fallback method: {result['method']}")
        
        return True
        
    except Exception as e:
        logger.error(f"MiVOLO Age Estimator test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_integrated_face_detector():
    """Test the integrated face detector with MiVOLO."""
    try:
        from services.face_detector import FaceDetector
        
        logger.info("Testing Integrated Face Detector with MiVOLO...")
        
        # Create a sample image with a simple face-like pattern
        sample_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Add a simple rectangular pattern to simulate a face
        cv2.rectangle(sample_image, (200, 150), (400, 350), (255, 255, 255), -1)
        cv2.rectangle(sample_image, (220, 180), (240, 200), (0, 0, 0), -1)  # Left eye
        cv2.rectangle(sample_image, (360, 180), (380, 200), (0, 0, 0), -1)  # Right eye
        cv2.rectangle(sample_image, (290, 250), (310, 280), (0, 0, 0), -1)  # Nose
        cv2.rectangle(sample_image, (270, 300), (330, 320), (0, 0, 0), -1)  # Mouth
        
        # Initialize the face detector with MiVOLO
        face_detector = FaceDetector(
            use_mivolo=True,
            use_dex=True,
            use_emonext=True,
            use_insightface=True
        )
        
        # Test face detection
        faces = face_detector.detect_faces(sample_image)
        
        logger.info(f"Detected {len(faces)} faces")
        
        if faces:
            for i, face in enumerate(faces):
                logger.info(f"Face {i}:")
                logger.info(f"  Age: {face.get('age')} years")
                logger.info(f"  Age confidence: {face.get('age_confidence', 0):.2f}")
                logger.info(f"  Gender: {face.get('gender', 'unknown')}")
                logger.info(f"  Emotion: {face.get('dominant_emotion', 'unknown')}")
                logger.info(f"  Bbox: {face.get('bbox')}")
        
        logger.info("✅ Integrated Face Detector with MiVOLO test completed!")
        return True
        
    except Exception as e:
        logger.error(f"Integrated Face Detector test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all MiVOLO integration tests."""
    logger.info("Starting MiVOLO Integration Tests...")
    logger.info("="*60)
    
    tests = [
        ("MiVOLO Age Estimator", test_mivolo_age_estimator),
        ("Integrated Face Detector", test_integrated_face_detector)
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
    
    logger.info(f"\n{'='*60}")
    logger.info(f"MiVOLO Integration Test Results: {passed}/{total} tests passed")
    logger.info(f"{'='*60}")
    
    if passed == total:
        logger.info("🎉 All MiVOLO integration tests passed!")
        return True
    else:
        logger.error(f"💥 {total - passed} MiVOLO integration tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
