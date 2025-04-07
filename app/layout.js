import './styles-globals-css.css'

export const metadata = {
  title: 'PCI Quality Organization',
  description: 'PCI Quality Organization Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
} 