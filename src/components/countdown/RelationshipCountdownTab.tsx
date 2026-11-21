import React, { useState } from 'react'
import { Calendar, Plus, Heart, Cake, Plane, Sparkles, X } from 'lucide-react'
import { useCouple } from '../../context/CoupleContext'
import { useAuth } from '../../context/AuthContext'

export const RelationshipCountdownTab: React.FC = () => {
  const { coupleSpace } = useAuth()
  const { daysTogether, daysToNextAnniversary, specialDates, createSpecialDate } = useCouple()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [isAnnual, setIsAnnual] = useState(true)
  const [icon, setIcon] = useState('heart')

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return
    await createSpecialDate(title.trim(), date, isAnnual, icon)
    setTitle('')
    setDate('')
    setIsAddOpen(false)
  }

  const getDaysUntil = (eventDateStr: string, isYearly: boolean): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(eventDateStr)
    target.setHours(0, 0, 0, 0)

    if (isYearly) {
      const thisYear = new Date(today.getFullYear(), target.getMonth(), target.getDate())
      if (thisYear.getTime() >= today.getTime()) {
        return Math.round((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }
      const nextYear = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate())
      return Math.round((nextYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'cake':
        return <Cake className="w-4 h-4 text-amber-500" />
      case 'plane':
        return <Plane className="w-4 h-4 text-sky-500" />
      default:
        return <Heart className="w-4 h-4 text-rose-500" />
    }
  }

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-warm-900 flex items-center gap-1.5">
            <span>Our Story</span>
            <span className="text-blush-500 font-sans text-lg">♡</span>
          </h2>
          <p className="text-xs text-warm-500 mt-0.5">
            Every day, milestone and countdown we celebrate hand in hand
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white text-xs font-sans font-medium shadow-romantic active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Date</span>
        </button>
      </div>

      {/* Hero Milestones Card */}
      <div className="bg-gradient-to-br from-white via-cream-50 to-blush-50/60 rounded-3xl p-6 shadow-soft border border-blush-200/70 text-center space-y-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-blush-600 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Since {coupleSpace?.relationship_start_date || 'Day One'}</span>
        </span>

        <div>
          <h3 className="font-serif text-5xl sm:text-6xl font-medium text-warm-900 tracking-tight">
            {daysTogether}
          </h3>
          <p className="font-sans text-sm font-medium text-warm-500 mt-1 uppercase tracking-wider">
            Days Together With You
          </p>
        </div>

        <div className="pt-3 border-t border-blush-100/80 flex items-center justify-around">
          <div>
            <span className="text-xs text-warm-400 font-sans">Next Anniversary</span>
            <p className="font-serif text-2xl font-medium text-blush-600">
              {daysToNextAnniversary} <span className="text-xs font-sans text-warm-500">days left</span>
            </p>
          </div>
          <div className="h-8 w-px bg-blush-100" />
          <div>
            <span className="text-xs text-warm-400 font-sans">Years Shared</span>
            <p className="font-serif text-2xl font-medium text-warm-800">
              {(daysTogether / 365.25).toFixed(1)} <span className="text-xs font-sans text-warm-500">years</span>
            </p>
          </div>
        </div>
      </div>

      {/* Special Dates List */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-warm-200/70 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-warm-400" />
            <h3 className="font-serif text-base font-medium text-warm-900">
              Important Milestones & Dates
            </h3>
          </div>
          <span className="text-xs text-warm-400 font-sans">{specialDates.length} recorded</span>
        </div>

        {specialDates.length === 0 ? (
          <p className="text-xs text-warm-400 italic">No special dates added yet.</p>
        ) : (
          <div className="divide-y divide-warm-100">
            {specialDates.map((d) => {
              const daysLeft = getDaysUntil(d.event_date, d.is_annual)
              const isPastNonAnnual = !d.is_annual && daysLeft < 0
              return (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-cream-100 border border-warm-200/70 flex items-center justify-center">
                      {renderIcon(d.icon)}
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-medium text-warm-900">
                        {d.title}
                      </h4>
                      <p className="text-[11px] text-warm-400 font-sans">
                        {d.event_date} {d.is_annual && '• Repeats yearly'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isPastNonAnnual ? (
                      <span className="text-xs text-warm-400 font-sans">
                        {Math.abs(daysLeft)} days ago
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="text-xs font-semibold text-blush-600 bg-blush-50 px-2 py-0.5 rounded-full border border-blush-200 animate-pulse">
                        Today! ♡
                      </span>
                    ) : (
                      <span className="font-serif text-base font-medium text-warm-800">
                        {daysLeft}{' '}
                        <span className="text-[11px] font-sans font-normal text-warm-400">
                          {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Date Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-float border border-warm-200/80">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100">
              <h4 className="font-serif text-lg font-medium text-warm-900">Add Milestone</h4>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-warm-400 hover:text-warm-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Our First Trip Together"
                  required
                  className="w-full px-4 py-2 rounded-xl bg-cream-50 border border-warm-200 text-sm focus:ring-2 focus:ring-blush-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl bg-cream-50 border border-warm-200 text-sm focus:ring-2 focus:ring-blush-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">
                  Icon
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'heart', label: 'Heart', icon: '💖' },
                    { id: 'cake', label: 'Birthday/Cake', icon: '🎂' },
                    { id: 'plane', label: 'Trip', icon: '✈️' },
                  ].map((ic) => (
                    <button
                      type="button"
                      key={ic.id}
                      onClick={() => setIcon(ic.id)}
                      className={`flex-1 py-2 rounded-xl border text-sm transition-all ${
                        icon === ic.id
                          ? 'border-blush-500 bg-blush-50 font-medium'
                          : 'border-warm-200 hover:bg-warm-50'
                      }`}
                    >
                      {ic.icon} {ic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="annualCheckbox"
                  checked={isAnnual}
                  onChange={(e) => setIsAnnual(e.target.checked)}
                  className="w-4 h-4 rounded text-blush-500 focus:ring-blush-400"
                />
                <label htmlFor="annualCheckbox" className="text-xs text-warm-700 cursor-pointer">
                  Repeats annually (like birthdays & anniversaries)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white text-sm font-medium shadow-romantic"
              >
                Save Milestone ♡
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
