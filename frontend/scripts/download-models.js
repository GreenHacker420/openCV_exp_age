/**
 * Download Face-API.js Models
 * Downloads required AI models for face detection, age/gender estimation, and emotion recognition
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models')
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'

const MODELS = [
  // TinyFaceDetector models
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  
  // Age and Gender models
  'age_gender_model-weights_manifest.json',
  'age_gender_model-shard1',
  
  // Face Expression models
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  
  // Face Landmark models (optional)
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1'
]

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true })
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${path.basename(filepath)}`)
    
    const file = fs.createWriteStream(filepath)
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log(`✓ Downloaded: ${path.basename(filepath)}`)
        resolve()
      })
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}) // Delete partial file
        reject(err)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

async function downloadModels() {
  console.log('Downloading Face-API.js models...')
  console.log(`Target directory: ${MODELS_DIR}`)
  
  try {
    for (const model of MODELS) {
      const url = `${BASE_URL}/${model}`
      const filepath = path.join(MODELS_DIR, model)
      
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`⏭ Skipping existing: ${model}`)
        continue
      }
      
      await downloadFile(url, filepath)
    }
    
    console.log('\n✅ All models downloaded successfully!')
    console.log('Models are ready for use in the face analysis engine.')
    
  } catch (error) {
    console.error('\n❌ Error downloading models:', error.message)
    process.exit(1)
  }
}

// Run the download
downloadModels()
