import ClasePage from '../page'

export default async function ClaseConModuloPage({
  params,
}: {
  params: Promise<{ instrumento: string; modulo: string }>
}) {
  const { modulo } = await params
  return <ClasePage moduloIdInicial={modulo} />
}
