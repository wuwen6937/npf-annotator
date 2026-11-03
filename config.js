// NPF Annotator settings.
// The anon key is meant to be public: the database rules (supabase/schema.sql)
// decide who can read and write what.
window.NPF_CONFIG = {
  supabaseUrl: '',      // e.g. 'https://abcdefgh.supabase.co'  (Supabase → Project Settings → API)
  supabaseAnonKey: '',  // the "anon public" key from the same page
  projectName: 'ChinaSpektrum · NPF narrative coding'
};
