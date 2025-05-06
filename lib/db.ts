import { neon } from "@neondatabase/serverless"

// Crear una instancia de cliente SQL
const sql = neon(process.env.DATABASE_URL!)

// Función para ejecutar consultas SQL
export async function executeQuery<T>(query: string, params: any[] = []): Promise<T> {
  try {
    return (await sql(query, params)) as T
  } catch (error) {
    console.error("Error ejecutando consulta SQL:", error)
    throw error
  }
}
