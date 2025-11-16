import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">Teed</h1>
        <p className="text-xl text-white/90 mb-8">
          Organize and share your gear, kits, and collections
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            Dashboard
          </Link>
        </div>
        <p className="mt-8 text-white/70 text-sm">
          Test credentials: test@teed-test.com / test-password
        </p>
      </div>
    </div>
  );
}
