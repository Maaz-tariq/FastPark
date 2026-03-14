import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qioujkaldfcdvuoiywue.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpb3Vqa2FsZGZjZHZ1b2l5d3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjIwMDMsImV4cCI6MjA4ODY5ODAwM30.Hp0jqzBtnwb94Bdu6V984EM09MpeD5fcyGj0tG58yOI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);