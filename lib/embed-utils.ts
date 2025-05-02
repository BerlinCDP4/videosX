// Utility functions for handling embeds

// Function to detect embed type from URL
export function detectEmbedType(url: string): {
  embedType: "youtube" | "vimeo" | "instagram" | "twitter" | "tiktok" | "spotify" | "other"
  embedId: string | null
} {
  try {
    const parsedUrl = new URL(url)

    // YouTube
    if (
      parsedUrl.hostname === "youtube.com" ||
      parsedUrl.hostname === "www.youtube.com" ||
      parsedUrl.hostname === "youtu.be"
    ) {
      let videoId = null

      if (parsedUrl.hostname === "youtu.be") {
        videoId = parsedUrl.pathname.substring(1)
      } else {
        videoId = parsedUrl.searchParams.get("v")
      }

      return { embedType: "youtube", embedId: videoId }
    }

    // Vimeo
    if (parsedUrl.hostname === "vimeo.com" || parsedUrl.hostname === "www.vimeo.com") {
      const videoId = parsedUrl.pathname.substring(1)
      return { embedType: "vimeo", embedId: videoId }
    }

    // Instagram
    if (parsedUrl.hostname === "instagram.com" || parsedUrl.hostname === "www.instagram.com") {
      return { embedType: "instagram", embedId: null }
    }

    // Twitter/X
    if (
      parsedUrl.hostname === "twitter.com" ||
      parsedUrl.hostname === "www.twitter.com" ||
      parsedUrl.hostname === "x.com" ||
      parsedUrl.hostname === "www.x.com"
    ) {
      return { embedType: "twitter", embedId: null }
    }

    // TikTok
    if (parsedUrl.hostname === "tiktok.com" || parsedUrl.hostname === "www.tiktok.com") {
      return { embedType: "tiktok", embedId: null }
    }

    // Spotify
    if (parsedUrl.hostname === "open.spotify.com" || parsedUrl.hostname === "spotify.com") {
      return { embedType: "spotify", embedId: null }
    }

    // Default to other
    return { embedType: "other", embedId: null }
  } catch (error) {
    return { embedType: "other", embedId: null }
  }
}

// Function to generate embed HTML based on URL and type
export function generateEmbedCode(url: string, embedType: string, embedId: string | null): string {
  switch (embedType) {
    case "youtube":
      if (embedId) {
        return `https://www.youtube.com/embed/${embedId}`
      }
      break
    case "vimeo":
      if (embedId) {
        return `https://player.vimeo.com/video/${embedId}`
      }
      break
    case "spotify":
      // Extract Spotify URI from URL
      if (url.includes("/track/")) {
        const trackId = url.split("/track/")[1]?.split("?")[0]
        return `https://open.spotify.com/embed/track/${trackId}`
      } else if (url.includes("/playlist/")) {
        const playlistId = url.split("/playlist/")[1]?.split("?")[0]
        return `https://open.spotify.com/embed/playlist/${playlistId}`
      } else if (url.includes("/album/")) {
        const albumId = url.split("/album/")[1]?.split("?")[0]
        return `https://open.spotify.com/embed/album/${albumId}`
      }
      break
    case "instagram":
      // For Instagram, we'll use the oEmbed API in a real implementation
      // For now, we'll just return the URL for demonstration
      return url
    case "twitter":
      // For Twitter/X, we'd use their embed API in a real implementation
      return url
    case "tiktok":
      // For TikTok, we'd use their embed API in a real implementation
      return url
  }

  // Default fallback - just return the original URL
  return url
}

// Function to generate thumbnail for embed
export function generateEmbedThumbnail(embedType: string, embedId: string | null): string {
  if (embedType === "youtube" && embedId) {
    return `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`
  }

  // Default thumbnails for other types
  return "/placeholder.svg?height=400&width=600"
}
