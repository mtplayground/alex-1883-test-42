import { MDXProvider } from "@mdx-js/react";
import { Link, Route, Routes } from "react-router-dom";

import { defaultManualSection, manualSections } from "./content/manual";
import { mdxComponents } from "./content/mdxComponents";
import { ThemeToggle } from "./theme/ThemeToggle";

function SectionNavigation() {
  return (
    <nav aria-label="Manual sections" className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Sections
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {manualSections.map((section) => (
          <Link
            key={section.id}
            to={section.path}
            className="block min-w-max rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 shadow-sm transition hover:border-rust-500 hover:text-rust-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rust-500 dark:hover:text-rust-500 lg:min-w-0 lg:border-transparent lg:bg-transparent lg:shadow-none lg:dark:border-transparent lg:dark:bg-transparent"
          >
            {section.metadata.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function TableOfContents() {
  return (
    <nav aria-label="On this page" className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        On this page
      </p>
      <ol className="space-y-2">
        {defaultManualSection.headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="block text-sm leading-6 text-ink-500 transition hover:text-rust-600 dark:text-stone-400 dark:hover:text-rust-500"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ManualPage() {
  const Content = defaultManualSection.Component;

  return (
    <main className="min-h-screen bg-stone-50 text-ink-950 transition-colors dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[16rem_minmax(0,1fr)_14rem] lg:px-10">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:border-r lg:border-stone-200 lg:pr-6 lg:dark:border-stone-800">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              to="/"
              className="block text-sm font-semibold uppercase tracking-wide text-rust-600 dark:text-rust-500"
            >
              Rust learning manual
            </Link>
            <ThemeToggle />
          </div>
          <SectionNavigation />
        </aside>

        <section className="min-w-0">
          <header className="border-b border-stone-200 pb-8 dark:border-stone-800 lg:pt-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-moss-700 dark:text-lime-400">
              {defaultManualSection.metadata.label}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-ink-950 dark:text-stone-50 sm:text-5xl">
              {defaultManualSection.metadata.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-700 dark:text-stone-300">
              {defaultManualSection.metadata.description}
            </p>
          </header>

          <article className="manual-content pb-16">
            <MDXProvider components={mdxComponents}>
              <Content />
            </MDXProvider>
          </article>
        </section>

        <aside className="hidden border-l border-stone-200 pl-6 dark:border-stone-800 lg:sticky lg:top-6 lg:block lg:h-[calc(100vh-3rem)]">
          <TableOfContents />
        </aside>
      </div>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ManualPage />} />
    </Routes>
  );
}
