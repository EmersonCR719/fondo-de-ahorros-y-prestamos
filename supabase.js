import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rmuxgjqxizvzktniedmk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdXhnanF4aXp2emt0bmllZG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTk1MDgsImV4cCI6MjA3MzM3NTUwOH0.AKWhOQ5QPM5gcu-u0BDRLW-_PHVNhrZRugreOuPtaAI'
export const supabase = createClient(supabaseUrl, supabaseKey)