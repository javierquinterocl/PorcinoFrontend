import React from 'react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#6b7c45] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
