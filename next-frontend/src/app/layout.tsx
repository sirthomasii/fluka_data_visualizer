'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { useState } from 'react'
import '@mantine/core/styles.css'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang="en">
      <head>
      <link rel="icon" href="/favicon.ico" />
      </head>

      <body>
        <QueryClientProvider client={queryClient}>
          <MantineProvider defaultColorScheme="dark">
            {children}
          </MantineProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
