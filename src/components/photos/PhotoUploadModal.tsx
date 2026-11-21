import React, { useState, useRef } from 'react'
import { X, Upload, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { useCouple } from '../../context/CoupleContext'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const PhotoUploadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { uploadPhotos } = useCouple()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setSelectedFiles((prev) => [...prev, ...files])

    // Generate previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setErrorMsg('')

    try {
      const res = await uploadPhotos(selectedFiles, caption)
      if (res.success) {
        setUploadSuccess(true)
        setTimeout(() => {
          setSelectedFiles([])
          setPreviews([])
          setCaption('')
          setUploadSuccess(false)
          setIsUploading(false)
          onClose()
        }, 1200)
      } else {
        setErrorMsg(res.error || 'Failed to upload photos.')
        setIsUploading(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setErrorMsg(message)
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-float border border-warm-200/80 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warm-100">
          <div>
            <h3 className="font-serif text-xl font-medium text-warm-900">Add Memories ♡</h3>
            <p className="text-xs text-warm-500">Upload one or multiple photos to our shared album</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-warm-400 hover:text-warm-700 rounded-full hover:bg-warm-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload State / Form */}
        {uploadSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-scale-up">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif text-lg text-warm-900">Photos Added With Love!</h4>
            <p className="text-xs text-warm-500">Your partner will see these immediately, and they are now in the hourly rotation pool.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* File Drop / Select Area */}
            {previews.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blush-200 rounded-3xl p-8 text-center bg-cream-50/60 hover:bg-blush-50/50 hover:border-blush-300 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blush-100 text-blush-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-sans text-sm font-medium text-warm-800">
                  Click to select photographs
                </p>
                <p className="text-xs text-warm-400 mt-1">
                  Supports multiple JPEG, PNG, WEBP files
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-warm-600 uppercase tracking-wider">
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'Photo' : 'Photos'} Selected
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blush-600 hover:text-blush-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add more
                  </button>
                </div>

                {/* Previews grid */}
                <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-warm-200 group">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-warm-900/70 text-white hover:bg-warm-900 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />

            {/* Caption Input */}
            <div>
              <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1.5">
                Caption / Memory Note (Optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. That sweet evening at the terrace watching sunset..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 border border-warm-200 text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-blush-300 font-sans"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-2xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleUploadSubmit}
              disabled={selectedFiles.length === 0 || isUploading}
              className={`w-full py-3.5 px-6 rounded-2xl text-white font-sans text-sm font-medium transition-all shadow-soft flex items-center justify-center gap-2 ${
                selectedFiles.length === 0 || isUploading
                  ? 'bg-warm-300 cursor-not-allowed'
                  : 'bg-blush-500 hover:bg-blush-600 shadow-romantic active:scale-98'
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compressing & Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload to Shared Album</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
