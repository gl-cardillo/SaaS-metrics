import { Dashboard } from "@/components/Dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";

const Home = () => {
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-6 lg:p-8">
      <header className="flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--status-good)", boxShadow: "0 0 8px var(--status-good)" }}
        />
        <h1 className="text-xl font-bold tracking-tight text-(--text-primary)">
          SaaS Metrics
        </h1>
        <span className="text-sm text-[var(--text-muted)]">Live revenue &amp; retention</span>
        <ThemeToggle />
      </header>
      <Dashboard />
    </main>
  );
};

export default Home;
