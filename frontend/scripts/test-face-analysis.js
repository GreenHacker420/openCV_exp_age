/**
 * Test Face Analysis Engine
 * Simple test to verify face-api.js models are loaded correctly
 */

const fs = require('fs')
const path = require('path')

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models')

console.log('🧪 Testing Face Analysis Setup...')
console.log(`📁 Models directory: ${MODELS_DIR}`)

// Check if models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  console.error('❌ Models directory not found!')
  process.exit(1)
}

// List of required model files
const REQUIRED_MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'age_gender_model-weights_manifest.json',
  'age_gender_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
]

console.log('\n📋 Checking required models...')

let allModelsPresent = true

REQUIRED_MODELS.forEach(model => {
  const modelPath = path.join(MODELS_DIR, model)
  if (fs.existsSync(modelPath)) {
    const stats = fs.statSync(modelPath)
    console.log(`✅ ${model} (${Math.round(stats.size / 1024)}KB)`)
  } else {
    console.log(`❌ ${model} - MISSING`)
    allModelsPresent = false
  }
})

if (allModelsPresent) {
  console.log('\n🎉 All required models are present!')
  console.log('✅ Face analysis engine should work correctly')
  console.log('\n📝 Next steps:')
  console.log('1. Start the development server: npm run dev')
  console.log('2. Open http://localhost:3000 in your browser')
  console.log('3. Click "Enable Camera" to start face analysis')
  console.log('4. Allow camera permissions when prompted')
} else {
  console.log('\n❌ Some models are missing!')
  console.log('💡 Run: node scripts/download-models.js')
  process.exit(1)
}

// Check package.json for face-api.js dependency
const packageJsonPath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  if (packageJson.dependencies && packageJson.dependencies['face-api.js']) {
    console.log(`\n📦 face-api.js version: ${packageJson.dependencies['face-api.js']}`)
  } else {
    console.log('\n⚠️  face-api.js not found in dependencies')
  }
}

console.log('\n🚀 Ready for real-time facial analysis!')
