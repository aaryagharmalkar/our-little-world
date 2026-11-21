import React from 'react'
import { X, Heart, Calendar, User, Download } from 'lucide-react'
import { Photo } from '../../types/database'
import { useCouple } from '../../context/CoupleContext'
import { formatTimeAgo } from '../../lib/geo'

interface Props {
  photo: Photo | null
  onClose: () => void
}

export const PhotoLightbox: React.FC<Props> = ({ photo, onClose }) => {
  const { toggleFavoritePhoto } = useCouple()

  if (!photo) return null

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = photo.public_url
    a.download = `our_memory_${photo.id}.jpg`
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-warm-950/90 backdrop-blur-md animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-warm-900/80 text-white/80 hover:text-white hover:bg-warm-800 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative max-w-3xl w-full flex flex-col items-center max-h-[92vh]">
        {/* Main Photograph */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black max-h-[75vh] flex items-center justify-center">
          <img
            src={photo.public_url}
            alt={photo.caption || 'Shared memory'}
            className="w-auto h-auto max-w-full max-h-[75vh] object-contain"
          />

          {/* Floating actions on photo */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={() => toggleFavoritePhoto(photo.id)}
              className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                photo.is_favorite
                  ? 'bg-rose-500/90 text-white shadow-romantic'
                  : 'bg-warm-900/60 text-white/90 hover:bg-warm-900/90'
              }`}
            >
              <Heart className={`w-5 h-5 ${photo.is_favorite ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={handleDownload}
              title="Download image"
              className="p-3 rounded-full bg-warm-900/60 backdrop-blur-md text-white/90 hover:bg-warm-900/90 transition-all active:scale-90"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Caption & Metadata Bar */}
        <div className="w-full mt-3 px-4 py-3 bg-warm-900/60 backdrop-blur-md rounded-2xl text-cream-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {photo.caption && (
              <p className="font-handwriting text-xl text-cream-100 leading-snug">
                "{photo.caption}"
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-warm-300 mt-1 font-sans">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{photo.uploader_nickname || 'Shared memory'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatTimeAgo(photo.created_at)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
