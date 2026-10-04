import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co'
const SUPABASE_KEY = 'YOUR-ANON-PUBLIC-KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
