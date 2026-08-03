"use client";

const toggleTheme = () => {
  const current =
    document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {}
};

export const ThemeToggle = () => {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border text-(--text-secondary) transition-colors hover:text-(--text-primary)"
      style={{
        borderColor: "var(--card-border)",
        background: "var(--card-bg-raised)",
      }}
    >
      <svg
        className="theme-toggle-icon-dark"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg
        className="theme-toggle-icon-light"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path d="M20.742 13.045a8.088 8.088 0 0 1-2.077.273c-4.508 0-8.16-3.652-8.16-8.16 0-1.026.191-2.007.539-2.912a.75.75 0 0 0-.926-.995A9.71 9.71 0 0 0 3.75 11.25c0 5.376 4.36 9.736 9.736 9.736a9.71 9.71 0 0 0 8.981-6.031.75.75 0 0 0-.725-.91z" />
      </svg>
    </button>
  );
};
