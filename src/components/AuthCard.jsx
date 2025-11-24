import React from 'react'

export default function AuthCard({ children }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}
