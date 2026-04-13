import { redirect } from 'next/navigation'

export default async function RedirectPage({ params }: { params: Promise<{ instrumento: string; modulo: string }> }) {
  const { instrumento } = await params
  redirect(`/escuela/clase/${instrumento}`)
}
