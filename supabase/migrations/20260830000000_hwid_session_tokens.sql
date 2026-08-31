alter table public.hwid_sessions
  add column if not exists session_token text,
  add column if not exists session_token_created_at timestamptz;

create unique index if not exists hwid_sessions_session_token_idx
  on public.hwid_sessions (session_token)
  where session_token is not null;

notify pgrst, 'reload schema';
