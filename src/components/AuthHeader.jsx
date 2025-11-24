import React from 'react'

export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <div className="flex items-center gap-3 rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 shadow-lg">
          <div className="text-[#6b7c45]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L8 6h8l-4-4z" />
              <path d="M8 6v12c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V6" />
              <path d="M6 8h12" />
              <path d="M6 12h12" />
              <path d="M6 16h12" />
              <circle cx="9" cy="10" r="1" />
              <circle cx="15" cy="10" r="1" />
              <path d="M10 14h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#6b7c45]">Granme</h1>
        </div>
      </div>

      {/* Titulo */}
      <h2 className="text-2xl font-bold text-[#1a2e02] mb-2">{title}</h2>
      
      {/* Subtitulo */}
      {subtitle && (
        <p className="text-[#4a5c2a] text-sm">{subtitle}</p>
      )}
    </div>
  )
}
