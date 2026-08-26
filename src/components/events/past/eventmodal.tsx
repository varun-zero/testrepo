"use client"

import { motion, AnimatePresence } from "framer-motion"
import {  X } from "lucide-react"
import { ImageCarousel } from "./imagecrousal"
import { createPortal } from "react-dom"

interface Event {
  id: string
  title: string
  year: string
  date: string
  time: string
  venue: string
  description: string
  about: string
  highlights: string[]
  gallery: string[]
  link: string
}

interface EventModalProps {
  event: Event | null
  onClose: () => void
  stockImages: string[]
}

export function EventModal({ event, onClose, stockImages }: EventModalProps) {
  if (!event) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const imagesToShow = event.gallery && event.gallery.length > 0 ? event.gallery : stockImages

  return typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-5xl max-h-[85vh] rounded-xl border border-white/10 modal-smooth-scroll"
          style={{ backgroundColor: 'rgba(23, 10, 36, 0.7)', backdropFilter: 'blur(12px)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-8 text-fuchsia-100 hover:text-white transition-colors z-20"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
              <div className="p-6 sm:p-8 text-left">
              <h3 className="text-fuchsia-100 text-2xl font-heading mb-6">
                {event.title} — Event Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 text-base text-fuchsia-200 mb-6">
                <div className="space-y-1">
                  <p className="text-fuchsia-300 font-body">Date & Time</p>
                  <p className="text-fuchsia-100 font-heading">
                    {formatDate(event.date)} • {event.time}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-fuchsia-300 font-body">Venue</p>
                  <p className="text-fuchsia-100 font-heading">{event.venue}</p>
                </div>
              </div>

              <div className="mb-8">
                <ImageCarousel images={imagesToShow} eventTitle={event.title} isVisible={!!event} />
              </div>

              <div className="mb-4">
                <p className="text-fuchsia-300 text-base mb-2 font-body">Overview</p>
                <div className="space-y-3 text-fuchsia-100 text-base leading-relaxed font-body">
                  <p>{event.description}</p>
                  {event.about && <p>{event.about}</p>}
                </div>
              </div>

              {event.highlights && event.highlights.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-fuchsia-300 text-base mb-2 font-body">Highlights</p>
                    <ul className="space-y-2 list-disc list-inside">
                      {event.highlights.slice(0, Math.ceil(event.highlights.length / 2)).map((highlight, index) => (
                        <li key={index} className="text-fuchsia-100 text-base font-body">{highlight}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-fuchsia-300 text-base mb-2 font-body">Awards</p>
                    <ul className="space-y-2 list-disc list-inside">
                      {event.highlights.slice(Math.ceil(event.highlights.length / 2)).map((highlight, index) => (
                        <li key={index} className="text-fuchsia-100 text-base font-body">{highlight}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null
}
