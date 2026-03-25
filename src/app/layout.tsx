import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], display: 'swap', preload: false })
const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'], display: 'swap', preload: false })
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'], display: 'swap', preload: false })

export const metadata: Metadata = {
  title: 'Spartan by QueueAve',
  description: 'Training session management for obstacle course coaches',
  icons: { icon: '/logo.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${bricolage.variable} ${jetbrains.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
