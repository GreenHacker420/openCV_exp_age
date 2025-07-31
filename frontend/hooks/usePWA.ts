/**
 * PWA Hook
 * Handles Progressive Web App installation and service worker management
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAReturn {
  isInstallable: boolean
  isInstalled: boolean
  isOfflineReady: boolean
  isUpdateAvailable: boolean
  installPWA: () => Promise<boolean>
  updatePWA: () => void
  dismissInstall: () => void
  serviceWorkerStatus: 'installing' | 'waiting' | 'active' | 'error' | null
}

export function usePWA(): UsePWAReturn {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOfflineReady, setIsOfflineReady] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'installing' | 'waiting' | 'active' | 'error' | null>(null)

  // Check if app is already installed
  useEffect(() => {
    const checkInstallation = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    checkInstallation()
  }, [])

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as PWAInstallPrompt)
      setIsInstallable(true)
      console.log('PWA: Install prompt available')
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
      console.log('PWA: App installed successfully')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          setServiceWorkerStatus('installing')
          
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })

          console.log('PWA: Service Worker registered successfully')

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New update available
                    setIsUpdateAvailable(true)
                    setServiceWorkerStatus('waiting')
                    console.log('PWA: Update available')
                  } else {
                    // First time installation
                    setIsOfflineReady(true)
                    setServiceWorkerStatus('active')
                    console.log('PWA: Offline ready')
                  }
                }
              })
            }
          })

          // Check if service worker is already controlling the page
          if (registration.active) {
            setServiceWorkerStatus('active')
            setIsOfflineReady(true)
          }

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
              setIsUpdateAvailable(true)
            }
          })

        } catch (error) {
          console.error('PWA: Service Worker registration failed:', error)
          setServiceWorkerStatus('error')
        }
      }

      registerServiceWorker()
    }
  }, [])

  // Install PWA
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.log('PWA: Install prompt not available')
      return false
    }

    try {
      await installPrompt.prompt()
      const choiceResult = await installPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted installation')
        setIsInstallable(false)
        setInstallPrompt(null)
        return true
      } else {
        console.log('PWA: User dismissed installation')
        return false
      }
    } catch (error) {
      console.error('PWA: Installation failed:', error)
      return false
    }
  }, [installPrompt])

  // Update PWA
  const updatePWA = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          // Tell the waiting service worker to skip waiting and become active
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          
          // Reload the page to use the new service worker
          window.location.reload()
        }
      })
    }
  }, [])

  // Dismiss install prompt
  const dismissInstall = useCallback(() => {
    setIsInstallable(false)
    setInstallPrompt(null)
  }, [])

  return {
    isInstallable,
    isInstalled,
    isOfflineReady,
    isUpdateAvailable,
    installPWA,
    updatePWA,
    dismissInstall,
    serviceWorkerStatus
  }
}
