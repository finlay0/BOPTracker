# Supabase + Next.js 13 Snippets

## Server Component Example

```ts
// app/page.tsx
import { createServerComponentClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function Page() {
  const supabase = createServerComponentClient({ cookies });
  const { data: todos } = await supabase.from("todos").select();
  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

## Route Handler Example

```ts
// app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (await req.json()).email,
    password: (await req.json()).password,
  });
  return new Response(JSON.stringify({ data, error }), { status: error ? 400 : 200 });
}
```

## Browser Client Example

```ts
// utils/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient();
```

## Middleware Example (Optional)

```ts
// middleware.ts
import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/ssr";

export function middleware(req) {
  const res = NextResponse.next();
  createMiddlewareClient({ req, res });
  return res;
}
```
