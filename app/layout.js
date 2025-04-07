import './globals.css'

export const metadata = {
  title: 'ReOrgPresentation',
  description: 'Reorganization presentation tool',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  )
} 