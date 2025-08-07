#!/usr/bin/env python3
"""
Performance test script for the integrated DEX and EmoNeXt models.
Tests real-time performance with frame skip=2 and max 3 faces processing.
"""

import sys
import os
import numpy as np
import cv2
import time
import logging

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_image_with_faces(width=640, height=480, num_faces=5):
    """Create a test image with simulated face regions."""
    image = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    
    # Add face-like rectangular patterns
    face_positions = [
        (100, 100, 150, 200),  # x, y, w, h
        (300, 150, 120, 160),
        (500, 200, 140, 180),
        (200, 300, 130, 170),
        (400, 350, 110, 150)
    ]
    
    for i, (x, y, w, h) in enumerate(face_positions[:num_faces]):
        # Face background
        cv2.rectangle(image, (x, y), (x + w, y + h), (220, 200, 180), -1)
        
        # Eyes
        eye_y = y + h // 4
        cv2.rectangle(image, (x + w//4, eye_y), (x + w//4 + 15, eye_y + 10), (0, 0, 0), -1)
        cv2.rectangle(image, (x + 3*w//4 - 15, eye_y), (x + 3*w//4, eye_y + 10), (0, 0, 0), -1)
        
        # Nose
        nose_y = y + h // 2
        cv2.rectangle(image, (x + w//2 - 5, nose_y), (x + w//2 + 5, nose_y + 15), (150, 120, 100), -1)
        
        # Mouth
        mouth_y = y + 3*h // 4
        cv2.rectangle(image, (x + w//3, mouth_y), (x + 2*w//3, mouth_y + 8), (100, 50, 50), -1)
    
    return image

def test_face_detector_performance():
    """Test the face detector performance with multiple faces."""
    try:
        from services.face_detector import FaceDetector
        
        logger.info("Testing Face Detector Performance...")
        
        # Initialize the face detector
        face_detector = FaceDetector(
            use_dex=True,
            use_emonext=True,
            use_insightface=True,
            max_faces=3  # Limit to 3 faces for performance
        )
        
        # Create test images
        test_images = [
            create_test_image_with_faces(num_faces=1),
            create_test_image_with_faces(num_faces=3),
            create_test_image_with_faces(num_faces=5),  # Should be limited to 3
        ]
        
        total_time = 0
        total_frames = 0
        
        for i, test_image in enumerate(test_images):
            logger.info(f"Testing image {i+1} with simulated faces...")
            
            # Measure processing time
            start_time = time.time()
            faces = face_detector.detect_faces(test_image)
            processing_time = (time.time() - start_time) * 1000
            
            total_time += processing_time
            total_frames += 1
            
            logger.info(f"Image {i+1}: {len(faces)} faces detected in {processing_time:.2f}ms")
            
            # Check if faces have the required attributes
            for j, face in enumerate(faces):
                required_keys = ['id', 'bbox', 'confidence', 'age', 'dominant_emotion']
                missing_keys = [key for key in required_keys if key not in face]
                if missing_keys:
                    logger.warning(f"Face {j} missing keys: {missing_keys}")
                else:
                    logger.info(f"Face {j}: age={face.get('age')}, emotion={face.get('dominant_emotion')}, confidence={face.get('confidence', 0):.2f}")
        
        # Calculate average performance
        avg_time = total_time / total_frames
        fps = 1000 / avg_time if avg_time > 0 else 0
        
        logger.info(f"Performance Summary:")
        logger.info(f"  Average processing time: {avg_time:.2f}ms")
        logger.info(f"  Estimated FPS: {fps:.1f}")
        logger.info(f"  Target for real-time (30 FPS): {33.33:.2f}ms")
        
        # Check if performance meets real-time requirements
        if avg_time <= 33.33:  # 30 FPS requirement
            logger.info("✅ Performance meets real-time requirements!")
            return True
        else:
            logger.warning("⚠️ Performance may not meet real-time requirements")
            return False
            
    except Exception as e:
        logger.error(f"Performance test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_frame_skip_simulation():
    """Test frame skip simulation (frame skip=2)."""
    try:
        from services.video_processor import VideoProcessor
        from services.face_detector import FaceDetector
        
        logger.info("Testing Frame Skip Simulation...")
        
        # Initialize services
        face_detector = FaceDetector(
            use_dex=True,
            use_emonext=True,
            use_insightface=True
        )
        
        video_processor = VideoProcessor(
            face_detector=face_detector,
            age_estimator=None,
            emotion_detector=None,
            frame_skip=2  # Process every 2nd frame
        )
        
        # Simulate multiple frames
        frames = [create_test_image_with_faces(num_faces=2) for _ in range(6)]
        
        total_time = 0
        processed_frames = 0
        
        for i, frame in enumerate(frames):
            start_time = time.time()
            results = video_processor.process_frame(frame)
            processing_time = (time.time() - start_time) * 1000
            
            if results != video_processor.last_results or i == 0:  # Frame was actually processed
                processed_frames += 1
                total_time += processing_time
                logger.info(f"Frame {i+1}: Processed in {processing_time:.2f}ms, {len(results.get('faces', []))} faces")
            else:
                logger.info(f"Frame {i+1}: Skipped (using cached results)")
        
        avg_time = total_time / processed_frames if processed_frames > 0 else 0
        logger.info(f"Frame Skip Performance:")
        logger.info(f"  Frames processed: {processed_frames}/{len(frames)}")
        logger.info(f"  Average processing time: {avg_time:.2f}ms")
        logger.info(f"  Effective FPS with skip=2: {1000/(avg_time/2):.1f}" if avg_time > 0 else "N/A")
        
        return True
        
    except Exception as e:
        logger.error(f"Frame skip test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_memory_usage():
    """Test memory usage of the models."""
    try:
        import psutil
        import gc
        
        logger.info("Testing Memory Usage...")
        
        # Get initial memory usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        logger.info(f"Initial memory usage: {initial_memory:.1f} MB")
        
        # Initialize models
        from services.face_detector import FaceDetector
        
        face_detector = FaceDetector(
            use_dex=True,
            use_emonext=True,
            use_insightface=True
        )
        
        after_init_memory = process.memory_info().rss / 1024 / 1024  # MB
        logger.info(f"Memory after model initialization: {after_init_memory:.1f} MB")
        logger.info(f"Memory increase: {after_init_memory - initial_memory:.1f} MB")
        
        # Process some frames
        test_image = create_test_image_with_faces(num_faces=3)
        
        for i in range(5):
            faces = face_detector.detect_faces(test_image)
            if i == 0:
                after_first_inference = process.memory_info().rss / 1024 / 1024  # MB
                logger.info(f"Memory after first inference: {after_first_inference:.1f} MB")
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        logger.info(f"Final memory usage: {final_memory:.1f} MB")
        
        # Force garbage collection
        gc.collect()
        after_gc_memory = process.memory_info().rss / 1024 / 1024  # MB
        logger.info(f"Memory after garbage collection: {after_gc_memory:.1f} MB")
        
        return True
        
    except ImportError:
        logger.warning("psutil not available, skipping memory test")
        return True
    except Exception as e:
        logger.error(f"Memory test failed: {str(e)}")
        return False

def main():
    """Run all performance tests."""
    logger.info("Starting Performance Tests...")
    logger.info("="*60)
    
    tests = [
        ("Face Detector Performance", test_face_detector_performance),
        ("Frame Skip Simulation", test_frame_skip_simulation),
        ("Memory Usage", test_memory_usage)
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
    logger.info(f"Performance Test Results: {passed}/{total} tests passed")
    logger.info(f"{'='*60}")
    
    if passed == total:
        logger.info("🎉 All performance tests passed!")
        return True
    else:
        logger.error(f"💥 {total - passed} performance tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
