import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmrthcsnjbyufzsphsev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcnRoY3NuamJ5dWZ6c3Boc2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDY3MzUsImV4cCI6MjA5MTk4MjczNX0.PoUSSBOaSSR-nr4Laao-WYtxl3j91klg_UcZzEjl00w';

export const supabase = createClient(supabaseUrl, supabaseKey);