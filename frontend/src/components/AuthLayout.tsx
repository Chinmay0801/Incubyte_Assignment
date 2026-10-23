import type { ReactNode } from 'react';

/** Painted parking bays receding across the sign panel. */
const BAY_LINES = 'repeating-linear-gradient(100deg, transparent 0 84px, rgb(242 194 48 / 0.9) 84px 90px)';

/** Split layout for sign-in / registration: the lot sign on the left, the form on the right. */
export function AuthLayout({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-asphalt-950 md:flex md:flex-col md:justify-between md:p-12">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 opacity-60" style={{ backgroundImage: BAY_LINES }} />
        <p className="relative font-mono text-xs tracking-[0.2em] text-asphalt-300 uppercase">Dealership inventory</p>
        <div className="relative">
          <h1 className="font-display text-[clamp(4rem,9vw,8.5rem)] leading-[0.82] font-black tracking-tight text-sticker uppercase">
            Lot
            <br />
            <span className="text-paint">line</span>
          </h1>
          <p className="mt-6 max-w-sm text-asphalt-300">
            Every vehicle on the lot, with its sticker price and how many are left. Sell what's in stock, restock what's gone.
          </p>
        </div>
        <span className="relative h-40" aria-hidden="true" />
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <p className="mb-8 font-display text-3xl font-black tracking-tight uppercase md:hidden">
            Lot<span className="text-paint">line</span>
          </p>
          <h2 className="flex items-center gap-3 font-display text-4xl font-extrabold tracking-wide uppercase">
            <span className="bay-line" aria-hidden="true" />
            {title}
          </h2>
          <p className="mt-2 mb-8 text-sm text-asphalt-300">{intro}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
