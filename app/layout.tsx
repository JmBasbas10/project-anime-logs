import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { BootstrapJs } from '@/components/bootstrap-js'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Anime Logs',
  description: 'Roblox game dashboard — player logs, gifts, and active servers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <BootstrapJs />
        {children}
      </body>
    </html>
  )
}
