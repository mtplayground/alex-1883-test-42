import { Link, Route, Routes } from "react-router-dom";

import GettingStartedContent, {
  metadata as gettingStartedMetadata
} from "./content/getting-started.mdx";

function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-ink-950">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-stone-200 pb-5">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-wide text-rust-600"
          >
            Rust learning manual
          </Link>
          <span className="text-sm font-medium text-ink-500">Manual content</span>
        </nav>

        <header className="py-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-moss-700">
            {gettingStartedMetadata.label}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-ink-950 sm:text-5xl">
            {gettingStartedMetadata.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-700">
            {gettingStartedMetadata.description}
          </p>
        </header>

        <article className="manual-content pb-16">
          <GettingStartedContent />
        </article>
      </section>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
