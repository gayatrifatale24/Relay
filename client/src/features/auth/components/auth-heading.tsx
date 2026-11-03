export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-xl font-semibold tracking-[-0.015em] text-ink">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{description}</p>
    </div>
  );
}
