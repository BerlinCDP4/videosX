"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChevronDown, ChevronRight, Film, ImageIcon, Menu, Home, Star, Clock, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  icon?: React.ReactNode
  path?: string
  subcategories?: Category[]
}

const categories: Category[] = [
  {
    id: "home",
    name: "Inicio",
    icon: <Home className="h-5 w-5" />,
    path: "/",
  },
  {
    id: "images",
    name: "Imágenes",
    icon: <ImageIcon className="h-5 w-5" />,
    path: "/images",
    subcategories: [
      { id: "amateur", name: "Amateur", path: "/images/amateur" },
      { id: "famosas", name: "Famosas", path: "/images/famosas" },
      { id: "monica", name: "Monica", path: "/images/monica" },
      { id: "estudio", name: "Estudio", path: "/images/estudio" },
    ],
  },
  {
    id: "videos",
    name: "Videos",
    icon: <Film className="h-5 w-5" />,
    path: "/videos",
    subcategories: [
      { id: "amateur", name: "Amateur", path: "/videos/amateur" },
      { id: "famosas", name: "Famosas", path: "/videos/famosas" },
      { id: "monica", name: "Monica", path: "/videos/monica" },
      { id: "estudio", name: "Estudio", path: "/videos/estudio" },
    ],
  },
  {
    id: "upload",
    name: "Subir Medio",
    icon: <Upload className="h-5 w-5" />,
    path: "/upload",
  },
  {
    id: "favorites",
    name: "Favoritos",
    icon: <Star className="h-5 w-5" />,
    path: "/favorites",
  },
  {
    id: "recent",
    name: "Recientes",
    icon: <Clock className="h-5 w-5" />,
    path: "/recent",
  },
]

interface MainNavigationProps {
  activeSection: string
  onNavigate: (section: string) => void
}

export function MainNavigation({ activeSection, onNavigate }: MainNavigationProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const isMobile = useMediaQuery("(max-width: 768px)")
  const router = useRouter()
  const [setActiveSection] = useState<string>(activeSection)

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }))
  }

  const handleNavigation = (categoryId: string) => {
    // Encontrar la categoría seleccionada
    const findCategory = (categories: Category[], id: string): Category | undefined => {
      for (const category of categories) {
        if (category.id === id) return category
        if (category.subcategories) {
          const found = findCategory(category.subcategories, id)
          if (found) return found
        }
      }
      return undefined
    }

    const selectedCategory = findCategory(categories, categoryId)

    if (selectedCategory?.path) {
      router.push(selectedCategory.path)
    }

    setActiveSection(categoryId)

    // On mobile, close the sheet after navigation
    if (isMobile) {
      const sheetCloseButton = document.querySelector("[data-radix-collection-item]") as HTMLElement
      if (sheetCloseButton) {
        sheetCloseButton.click()
      }
    }
  }

  const CategoryItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0
    const isOpen = openCategories[category.name]
    const isActive = category.id === activeSection

    return (
      <div>
        <div
          className={cn(
            "flex items-center py-2 px-3 rounded-md transition-colors",
            "hover:bg-muted hover:text-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "focus-visible:ring-accent focus-visible:ring-offset-background",
            isActive && "bg-muted text-accent font-medium",
            level === 0 ? "font-medium" : "text-sm",
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          tabIndex={0}
          role="button"
          onClick={() => {
            if (hasSubcategories) {
              toggleCategory(category.name)
            } else {
              handleNavigation(category.id)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (hasSubcategories) {
                toggleCategory(category.name)
              } else {
                handleNavigation(category.id)
              }
            }
          }}
        >
          <div className="flex-1 flex items-center">
            {category.icon && <span className="mr-3 text-accent">{category.icon}</span>}
            <span className="flex-1">{category.name}</span>
          </div>

          {hasSubcategories && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation()
                toggleCategory(category.name)
              }}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {hasSubcategories && isOpen && (
          <div className="ml-2 border-l-2 border-muted">
            {category.subcategories?.map((subcategory) => (
              <CategoryItem key={subcategory.id} category={subcategory} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const NavigationContent = () => (
    <ScrollArea className="h-full">
      <div className="py-4 px-2">
        <h2 className="mb-4 px-4 text-lg font-semibold tracking-tight text-accent">Categorías</h2>
        <div className="space-y-1">
          {categories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </div>
      </div>
    </ScrollArea>
  )

  // Mobile navigation with sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[350px] bg-background border-r border-muted">
          <NavigationContent />
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop sidebar
  return (
    <div className="hidden md:block w-[280px] flex-shrink-0 border-r border-muted bg-background">
      <NavigationContent />
    </div>
  )
}
