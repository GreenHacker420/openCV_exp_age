# IRIS Facial Analysis Platform - API Documentation

## Overview

The IRIS Facial Analysis Platform provides a comprehensive REST API and WebSocket interface for real-time facial analysis, age estimation, and emotion detection. This documentation covers all available endpoints, request/response formats, and integration examples.

## Base Configuration

### Backend Server
- **Development**: `http://127.0.0.1:5001`
- **Production**: `https://api.iris-analysis.com` (configurable)

### Authentication
Currently, the API does not require authentication. All endpoints are publicly accessible.

### Rate Limiting
- **HTTP Requests**: No explicit rate limiting (recommended: max 100 requests/minute)
- **WebSocket**: Connection-based throttling for real-time analysis

## HTTP API Endpoints

### Health & System Status

#### `GET /api/health`
Check the health status of all backend services.

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "face_detector": true,
    "age_estimator": true,
    "emotion_detector": true,
    "video_processor": true
  },
  "metrics": {
    "total_requests": 1250,
    "active_connections": 5,
    "avg_processing_time": 245.5,
    "fps": 24.8,
    "last_update": "2024-01-15T10:30:00Z"
  }
}
```

#### `GET /api/status`
Get detailed system status including resource usage.

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "system": {
    "platform": "Darwin",
    "platform_version": "23.1.0",
    "architecture": "arm64",
    "python_version": "3.11.5"
  },
  "resources": {
    "cpu_percent": 15.2,
    "memory_percent": 45.8,
    "disk_percent": 67.3
  },
  "services": { /* same as health */ },
  "metrics": { /* same as health */ }
}
```

#### `GET /api/ping`
Simple connectivity test.

**Response:**
```json
{
  "message": "pong",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### AI Models Information

#### `GET /api/models`
Get information about all loaded AI models.

**Response:**
```json
{
  "models": {
    "face_detection": {
      "name": "MediaPipe Face Detection",
      "version": "0.10.9",
      "loaded": true,
      "description": "Real-time face detection using MediaPipe",
      "capabilities": ["face_detection", "face_landmarks"],
      "status": "ready",
      "last_updated": "2024-01-15T10:30:00Z"
    },
    "age_estimation": {
      "name": "InsightFace ArcFace",
      "version": "0.7.3",
      "loaded": true,
      "description": "Age estimation using deep learning models",
      "capabilities": ["age_estimation"],
      "status": "ready",
      "last_updated": "2024-01-15T10:30:00Z"
    },
    "emotion_recognition": {
      "name": "Vision Transformer FER2013+",
      "version": "2.15.0",
      "loaded": true,
      "description": "Emotion recognition using computer vision",
      "capabilities": ["emotion_detection"],
      "status": "ready",
      "last_updated": "2024-01-15T10:30:00Z"
    }
  },
  "total_models": 3,
  "loaded_models": 3,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/models/{model_name}`
Get detailed information about a specific model.

**Parameters:**
- `model_name`: One of `face_detection`, `age_estimation`, `emotion_recognition`

**Response:**
```json
{
  "name": "face_detection",
  "loaded": true,
  "version": "0.10.9",
  "timestamp": "2024-01-15T10:30:00Z",
  "endpoint": "/api/models/face_detection"
}
```

#### `GET /api/models/capabilities`
Get information about all available model capabilities.

**Response:**
```json
{
  "capabilities": {
    "face_detection": {
      "description": "Detect faces in images and video streams",
      "input_formats": ["image/jpeg", "image/png", "video/mp4"],
      "output_format": "bounding_boxes_with_confidence",
      "real_time": true
    },
    "age_estimation": {
      "description": "Estimate age from detected faces",
      "input_formats": ["face_region"],
      "output_format": "age_value_with_confidence",
      "real_time": true
    },
    "emotion_detection": {
      "description": "Detect emotions from facial expressions",
      "input_formats": ["face_region"],
      "output_format": "emotion_probabilities",
      "real_time": true,
      "emotions": ["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Image Analysis

#### `POST /api/analyze`
Analyze a single image for faces, age, and emotions.

**Request (Form Data):**
```
Content-Type: multipart/form-data
image: [image file]
```

**Request (JSON):**
```json
{
  "image": "base64_encoded_image_data",
  "timestamp": 1705312200000,
  "options": {
    "detectFaces": true,
    "estimateAge": true,
    "detectEmotion": true,
    "detectGender": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "faces": [
      {
        "id": "face_001",
        "bbox": {
          "x": 150,
          "y": 100,
          "width": 200,
          "height": 250
        },
        "confidence": 0.95,
        "age": {
          "value": 28,
          "confidence": 0.87
        },
        "gender": {
          "value": "female",
          "confidence": 0.92
        },
        "emotion": {
          "value": "happy",
          "confidence": 0.89,
          "emotions": {
            "happy": 0.89,
            "neutral": 0.08,
            "surprised": 0.02,
            "sad": 0.01,
            "angry": 0.00,
            "fearful": 0.00,
            "disgusted": 0.00
          }
        },
        "landmarks": {
          "left_eye": { "x": 180, "y": 140 },
          "right_eye": { "x": 220, "y": 140 },
          "nose": { "x": 200, "y": 170 },
          "mouth": { "x": 200, "y": 200 }
        }
      }
    ],
    "analysis": []
  },
  "processing_time": 245.5,
  "timestamp": "2024-01-15T10:30:00Z",
  "image_info": {
    "width": 640,
    "height": 480,
    "channels": 3
  }
}
```

#### `POST /api/analyze/batch`
Analyze multiple images in a batch.

**Request:**
```json
{
  "images": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ],
  "options": {
    "detectFaces": true,
    "estimateAge": true,
    "detectEmotion": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "index": 0,
      "success": true,
      "result": { /* same as single analysis */ }
    },
    {
      "index": 1,
      "success": true,
      "result": { /* same as single analysis */ }
    }
  ],
  "total_images": 2,
  "successful_analyses": 2,
  "processing_time": 450.2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### File Upload & Management

#### `POST /api/upload`
Upload an image file for later analysis.

**Request:**
```
Content-Type: multipart/form-data
image: [image file]
```

**Response:**
```json
{
  "success": true,
  "file_id": "uuid-generated-id",
  "filename": "uuid-generated-id.jpg",
  "original_filename": "my_photo.jpg",
  "url": "/api/files/uuid-generated-id",
  "file_info": {
    "size": 245760,
    "created": "2024-01-15T10:30:00Z",
    "modified": "2024-01-15T10:30:00Z",
    "exists": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/files/{file_id}`
Retrieve an uploaded file.

**Response:** Binary file data

#### `GET /api/files/{file_id}/info`
Get information about an uploaded file.

**Response:**
```json
{
  "file_id": "uuid-generated-id",
  "filename": "uuid-generated-id.jpg",
  "url": "/api/files/uuid-generated-id",
  "file_info": {
    "size": 245760,
    "created": "2024-01-15T10:30:00Z",
    "modified": "2024-01-15T10:30:00Z",
    "exists": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/files`
List all uploaded files.

**Response:**
```json
{
  "files": [
    {
      "file_id": "uuid-1",
      "filename": "uuid-1.jpg",
      "url": "/api/files/uuid-1",
      "file_info": { /* file info object */ }
    }
  ],
  "total_files": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `DELETE /api/files/{file_id}`
Delete an uploaded file.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "file_id": "uuid-generated-id",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## WebSocket API

### Connection
Connect to the WebSocket server at `/socket.io` using Socket.IO client.

**Connection URL:** `ws://127.0.0.1:5001/socket.io`

### Events

#### Client to Server Events

##### `video_frame`
Send a video frame for real-time analysis.

**Payload:**
```json
{
  "data": "base64_encoded_image_data",
  "timestamp": 1705312200000,
  "options": {
    "detectFaces": true,
    "estimateAge": true,
    "detectEmotion": true,
    "detectGender": true
  }
}
```

##### `get_metrics`
Request current system metrics.

**Payload:** `{}`

##### `join_room`
Join a room for group analysis.

**Payload:**
```json
{
  "room": "room_name"
}
```

##### `leave_room`
Leave a room.

**Payload:**
```json
{
  "room": "room_name"
}
```

#### Server to Client Events

##### `connected`
Sent when client successfully connects.

**Payload:**
```json
{
  "status": "connected",
  "server_time": "2024-01-15T10:30:00Z",
  "services_ready": true
}
```

##### `face_detected`
Sent when faces are detected in a video frame.

**Payload:**
```json
{
  "faces": [
    {
      "id": "face_001",
      "bbox": { "x": 150, "y": 100, "width": 200, "height": 250 },
      "confidence": 0.95,
      "age": { "value": 28, "confidence": 0.87 },
      "emotion": { "value": "happy", "confidence": 0.89 }
    }
  ],
  "timestamp": 1705312200000,
  "processing_time": 45.2
}
```

##### `analysis_complete`
Sent when full analysis is complete.

**Payload:**
```json
{
  "results": {
    "faces": [ /* array of analyzed faces */ ],
    "analysis": [ /* additional analysis data */ ]
  },
  "timestamp": 1705312200000,
  "processing_time": 245.5
}
```

##### `no_faces_detected`
Sent when no faces are found in the frame.

**Payload:**
```json
{
  "timestamp": 1705312200000,
  "processing_time": 15.3
}
```

##### `metrics_update`
Sent with current system metrics.

**Payload:**
```json
{
  "total_requests": 1250,
  "active_connections": 5,
  "avg_processing_time": 245.5,
  "fps": 24.8,
  "last_update": "2024-01-15T10:30:00Z"
}
```

##### `error`
Sent when an error occurs.

**Payload:**
```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found (endpoint or resource not found)
- `413` - Payload Too Large (file size exceeds 16MB)
- `415` - Unsupported Media Type (invalid file type)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI services not ready)

### Error Response Format
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "code": 400
}
```

### Common Error Messages
- `"No image provided"` - Missing image in request
- `"File too large"` - File exceeds 16MB limit
- `"Invalid file type"` - Unsupported image format
- `"Video processor not initialized"` - AI services not ready
- `"Failed to process image data"` - Image processing error

## Frontend Integration Examples

### Using the TypeScript API Client

#### Basic Setup
```typescript
import { irisApi } from '@/lib/api'

// Initialize the API client
await irisApi.initialize()
```

#### Health Check
```typescript
const health = await irisApi.health.checkHealth()
if (health.success) {
  console.log('Backend is healthy:', health.data.status)
} else {
  console.error('Health check failed:', health.error)
}
```

#### Image Analysis
```typescript
// Analyze uploaded file
const fileInput = document.getElementById('file') as HTMLInputElement
const file = fileInput.files[0]

const result = await irisApi.analysis.analyzeImageFile(file)
if (result.success) {
  console.log('Analysis results:', result.data.results)
  console.log(`Found ${result.data.results.faces.length} faces`)
} else {
  console.error('Analysis failed:', result.error)
}
```

#### Real-time Video Analysis
```typescript
// Connect to WebSocket
await irisApi.websocket.connect()

// Listen for face detection results
irisApi.websocket.on('face_detected', (data) => {
  console.log(`Detected ${data.faces.length} faces`)
  data.faces.forEach(face => {
    console.log(`Face: age ${face.age?.value}, emotion ${face.emotion?.value}`)
  })
})

// Send video frame
const video = document.getElementById('video') as HTMLVideoElement
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

canvas.width = video.videoWidth
canvas.height = video.videoHeight
ctx.drawImage(video, 0, 0)

const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
irisApi.websocket.sendVideoFrame(imageData)
```

#### Batch Analysis
```typescript
const files = Array.from(fileInput.files)
const imagePromises = files.map(file =>
  new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
)

const images = await Promise.all(imagePromises)
const base64Images = images.map(img => img.split(',')[1])

const batchResult = await irisApi.analysis.analyzeBatch(base64Images)
if (batchResult.success) {
  console.log(`Analyzed ${batchResult.data.successful_analyses} images`)
}
```

### Using Raw HTTP Requests

#### cURL Examples

**Health Check:**
```bash
curl -X GET http://127.0.0.1:5001/api/health
```

**Image Analysis:**
```bash
curl -X POST http://127.0.0.1:5001/api/analyze \
  -F "image=@/path/to/image.jpg"
```

**File Upload:**
```bash
curl -X POST http://127.0.0.1:5001/api/upload \
  -F "image=@/path/to/image.jpg"
```

#### JavaScript Fetch Examples

**Health Check:**
```javascript
const response = await fetch('http://127.0.0.1:5001/api/health')
const health = await response.json()
console.log('Health status:', health.status)
```

**Image Analysis:**
```javascript
const formData = new FormData()
formData.append('image', fileInput.files[0])

const response = await fetch('http://127.0.0.1:5001/api/analyze', {
  method: 'POST',
  body: formData
})

const result = await response.json()
console.log('Analysis results:', result.results)
```

## Rate Limits and Best Practices

### Recommended Limits
- **HTTP API**: Maximum 100 requests per minute per client
- **WebSocket**: Maximum 30 frames per second for real-time analysis
- **File Upload**: Maximum 16MB per file, 10 files per batch

### Best Practices
1. **Error Handling**: Always check the `success` field in responses
2. **Retry Logic**: Implement exponential backoff for failed requests
3. **File Validation**: Validate file types and sizes before upload
4. **WebSocket Management**: Properly handle connection/disconnection events
5. **Resource Cleanup**: Cancel ongoing requests when components unmount
6. **Caching**: Cache model information and capabilities to reduce API calls

### Performance Optimization
- Use WebSocket for real-time analysis instead of polling HTTP endpoints
- Compress images before sending for analysis to reduce bandwidth
- Implement client-side face detection to reduce server load
- Use batch analysis for multiple images instead of individual requests
- Monitor processing times and adjust frame rates accordingly

## Troubleshooting

### Common Issues

**Connection Refused:**
- Verify backend server is running on correct port
- Check firewall settings
- Ensure CORS is properly configured

**Analysis Fails:**
- Verify image format is supported (JPEG, PNG, GIF, BMP, WebP)
- Check file size is under 16MB limit
- Ensure AI models are loaded (check `/api/models`)

**WebSocket Disconnections:**
- Implement reconnection logic with exponential backoff
- Monitor connection status and handle offline scenarios
- Check network stability and proxy configurations

**Slow Performance:**
- Reduce image resolution before analysis
- Use appropriate quality settings for base64 encoding
- Monitor system resources on backend server
- Consider using batch processing for multiple images

### Debug Mode
Enable debug logging by setting environment variable:
```bash
NEXT_PUBLIC_DEBUG_API=true
```

This will log all API requests, responses, and errors to the browser console.
