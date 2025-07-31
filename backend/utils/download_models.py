#!/usr/bin/env python3
"""
Model download script for IRIS Facial Analysis Backend.
Downloads and sets up all required AI models for face detection, age estimation, and emotion recognition.
"""

import sys
import os
import logging
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from utils.model_loader import download_models, get_model_info, ensure_model_directory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('model_download.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main function to download all required models."""
    print("🎯 IRIS Facial Analysis - Model Download Utility")
    print("=" * 60)
    
    try:
        # Check if force download is requested
        force_download = '--force' in sys.argv or '-f' in sys.argv
        
        if force_download:
            print("🔄 Force download mode enabled - will re-download existing models")
        
        # Ensure model directories exist
        print("📁 Creating model directories...")
        ensure_model_directory()
        
        # Show current model status
        print("\n📊 Current model status:")
        model_info = get_model_info()
        
        for category, models in model_info.items():
            print(f"\n  {category.upper()}:")
            for model_name, info in models.items():
                status = "✅ EXISTS" if info['exists'] else "❌ MISSING"
                size_info = f" ({info['size'] / 1024 / 1024:.1f} MB)" if info['size'] > 0 else ""
                print(f"    {info['name']}: {status}{size_info}")
        
        # Download models
        print("\n🚀 Starting model download...")
        download_status = download_models(force_download=force_download)
        
        # Show results
        print("\n📋 Download Results:")
        print("-" * 40)
        
        success_count = 0
        total_count = len(download_status)
        
        for model_key, success in download_status.items():
            status_icon = "✅" if success else "❌"
            print(f"  {status_icon} {model_key}")
            if success:
                success_count += 1
        
        print("-" * 40)
        print(f"📈 Success Rate: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
        
        if success_count == total_count:
            print("\n🎉 All models downloaded successfully!")
            print("✨ Your IRIS backend is ready for facial analysis!")
        else:
            print(f"\n⚠️  {total_count - success_count} models failed to download.")
            print("🔧 Check the logs above for error details.")
            return 1
        
        # Show final model status
        print("\n📊 Final model status:")
        model_info = get_model_info()
        
        total_size = 0
        for category, models in model_info.items():
            print(f"\n  {category.upper()}:")
            for model_name, info in models.items():
                status = "✅ READY" if info['exists'] else "❌ MISSING"
                size_info = f" ({info['size'] / 1024 / 1024:.1f} MB)" if info['size'] > 0 else ""
                print(f"    {info['name']}: {status}{size_info}")
                total_size += info['size']
        
        print(f"\n💾 Total model size: {total_size / 1024 / 1024:.1f} MB")
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Download interrupted by user")
        return 1
        
    except Exception as e:
        logger.error(f"Unexpected error during model download: {str(e)}")
        print(f"\n❌ Error: {str(e)}")
        return 1

def show_help():
    """Show help information."""
    print("""
🎯 IRIS Model Download Utility

Usage:
    python utils/download_models.py [options]

Options:
    --force, -f     Force re-download of existing models
    --help, -h      Show this help message

Examples:
    python utils/download_models.py              # Download missing models
    python utils/download_models.py --force      # Re-download all models
    python utils/download_models.py --help       # Show help

Models Downloaded:
    • Face Detection: MediaPipe (built-in)
    • Age/Gender: InsightFace Buffalo_L
    • Emotion: FER2013 (placeholder)

For more advanced model management, use:
    python utils/model_loader.py [download|info|cleanup]
""")

if __name__ == '__main__':
    # Check for help flag
    if '--help' in sys.argv or '-h' in sys.argv:
        show_help()
        sys.exit(0)
    
    # Run main function
    exit_code = main()
    sys.exit(exit_code)
