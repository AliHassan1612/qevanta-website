const QEVANTA_SUPABASE_URL = "https://mfgmkvmawhfdsigawrpn.supabase.co";

const QEVANTA_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZ21rdm1hd2hmZHNpZ2F3cnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Mjk5NjYsImV4cCI6MjA5NzUwNTk2Nn0.6znoxf1v7SDdvBvjMwgdDTjQt7dpsI2qbmvVI1BPN5c";

const supabase = window.supabase.createClient(
  QEVANTA_SUPABASE_URL,
  QEVANTA_SUPABASE_ANON_KEY
);
