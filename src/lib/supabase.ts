import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpqpfpsgrwsjvpwdzkbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXBmCHNyZ3NjanB3ZHprYmMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MDQxMTcwMCwiZXhwIjoyMDU5OTcxNzAwfQ.xcRHVdWnc8kXWnrRqzJrV0XWNlzK1vMXY9c0';

export const supabase = createClient(supabaseUrl, supabaseKey);