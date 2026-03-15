// Configuración de Supabase - OCA Digital Solutions
const SUPABASE_URL = 'https://qoetormocaeuasoeideb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZXRvcm1vY2FldWFzb2VpZGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDk3MzMsImV4cCI6MjA4OTA4NTczM30.C6Qv3Thd8AihK8dHpcoyD-5iZcudKnHTimurAIlDE-A';

// Inicializar el cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

console.log('Supabase Client Initialized');
