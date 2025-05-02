"use client"

import { useState } from "react"
import { GalleryHeader } from "@/components/gallery-header"
import { MainNavigation } from "@/components/main-navigation"
import UploadForm from "@/components/upload-form"

export default function UploadPage() {
  const [activeSection, setActiveSection] = useState<string>("upload")

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <MainNavigation activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <GalleryHeader title="Subir Medio" subtitle="Sube tus imágenes y videos favoritos" />

          <section className="mb-10">
            <UploadForm />
          </section>
        </div>
      </main>
    </div>
  )
}
