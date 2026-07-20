import { createClient } from '@/lib/supabase-browser'

// Subidas a Supabase Storage. Reemplazan los uploads a Cloudinary, que
// usaban un preset unsigned: el cloud name y el preset viajaban en el JS
// del cliente, así que cualquiera podía subir a la cuenta. Estas van con
// el JWT del usuario y las controla la policy del bucket.

// Foto de perfil del agente → bucket agent-photos (público).
// `userId` es users.id; el path lo agrupa por agente.
export async function uploadAgentPhoto(file: File, userId: string): Promise<string> {
  const sb = createClient()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await sb.storage.from('agent-photos')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (error) throw new Error(error.message)
  return sb.storage.from('agent-photos').getPublicUrl(path).data.publicUrl
}
