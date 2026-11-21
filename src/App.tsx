import React, { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { CoupleProvider, useCouple } from './context/CoupleContext'
import { Header } from './components/common/Header'
import { BottomNav } from './components/common/BottomNav'
import { DashboardTab } from './components/dashboard/DashboardTab'
import { PhotoGalleryTab } from './components/photos/PhotoGalleryTab'
import { MessagesTab } from './components/messages/MessagesTab'
import { VirtualInteractionsTab } from './components/interactions/VirtualInteractionsTab'
import { MoreMenuTab } from './components/common/MoreMenuTab'
import { MoodCheckinTab } from './components/mood/MoodCheckinTab'
import { DailyQuestionTab } from './components/questions/DailyQuestionTab'
import { RelationshipCountdownTab } from './components/countdown/RelationshipCountdownTab'
import { LocationDistanceTab } from './components/location/LocationDistanceTab'
import { WidgetPreviewTab } from './components/widget/WidgetPreviewTab'
import { PhotoUploadModal } from './components/photos/PhotoUploadModal'
import { PhotoLightbox } from './components/photos/PhotoLightbox'
import { CouplePairingModal } from './components/pairing/CouplePairingModal'
import { AuthModal } from './components/auth/AuthModal'
import { InteractionCelebrationOverlay } from './components/interactions/InteractionCelebrationOverlay'
import { Photo } from './types/database'

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, latestInteraction, markInteractionOpened } = useCouple()

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isPairingOpen, setIsPairingOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // Handle URL deep links (e.g. from Scriptable widget or invitation link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const inviteParam = params.get('invite')

    if (inviteParam) {
      setIsPairingOpen(true)
    } else if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [setActiveTab])

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-warm-900 selection:bg-blush-200">
      {/* Top Header */}
      <Header
        onOpenPairing={() => setIsPairingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Tab View */}
      <main className="flex-1 w-full pt-2">
        {activeTab === 'dashboard' && (
          <DashboardTab
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenPhotoLightbox={(p) => setSelectedPhoto(p as Photo)}
          />
        )}
        {activeTab === 'photos' && (
          <PhotoGalleryTab
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenPhotoLightbox={(p) => setSelectedPhoto(p)}
          />
        )}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'interactions' && <VirtualInteractionsTab />}
        {activeTab === 'more' && (
          <MoreMenuTab onOpenPairing={() => setIsPairingOpen(true)} />
        )}
        {activeTab === 'mood' && <MoodCheckinTab />}
        {activeTab === 'questions' && <DailyQuestionTab />}
        {activeTab === 'countdown' && <RelationshipCountdownTab />}
        {activeTab === 'location' && <LocationDistanceTab />}
        {activeTab === 'widget' && <WidgetPreviewTab />}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav />

      {/* Floating Modals */}
      <PhotoUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <PhotoLightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />

      <CouplePairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Fullscreen Interaction Overlay on arrival of Hug/Kiss */}
      <InteractionCelebrationOverlay
        interaction={latestInteraction}
        onClose={() => {
          if (latestInteraction) {
            markInteractionOpened(latestInteraction.id)
          }
        }}
      />
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <MainContent />
      </CoupleProvider>
    </AuthProvider>
  )
}

export default App
