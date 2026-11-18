import PasteForm from "@/components/PasteForm";

export default function HomePage() {
  return (
    <>
      <div className="mb-8 max-w-2xl">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] sm:text-[34px]">
          Share some text
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Paste anything, get a link. Set an expiry time, a view limit, or both. The link stops
          working as soon as either is reached.
        </p>
      </div>
      <PasteForm />
    </>
  );
}
