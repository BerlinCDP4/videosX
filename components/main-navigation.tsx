"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  ChevronDown,
  ChevronRight,
  Film,
  ImageIcon,
  Menu,
  Home,
  Star,
  Clock,
  Upload,
  User,
  LogIn,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useRouter } from "next/navigation"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { useAuth } from "@/contexts/auth-context"

interface Category {
  id: string
  name: string
  icon?: React.ReactNode
  path?: string
  subcategories?: Category[]
  requiresAuth?: boolean
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
      { id: "images/amateur", name: "Amateur", path: "/images/amateur" },
      { id: "images/famosas", name: "Famosas", path: "/images/famosas" },
      { id: "images/monica", name: "Monica", path: "/images/monica" },
      { id: "images/estudio", name: "Estudio", path: "/images/estudio" },
    ],
  },
  {
    id: "videos",
    name: "Videos",
    icon: <Film className="h-5 w-5" />,
    path: "/videos",
    subcategories: [
      { id: "videos/amateur", name: "Amateur", path: "/videos/amateur" },
      { id: "videos/famosas", name: "Famosas", path: "/videos/famosas" },
      { id: "videos/monica", name: "Monica", path: "/videos/monica" },
      { id: "videos/estudio", name: "Estudio", path: "/videos/estudio" },
    ],
  },
  {
    id: "upload",
    name: "Subir Medio",
    icon: <Upload className="h-5 w-5" />,
    path: "/upload",
    requiresAuth: true,
  },
  {
    id: "favorites",
    name: "Favoritos",
    icon: <Star className="h-5 w-5" />,
    path: "/favorites",
    requiresAuth: true,
  },
  {
    id: "recent",
    name: "Recientes",
    icon: <Clock className="h-5 w-5" />,
    path: "/recent",
  },
  {
    id: "history",
    name: "Historial",
    icon: <History className="h-5 w-5" />,
    path: "/history",
    requiresAuth: true,
  },
  {
    id: "profile",
    name: "Mi Perfil",
    icon: <User className="h-5 w-5" />,
    path: "/profile",
    requiresAuth: true,
  },
]

interface MainNavigationProps {
  activeSection: string
  onNavigate: (section: string) => void
}

export function MainNavigation({ activeSection, onNavigate }: MainNavigationProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    // Abrir las categorías principales por defecto
    images: true,
    videos: true,
  })
  const isMobile = useMediaQuery("(max-width: 768px)")
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }))
  }

  const handleNavigation = (categoryId: string, path?: string, requiresAuth = false) => {
    // Si requiere autenticación y el usuario no está autenticado, redirigir a login
    if (requiresAuth && !isAuthenticated) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(path || "/")}`)
      return
    }

    // Navegar directamente a la ruta si se proporciona
    if (path) {
      router.push(path)
    }

    onNavigate(categoryId)

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

    const handleCategoryClick = () => {
      if (hasSubcategories) {
        toggleCategory(category.name)
      } else {
        handleNavigation(category.id, category.path, category.requiresAuth)
      }
    }

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
          onClick={handleCategoryClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleCategoryClick()
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
              <div
                key={subcategory.id}
                className={cn(
                  "flex items-center py-2 px-3 rounded-md transition-colors",
                  "hover:bg-muted hover:text-accent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  "focus-visible:ring-accent focus-visible:ring-offset-background",
                  subcategory.id === activeSection && "bg-muted text-accent font-medium",
                  "text-sm",
                )}
                style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
                tabIndex={0}
                role="button"
                onClick={() => handleNavigation(subcategory.id, subcategory.path, subcategory.requiresAuth)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleNavigation(subcategory.id, subcategory.path, subcategory.requiresAuth)
                  }
                }}
              >
                <span className="flex-1">{subcategory.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const NavigationContent = () => (
    <ScrollArea className="h-full">
      <div className="py-4 px-2">
        <div className="flex items-center gap-3 px-4 mb-6">
          <UserProfileMenu />
          <div>
            {isAuthenticated && user ? (
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-sm">Invitado</p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs text-accent"
                  onClick={() => router.push("/auth/login")}
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  Iniciar sesión
                </Button>
              </div>
            )}
          </div>
        </div>
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
