## Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run the contents of `supabase.sql`.
3. Copy the project URL and anon key.
4. Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Restart dev server: `npm run dev`.

The app uses Supabase if env vars are present; otherwise it falls back to in-memory mock data.

## Deploy
- Vercel: add the same env vars in Project Settings → Environment Variables.
- After deploy, the app will read/write to Supabase.




