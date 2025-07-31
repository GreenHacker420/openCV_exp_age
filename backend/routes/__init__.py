"""API routes package for IRIS Facial Analysis Backend."""

from .health import health_bp
from .models import models_bp
from .analysis import analysis_bp
from .upload import upload_bp

__all__ = ['health_bp', 'models_bp', 'analysis_bp', 'upload_bp']
