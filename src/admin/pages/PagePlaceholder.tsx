export function PagePlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800">{title}</h1>
      <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-400">
        Module à venir — implémentation dans une phase ultérieure.
      </div>
    </div>
  )
}
