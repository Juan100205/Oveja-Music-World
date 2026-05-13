import GymSalaPage from '../page'

export default async function GymSalaConSeccionPage({
  params,
}: {
  params: Promise<{ instrumento: string; modulo: string }>
}) {
  const { modulo } = await params
  const idx = parseInt(modulo, 10)
  return <GymSalaPage seccionIdxInicial={isNaN(idx) ? undefined : idx} />
}
