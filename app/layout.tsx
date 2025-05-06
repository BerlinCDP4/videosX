import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/user-context"
import { AuthProvider } from "@/contexts/auth-context"
import { MobileHomeButton } from "@/components/mobile-home-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Galería de Medios",
  description: "Una galería multiplataforma para videos e imágenes con categorías",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Script para migrar datos antiguos al nuevo formato
              (function() {
                try {
                  // Verificar si ya se ha realizado la migración
                  if (localStorage.getItem('data_migration_completed')) return;
                  
                  // Migrar usuarios
                  const oldUsers = localStorage.getItem('users_db');
                  if (oldUsers) {
                    localStorage.setItem('media_gallery_users', oldUsers);
                  }
                  
                  // Migrar medios
                  const oldMedia = localStorage.getItem('mediaItems');
                  if (oldMedia) {
                    localStorage.setItem('media_gallery_media_items', oldMedia);
                  }
                  
                  // Migrar comentarios
                  const oldComments = localStorage.getItem('shared_comments_db');
                  if (oldComments) {
                    localStorage.setItem('media_gallery_comments', oldComments);
                  }
                  
                  // Migrar imágenes de perfil
                  const oldProfileImages = localStorage.getItem('profile_images_db');
                  if (oldProfileImages) {
                    localStorage.setItem('media_gallery_profile_images', oldProfileImages);
                  }
                  
                  // Marcar migración como completada
                  localStorage.setItem('data_migration_completed', 'true');
                  
                  console.log('Migración de datos completada con éxito');
                } catch (error) {
                  console.error('Error durante la migración de datos:', error);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <UserProvider>
              {children}
              <MobileHomeButton />
              <Toaster />
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
