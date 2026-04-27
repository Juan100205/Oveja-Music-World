const PUBLIC_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const SERVER_ENV_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
] as const

type PublicEnvKey = typeof PUBLIC_ENV_KEYS[number]
type ServerEnvKey = typeof SERVER_ENV_KEYS[number]

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Add it to .env.local and restart the Next.js server.`
    )
  }

  return value
}

export function getPublicEnv(name: PublicEnvKey): string {
  return requireEnv(name)
}

export function getServerEnv(name: ServerEnvKey): string {
  return requireEnv(name)
}

export function validateRequiredEnv(): void {
  PUBLIC_ENV_KEYS.forEach((key) => requireEnv(key))
  SERVER_ENV_KEYS.forEach((key) => requireEnv(key))
}
