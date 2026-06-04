import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import { BootstrapJs } from '@/components/bootstrap-js'

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Anime Logs',
  description: 'Roblox game dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark" className={geistMono.variable}>
      <body className="bg-body text-body">
        <BootstrapJs />
        {children}
      </body>
    </html>
  )
}
