import './globals.css'

export const metadata = {
  title: 'PCI Quality Organization',
  description: 'PCI Quality Organization Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  )
} 