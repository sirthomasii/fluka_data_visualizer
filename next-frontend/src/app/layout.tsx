import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import './globals.css'

const theme = createTheme({
  colors: {
    // Define your color palette here if needed
  },
  primaryColor: 'blue', // or whatever your primary color is
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider 
          theme={theme} 
          defaultColorScheme="light"
          cssVariablesSelector="body"

        >
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
