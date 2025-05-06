import { put, del, list } from "@vercel/blob"

// Función para subir un archivo a Vercel Blob
export async function uploadFile(file: File, folder = "media"): Promise<string> {
  try {
    const filename = `${folder}/${Date.now()}-${file.name}`
    const { url } = await put(filename, file, { access: "public" })
    return url
  } catch (error) {
    console.error("Error al subir archivo a Vercel Blob:", error)
    throw new Error("Error al subir archivo")
  }
}

// Función para subir una imagen en base64 a Vercel Blob
export async function uploadBase64Image(base64Data: string, folder = "profiles"): Promise<string> {
  try {
    // Extraer los datos de la imagen base64
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)

    if (!matches || matches.length !== 3) {
      throw new Error("Formato de imagen base64 inválido")
    }

    const type = matches[1]
    const buffer = Buffer.from(matches[2], "base64")

    // Crear un nombre de archivo único
    const extension = type.split("/")[1]
    const filename = `${folder}/${Date.now()}.${extension}`

    // Subir el archivo a Vercel Blob
    const { url } = await put(filename, buffer, {
      contentType: type,
      access: "public",
    })

    return url
  } catch (error) {
    console.error("Error al subir imagen base64 a Vercel Blob:", error)
    throw new Error("Error al subir imagen")
  }
}

// Función para eliminar un archivo de Vercel Blob
export async function deleteFile(url: string): Promise<boolean> {
  try {
    await del(url)
    return true
  } catch (error) {
    console.error("Error al eliminar archivo de Vercel Blob:", error)
    return false
  }
}

// Función para listar archivos en Vercel Blob
export async function listFiles(prefix = ""): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix })
    return blobs.map((blob) => blob.url)
  } catch (error) {
    console.error("Error al listar archivos de Vercel Blob:", error)
    return []
  }
}
