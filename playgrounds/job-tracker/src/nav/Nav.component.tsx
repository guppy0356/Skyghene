import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <nav className="flex gap-4 border-b px-4 py-3">
      <span className="font-bold">Job Tracker</span>
      <Link to="/applications" activeProps={{ className: "font-semibold" }}>
        Applications
      </Link>
      <Link to="/applications/new" activeProps={{ className: "font-semibold" }}>
        New application
      </Link>
    </nav>
  );
}
