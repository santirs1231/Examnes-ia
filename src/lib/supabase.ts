import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('materias').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
