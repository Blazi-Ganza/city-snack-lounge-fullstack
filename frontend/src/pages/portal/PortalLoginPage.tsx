import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { type PortalRole, usePortalAuth } from "../../context/PortalAuthContext";
import { resetSocket } from "../../lib/socket";
import { Button } from "../../components/ui/Button";

const BRANCHES = [
  { id: "huye", name: "Huye Branch" },
  { id: "musanze", name: "Musanze Branch" },
];

type PortalLoginPageProps = {
  role: PortalRole;
};

export function PortalLoginPage({ role }: PortalLoginPageProps) {
  const navigate = useNavigate();
  const { signIn } = usePortalAuth();

  const [branchId, setBranchId] = useState("huye");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const title = role === "admin" ? "Admin Login" : "Reception Login";
  const hint = role === "admin" ? "Boss dashboard access" : "Reception dashboard access";
  const dashboardPath = role === "admin" ? "/admin/dashboard" : "/reception/dashboard";

  useEffect(() => {
    const reason = sessionStorage.getItem("logout_reason");
    if (reason) {
      setNotice(reason);
      sessionStorage.removeItem("logout_reason");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const result = await signIn({
      role,
      branchId: role === "receptionist" ? branchId : undefined,
      passcode: passcode.trim(),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Invalid credentials.");
      return;
    }

    resetSocket();
    // Replace history — user can't back-button to login page after login
    navigate(dashboardPath, { replace: true });
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[var(--bg-soft)] px-4 py-10 text-[var(--ink)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm shadow-black/20">
        <img
          src="/images/city-snack-logo.png"
          alt="City Snack Lounge"
          data-no-dim
          className="logo-light h-12 w-auto object-contain"
        />
        <img
          src="/images/city-snack-logo-white.png"
          alt="City Snack Lounge"
          data-no-dim
          className="logo-dark h-12 w-auto object-contain"
        />

        <h1 className="mt-4 text-2xl font-semibold text-[var(--ink)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>

        {notice && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <span>🔒</span>
            <span>{notice}</span>
          </div>
        )}

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          {role === "receptionist" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Branch
              </label>
              <select
                value={branchId}
                onChange={(event) => {
                  setBranchId(event.target.value);
                  setError("");
                }}
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Passcode
            </label>
            <input
              value={passcode}
              onChange={(event) => {
                setPasscode(event.target.value);
                setError("");
              }}
              type="password"
              placeholder="Enter passcode"
              autoFocus
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--brand-1)]"
            />
          </div>

          {error && <p className="text-sm text-[var(--error)]">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || !passcode}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/" className="text-[var(--muted)] hover:text-[var(--ink)]">
            Back to Branches
          </Link>
          <Link
            to={role === "admin" ? "/reception/login" : "/admin/login"}
            className="text-[var(--primary)] hover:text-[var(--brand-2)]"
          >
            {role === "admin" ? "Reception Login" : "Admin Login"}
          </Link>
        </div>
      </div>
    </section>
  );
}