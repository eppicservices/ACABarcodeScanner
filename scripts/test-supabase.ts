// Quick script to test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  // Try to query students table
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error:', error.message)
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('\n⚠️  Tables do not exist yet. You need to run the migration.')
      console.log('\nTo create tables, go to your Supabase dashboard:')
      console.log('1. Open https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Go to SQL Editor')
      console.log('4. Paste the contents of supabase/migrations/001_create_tables.sql')
      console.log('5. Click "Run"')
    }
  } else {
    console.log('✅ Connection successful!')
    console.log('Students found:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('Sample data:', data[0])
    }
  }
}

test()
