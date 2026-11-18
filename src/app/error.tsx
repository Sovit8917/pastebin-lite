"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="card mx-auto mt-6 max-w-lg animate-pop p-8 text-center sm:p-10">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-danger-soft text-danger">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
          <path d="M10 6v5M10 14h.01" />
          <circle cx="10" cy="10" r="7.5" />
        </svg>
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        The paste couldn&rsquo;t be loaded right now. Reloading may use a view if the paste has a
        view limit.
      </p>
      <button onClick={reset} className="btn btn-md btn-secondary mt-6">
        Try again
      </button>
    </section>
  );
}
