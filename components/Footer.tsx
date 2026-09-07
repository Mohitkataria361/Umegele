export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Mohit Kataria. All rights reserved.
        </p>

        <p className="text-sm text-zinc-500">
          Built with <span className="text-zinc-300">♥</span> by{" "}
          <span className="font-medium text-zinc-300">Mohit Kataria</span>
        </p>
      </div>
    </footer>
  );
}