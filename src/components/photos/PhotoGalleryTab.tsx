import React, { useState } from 'react'
import { Heart, Plus, Sparkles, Filter, Image as ImageIcon } from 'lucide-react'
import { useCouple } from '../../context/CoupleContext'
import { Photo } from '../../types/database'

interface Props {
  onOpenUpload: () => void
  onOpenPhotoLightbox: (photo: Photo) => void
}

export const PhotoGalleryTab: React.FC<Props> = ({ onOpenUpload, onOpenPhotoLightbox }) => {
  const { photos, currentHourlyPhoto, toggleFavoritePhoto } = useCouple()
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')

  const displayedPhotos = filter === 'favorites' ? photos.filter((p) => p.is_favorite) : photos

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto px-4 pt-2">
      {/* Title & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
            <span>Our Memories</span>
            <span className="text-blush-500 font-sans text-lg">♡</span>
          </h2>
          <p className="text-xs text-warm-500 mt-0.5">
            {photos.length} {photos.length === 1 ? 'photograph' : 'photographs'} safely preserved
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white text-xs font-sans font-medium shadow-romantic active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Photos</span>
        </button>
      </div>

      {/* Hourly Widget Rotation Notice */}
      <div className="bg-gradient-to-r from-cream-50 via-blush-50/50 to-lavender-50/40 rounded-3xl p-4 border border-blush-100 flex items-center justify-between text-xs text-warm-700 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blush-100 text-blush-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-warm-900 block font-sans">
              Widget Photo Rotation
            </span>
            <span className="text-warm-500 text-[11px]">
              Rotates approximately once every hour on both iPhones' home screen widgets.
            </span>
          </div>
        </div>
        {currentHourlyPhoto && (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-blush-200 shrink-0 ml-2">
            <img src={currentHourlyPhoto.public_url} alt="Active" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-warm-200/70 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all ${
              filter === 'all'
                ? 'bg-warm-800 text-white shadow-soft'
                : 'text-warm-500 hover:text-warm-800 hover:bg-warm-100'
            }`}
          >
            All Memories ({photos.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium flex items-center gap-1.5 transition-all ${
              filter === 'favorites'
                ? 'bg-rose-500 text-white shadow-romantic'
                : 'text-warm-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites ({photos.filter((p) => p.is_favorite).length})</span>
          </button>
        </div>

        <Filter className="w-4 h-4 text-warm-400" />
      </div>

      {/* Photo Grid */}
      {displayedPhotos.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white/60 rounded-3xl border border-warm-200/60 p-6">
          <div className="w-12 h-12 rounded-full bg-warm-100 text-warm-400 mx-auto flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-warm-800">
            {filter === 'favorites' ? 'No favorites yet' : 'Your album is waiting'}
          </h3>
          <p className="text-xs text-warm-500 max-w-xs mx-auto">
            {filter === 'favorites'
              ? 'Tap the heart icon on any memory to keep it here in your favorites!'
              : 'Add your favorite memories together to start your shared couple story.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-blush-500 text-white text-xs font-medium"
            >
              Upload First Memory
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {displayedPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhotoLightbox(photo)}
              className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-warm-100 border border-warm-200/60 shadow-soft cursor-pointer group hover:shadow-float transition-all"
            >
              <img
                src={photo.public_url}
                alt={photo.caption || 'Memory'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* Gradient overlay on hover/mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-warm-900/60 via-transparent to-transparent opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Favorite button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavoritePhoto(photo.id)
                }}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                  photo.is_favorite
                    ? 'bg-rose-500 text-white'
                    : 'bg-warm-900/40 text-white/80 hover:bg-warm-900/70'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${photo.is_favorite ? 'fill-white' : ''}`} />
              </button>

              {/* Caption preview */}
              {photo.caption && (
                <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                  <p className="font-handwriting text-sm leading-tight truncate">
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
