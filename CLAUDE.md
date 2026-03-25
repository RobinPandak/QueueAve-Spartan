# Spartan by QueueAve

## Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** Supabase (shared instance with badminton: orbbqanrphfbkcwyrkeo)
- **Table prefix:** spartan_* (to avoid collisions)
- **Styling:** Tailwind CSS v4, shadcn/ui (Slate theme)

## Critical Conventions

### Next.js 16 Async Params
Dynamic route params are Promises. Always await:
```tsx
type Props = { params: Promise<{ id: string }> }
export default async function Page({ params }: Props) {
  const { id } = await params
}
```

### No Em Dashes
Never use `—` in UI copy. Use periods or commas instead.

### Server Actions Pattern
```tsx
'use server'
import { createClient } from '@/lib/supabase/server'
export async function myAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
}
```

### Service Client (Bypass RLS)
Use for participant self-registration:
```tsx
import { createClient as createServiceClient } from '@supabase/supabase-js'
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}
```

## Key Paths
- `src/app/actions/` - Server actions
- `src/lib/supabase/` - Client configs
- `src/lib/progress.ts` - Progress calculation helpers
- `src/components/progress-charts.tsx` - Recharts line charts
