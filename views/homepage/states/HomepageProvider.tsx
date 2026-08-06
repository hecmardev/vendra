'use client'

import React, { createContext, useContext, ReactNode } from 'react'

/** Estado de la vista home, alimentado por datos SSR pasados como props. */
interface HomepageContextProps {
  dealerName: string
  featuredCarIds: string[]
}

const HomepageContext = createContext<HomepageContextProps | undefined>(undefined)

export const HomepageProvider: React.FC<{
  children: ReactNode
  value: HomepageContextProps
}> = ({ children, value }) => {
  return (
    <HomepageContext.Provider value={value}>{children}</HomepageContext.Provider>
  )
}

export const useHomepage = (): HomepageContextProps => {
  const context = useContext(HomepageContext)
  if (context === undefined) {
    throw new Error('useHomepage must be used within a HomepageProvider')
  }
  return context
}
