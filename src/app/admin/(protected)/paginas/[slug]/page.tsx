'use client'

import { useParams } from 'next/navigation'
import PageContentEditor from '../PageContentEditor'

// Enlace directo a una página. El editor vive en PageContentEditor, que también
// se embebe en la lista de Páginas.
export default function PageEditorRoute() {
  const { slug } = useParams<{ slug: string }>()
  return <PageContentEditor slug={slug} />
}
