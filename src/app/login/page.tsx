import { loginWithGoogle } from '@/app/actions/auth'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-2xl border text-center"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
        }}
      >
        <img
          src="/logo.svg"
          alt="Spartan"
          width="56"
          height="56"
          className="mx-auto mb-4"
        />
        <h1
          className="text-2xl font-extrabold mb-1"
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          Spartan
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          by QueueAve
        </p>
        {error && (
          <p className="text-sm mb-4 text-red-500">
            Sign in failed. Please try again.
          </p>
        )}
        <form action={loginWithGoogle}>
          <button
            type="submit"
            className="w-full py-3 px-6 rounded-xl font-semibold text-white cursor-pointer transition-colors hover:opacity-90"
            style={{ backgroundColor: '#FF6B4A' }}
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  )
}
