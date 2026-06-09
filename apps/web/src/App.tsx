import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-ink-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-stone-200 pb-5">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-wide text-rust-600"
          >
            Rust learning manual
          </Link>
          <span className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-ink-700">
            SPA scaffold
          </span>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-moss-700">
              Interactive Rust content shell
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-ink-950 sm:text-5xl">
              Learn Rust with readable lessons and runnable examples.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-700">
              This initial route establishes the React and Tailwind foundation for the
              manual, navigation, MDX content, and embedded Playground work planned in
              later issues.
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3 text-sm text-ink-500">
              <span className="h-3 w-3 rounded-full bg-rust-500" />
              <span className="h-3 w-3 rounded-full bg-moss-500" />
              <span className="h-3 w-3 rounded-full bg-stone-300" />
              <span className="ml-2 font-medium text-ink-700">main.rs</span>
            </div>
            <pre className="overflow-x-auto pt-5 font-mono text-sm leading-7 text-ink-950">
              <code>{`fn main() {
    let topic = "ownership";
    println!("Next lesson: {topic}");
}`}</code>
            </pre>
          </div>
        </div>
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
