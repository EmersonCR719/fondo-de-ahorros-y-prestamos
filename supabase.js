import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zncphqcpvklyjcnqdbwf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuY3BocWNwdmtseWpjbnFkYndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDQ2MzAsImV4cCI6MjA3NzA4MDYzMH0.r1K2UShvk0U-kItWvToMc_Nnfh8dtg44XD7JxplHoHQ'
export const supabase = createClient(supabaseUrl, supabaseKey)