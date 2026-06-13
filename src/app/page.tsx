import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-6 px-8">
        <div className="text-6xl">🐟</div>
        <h1 className="text-4xl font-bold tracking-tight">Aquarium Simulator</h1>
        <p className="max-w-sm text-slate-400 text-sm leading-relaxed">
          Balance a living ecosystem. Monitor O₂, pH, ammonia and nine other
          parameters to prevent your tank from collapsing.
        </p>
        <Link
          href="/game"
          className="inline-block rounded-full bg-cyan-500 px-8 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
        >
          Start Game
        </Link>
      </div>
    </div>
  );
}
