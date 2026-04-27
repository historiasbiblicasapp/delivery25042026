import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpqpfpsgrwsjvpwdzkbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXBmCHNyZ3NjanB3ZHprYmMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MDQxMTcwMCwiZXhwIjoyMDU5OTcxNzAwfQ.aa0c536e-377b-40c9-8776-412d41344ea7';

export const supabase = createClient(supabaseUrl, supabaseKey);