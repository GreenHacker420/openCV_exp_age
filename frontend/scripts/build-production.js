/**
 * Production Build Script
 * Handles production build with optimizations and validation
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Starting IRIS Production Build...')

// Configuration
const BUILD_CONFIG = {
  outputDir: 'out',
  modelsDir: 'public/models',
  requiredModels: [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'age_gender_model-weights_manifest.json',
    'age_gender_model-shard1',
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1'
  ]
}

// Step 1: Validate environment
console.log('\n📋 Step 1: Validating build environment...')

try {
  // Check Node.js version
  const nodeVersion = process.version
  console.log(`✓ Node.js version: ${nodeVersion}`)
  
  // Check if models exist
  console.log('\n📦 Checking AI models...')
  const modelsPath = path.join(__dirname, '..', BUILD_CONFIG.modelsDir)
  
  if (!fs.existsSync(modelsPath)) {
    throw new Error('Models directory not found. Run: node scripts/download-models.js')
  }
  
  let totalModelSize = 0
  BUILD_CONFIG.requiredModels.forEach(model => {
    const modelPath = path.join(modelsPath, model)
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Required model missing: ${model}`)
    }
    const stats = fs.statSync(modelPath)
    totalModelSize += stats.size
    console.log(`✓ ${model} (${Math.round(stats.size / 1024)}KB)`)
  })
  
  console.log(`✓ Total models size: ${Math.round(totalModelSize / 1024)}KB`)
  
} catch (error) {
  console.error('❌ Environment validation failed:', error.message)
  process.exit(1)
}

// Step 2: Clean previous build
console.log('\n🧹 Step 2: Cleaning previous build...')
try {
  const outPath = path.join(__dirname, '..', BUILD_CONFIG.outputDir)
  if (fs.existsSync(outPath)) {
    fs.rmSync(outPath, { recursive: true, force: true })
    console.log('✓ Previous build cleaned')
  }
} catch (error) {
  console.error('❌ Clean failed:', error.message)
  process.exit(1)
}

// Step 3: Run TypeScript check
console.log('\n🔍 Step 3: Running TypeScript check...')
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' })
  console.log('✓ TypeScript check passed')
} catch (error) {
  console.error('❌ TypeScript check failed')
  process.exit(1)
}

// Step 4: Run ESLint
console.log('\n🔍 Step 4: Running ESLint...')
try {
  execSync('npx eslint . --ext .ts,.tsx --max-warnings 0', { stdio: 'inherit' })
  console.log('✓ ESLint check passed')
} catch (error) {
  console.warn('⚠️ ESLint warnings found, continuing build...')
}

// Step 5: Build application
console.log('\n🏗️ Step 5: Building application...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✓ Build completed successfully')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}

// Step 6: Validate build output
console.log('\n✅ Step 6: Validating build output...')
try {
  const outPath = path.join(__dirname, '..', BUILD_CONFIG.outputDir)
  
  // Check if output directory exists
  if (!fs.existsSync(outPath)) {
    throw new Error('Build output directory not found')
  }
  
  // Check for essential files
  const essentialFiles = [
    'index.html',
    'manifest.json',
    'sw.js'
  ]
  
  essentialFiles.forEach(file => {
    const filePath = path.join(outPath, file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Essential file missing: ${file}`)
    }
    console.log(`✓ ${file} exists`)
  })
  
  // Check models in output
  const outModelsPath = path.join(outPath, 'models')
  if (!fs.existsSync(outModelsPath)) {
    throw new Error('Models not found in build output')
  }
  
  BUILD_CONFIG.requiredModels.forEach(model => {
    const modelPath = path.join(outModelsPath, model)
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model missing in output: ${model}`)
    }
  })
  console.log('✓ All models present in output')
  
  // Calculate total build size
  const calculateDirSize = (dirPath) => {
    let totalSize = 0
    const files = fs.readdirSync(dirPath)
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        totalSize += calculateDirSize(filePath)
      } else {
        totalSize += stats.size
      }
    })
    
    return totalSize
  }
  
  const totalSize = calculateDirSize(outPath)
  console.log(`✓ Total build size: ${Math.round(totalSize / 1024 / 1024 * 100) / 100}MB`)
  
} catch (error) {
  console.error('❌ Build validation failed:', error.message)
  process.exit(1)
}

// Step 7: Generate deployment info
console.log('\n📄 Step 7: Generating deployment info...')
try {
  const deploymentInfo = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    environment: 'production',
    features: [
      'Real-time face detection',
      'Age and gender estimation',
      'Emotion recognition',
      'Performance optimization',
      'PWA capabilities',
      'Mobile optimization',
      'Data export'
    ],
    requirements: {
      https: true,
      camera: true,
      modernBrowser: true
    }
  }
  
  const infoPath = path.join(__dirname, '..', BUILD_CONFIG.outputDir, 'deployment-info.json')
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2))
  console.log('✓ Deployment info generated')
  
} catch (error) {
  console.error('❌ Failed to generate deployment info:', error.message)
}

// Success message
console.log('\n🎉 Production build completed successfully!')
console.log('\n📋 Next steps:')
console.log('1. Test the build locally: npx serve out')
console.log('2. Deploy to your hosting platform')
console.log('3. Ensure HTTPS is configured for camera access')
console.log('4. Test PWA installation on mobile devices')
console.log('\n🚀 Ready for deployment!')

// Performance recommendations
console.log('\n💡 Performance recommendations:')
console.log('- Enable gzip compression on your server')
console.log('- Set proper cache headers for static assets')
console.log('- Use a CDN for global distribution')
console.log('- Monitor Core Web Vitals in production')
console.log('- Set up error tracking and analytics')
