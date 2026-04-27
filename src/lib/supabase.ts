import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpqpfpsgrwsjvpwdzkbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXBmcHNncndzanZwd2R6a2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI5MzU1OSwiZXhwIjoyMDkyODY5NTU5fQ.4d1OR_LmKaZ1nFXi9FSntoW8JYAzgK_ZpNm334ht6xA';

export const supabase = createClient(supabaseUrl, supabaseKey);