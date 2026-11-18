export default function NotFound() {
  return (
    <section className="card mx-auto mt-6 max-w-lg animate-pop p-8 text-center sm:p-10">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M8 12.5 12 8.5M9 5.5l.9-.9a3.2 3.2 0 0 1 4.5 4.5l-.9.9M11 14.5l-.9.9a3.2 3.2 0 0 1-4.5-4.5l.9-.9" />
        </svg>
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">Paste unavailable</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        This paste doesn&rsquo;t exist, has expired, or has reached its view limit.
      </p>
      <a href="/" className="btn btn-md btn-primary mt-6">
        Create a new paste
      </a>
    </section>
  );
}
