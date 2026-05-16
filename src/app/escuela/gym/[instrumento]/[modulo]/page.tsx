import GymSalaPage from '../page'

export default async function GymSalaConSeccionPage({
  params,
}: {
  params: Promise<{ instrumento: string; modulo: string }>
}) {
  const { modulo } = await params
  return <GymSalaPage moduloIdInicial={modulo} />
}
