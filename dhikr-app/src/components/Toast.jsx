export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full bg-[var(--brown-900)] text-[var(--cream)] text-sm shadow-lg"
      style={{ animation: "fadeIn .2s ease" }}
    >
      {toast}
    </div>
  );
}
