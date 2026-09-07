"use client"

import { motion } from "framer-motion"
import { Instagram, Youtube } from "lucide-react"
import { FaLinkedinIn } from "react-icons/fa"
import { SiGmail } from "react-icons/si"
import { useEffect, useState } from "react"

export default function SocialSidebar() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const footer = document.getElementById("footer")
    if (!footer) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry) {
          setIsVisible(!entry.isIntersecting)
        }
      },
      { rootMargin: "0px", threshold: 0.1 }
    )

    observer.observe(footer)

    return () => observer.disconnect()
  }, [])

  const socialLinks = [
    { 
      id: "email",
      icon: SiGmail, 
      href: "https://mail.google.com/mail/?view=cm&fs=1&to=nsdc@vcet.edu.in", 
      label: "Email",
      color: "", // Colored via SVG gradient
      glowClass: "hover:shadow-[0_0_20px_rgba(255,107,107,0.6)] border-red-400/40 shadow-[0_0_12px_rgba(255,107,107,0.3)] hover:bg-red-500/10",
      iconClass: "drop-shadow-[0_0_6px_rgba(255,107,107,0.4)]"
    },
    { 
      id: "linkedin",
      icon: FaLinkedinIn, 
      href: "https://www.linkedin.com/in/vcet-nsdc/", 
      label: "LinkedIn",
      color: "text-blue-500",
      glowClass: "hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.4)] hover:bg-blue-500/10",
      iconClass: "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
    },
    { 
      id: "youtube",
      icon: Youtube, 
      href: "https://www.youtube.com/channel/UCjBw5a7WU00GwkxaTjF9jqg", 
      label: "YouTube",
      color: "text-red-500",
      glowClass: "hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)] hover:bg-red-500/10",
      iconClass: "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
    },
    { 
      id: "instagram",
      icon: Instagram, 
      href: "https://www.instagram.com/vcet.nsdc/", 
      label: "Instagram",
      color: "", 
      glowClass: "hover:shadow-[0_0_20px_rgba(219,39,119,0.6)] border-pink-500/50 shadow-[0_0_12px_rgba(219,39,119,0.4)] hover:bg-pink-500/10",
      iconClass: "drop-shadow-[0_0_8px_rgba(219,39,119,0.8)]"
    },
  ]

  return (
    <>
      <svg width="0" height="0" className="absolute" style={{ width: 0, height: 0, position: 'absolute' }}>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop stopColor="#f09433" offset="0%" />
          <stop stopColor="#e6683c" offset="25%" />
          <stop stopColor="#dc2743" offset="50%" />
          <stop stopColor="#cc2366" offset="75%" />
          <stop stopColor="#bc1888" offset="100%" />
        </linearGradient>

        <linearGradient id="gmail-smooth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#FF3366" offset="0%" />
          <stop stopColor="#FF6633" offset="30%" />
          <stop stopColor="#FFCC00" offset="50%" />
          <stop stopColor="#33CC66" offset="75%" />
          <stop stopColor="#3399FF" offset="100%" />
        </linearGradient>
      </svg>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: isVisible ? 0 : -100, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
        style={{ pointerEvents: isVisible ? "auto" : "none" }}
      >
        <div className="flex flex-col space-y-6">
          {socialLinks.map((social, index) => {
            const Icon = social.icon
            return (
              <motion.a
                key={social.label}
                href={social.href}
                target={social.href.startsWith('mailto:') ? undefined : "_blank"}
                rel={social.href.startsWith('mailto:') ? undefined : "noopener noreferrer"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 border ${social.glowClass} group`}
              >
                {social.id === "instagram" ? (
                  <Icon size={24} stroke="url(#ig-grad)" className={social.iconClass} />
                ) : social.id === "email" ? (
                  <Icon size={24} fill="url(#gmail-smooth-grad)" className={social.iconClass} />
                ) : (
                  <Icon size={24} className={`${social.color} ${social.iconClass}`} />
                )}
              </motion.a>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
