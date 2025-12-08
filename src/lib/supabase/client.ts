import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbxneekbhmabnpxulglt.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhieG5lZWtiaG1hYm5weHVsZ2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzMxMjcsImV4cCI6MjA4MDUwOTEyN30.xbHpdCxb29c7QZ6RTxrGaVp2Q0HjdRbxZe16b06QXZs'
    );
}
