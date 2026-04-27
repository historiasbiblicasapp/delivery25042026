import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpqpfpsgrwsjvpwdzkbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXBmcHNncndzanZwd2R6a2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyOTM1NTksImV4cCI6MjA5Mjg2OTU1OX0.3gIdm-vurSd3l5EtXkzkcPKarZnEsDo7L7iiwIdJuRM';

export const supabase = createClient(supabaseUrl, supabaseKey);