'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider, createTheme } from '@mantine/core'
import { useState } from 'react'
import '@mantine/core/styles.css'

// Create a theme with dark color scheme
const theme = createTheme({
  primaryColor: 'dark',
  // You can add more theme customizations here
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme}>
            {children}
          </MantineProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
