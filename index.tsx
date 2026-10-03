import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "N-Queens Backtracking Visualizer | DAA" },
      { name: "description", content: "Watch the N-Queens backtracking algorithm run live with telemetry and all solutions." },
      { property: "og:title", content: "N-Queens Backtracking Visualizer" },
      { property: "og:description", content: "Live step-by-step backtracking with recursive call, backtrack and validation metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stats = { calls: number; backtracks: number; checks: number; ms: number };
const ZERO: Stats = { calls: 0, backtracks: 0, checks: 0, ms: 0 };
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));

function Index() {
  const [n, setN] = useState(4);
  const [speed, setSpeed] = useState(0.5);
  const [board, setBoard] = useState<number[]>([]); // board[col] = row or -1
  const [conflict, setConflict] = useState<[number, number] | null>(null);
  const [scanning, setScanning] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState("💤 Status: Idle. Configure N and run the engine.");
  const [stats, setStats] = useState<Stats>(ZERO);
  const [solutions, setSolutions] = useState<number[][]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(true);
  const runId = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => { reset(); }, [n]); // eslint-disable-line

  function reset() {
    runId.current++;
    setBoard(Array(n).fill(-1)); setConflict(null); setScanning(null);
    setStats(ZERO); setSolutions([]); setRunning(false); setDone(false);
    setStatus("💤 Status: Idle. Configure N and run the engine.");
  }

  async function run() {
    reset();
    const id = ++runId.current;
    setRunning(true);
    const N = n;
    const b = Array(N).fill(-1);
    const s = { ...ZERO };
    const start = performance.now();
    const found: number[][] = [];
    const sync = () => { s.ms = Math.round(performance.now() - start); setStats({ ...s }); setBoard([...b]); };
    const wait = () => new Promise<void>((r) => setTimeout(r, speedRef.current * 1000));
    const alive = () => runId.current === id;

    const isSafe = (row: number, col: number) => {
      s.checks++;
      for (let c = 0; c < col; c++) {
        const r = b[c];
        if (r === row || Math.abs(r - row) === col - c) return false; // row, upper & lower diagonals
      }
      return true;
    };

    const solve = async (col: number): Promise<void> => {
      if (!alive()) return;
      s.calls++;
      if (col === N) {
        found.push([...b]); setSolutions([...found]);
        setStatus(`✅ Solution #${found.length} found! Recording and continuing search...`);
        sync(); await wait(); return;
      }
      for (let row = 0; row < N; row++) {
        if (!alive()) return;
        setScanning([row, col]);
        if (isSafe(row, col)) {
          b[col] = row; setConflict(null);
          setStatus(`🔄 Status: Placing Queen at Row ${row}, Column ${col}...`);
          sync(); await wait();
          await solve(col + 1);
          if (!alive()) return;
          b[col] = -1; s.backtracks++;
          setStatus(`↩️ Backtracking: removing Queen from Row ${row}, Column ${col}...`);
          sync(); await wait();
        } else {
          setConflict([row, col]);
          setStatus(`⚠️ Conflict Detected at Row ${row}, Column ${col}! Pruning branch...`);
          sync(); await wait();
          setConflict(null);
        }
      }
    };

    await solve(0);
    if (!alive()) return;
    sync(); setScanning(null); setRunning(false); setDone(true);
    setStatus(`🏁 Complete: ${found.length} valid configurations discovered for N = ${N}.`);
  }

  const cell = Math.min(72, Math.floor(440 / n));

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border px-6 py-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">DAA · Backtracking</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">N-Queens Algorithmic Visualizer</h1>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr_300px]">
        {/* 1. Sidebar */}
        <aside className="rounded-xl border border-border bg-card p-5 space-y-6 h-fit">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">System Boundary Inputs</h2>
          <div>
            <label className="text-sm font-medium">Board Size (N)</label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {[4, 5, 6, 7, 8].map((v) => (
                <button key={v} disabled={running} onClick={() => setN(v)}
                  className={`rounded-md py-2 font-mono font-semibold transition disabled:opacity-50 ${n === v ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary hover:bg-muted"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm"><label className="font-medium">Execution Delay</label><span className="font-mono text-primary">{speed.toFixed(1)}s</span></div>
            <input type="range" min={0.1} max={2} step={0.1} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="mt-2 w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Fast</span><span>Slow</span></div>
          </div>
          <div className="space-y-2">
            <button onClick={run} disabled={running} className="w-full rounded-md bg-primary py-3 font-semibold text-primary-foreground glow-primary transition hover:opacity-90 disabled:opacity-50">
              🚀 Run Backtracking Engine
            </button>
            <button onClick={reset} className="w-full rounded-md border border-border py-3 font-medium hover:bg-secondary transition">Reset Canvas</button>
          </div>
        </aside>

        {/* 2. Canvas */}
        <section className="space-y-4">
          <div className={`rounded-xl border bg-card px-5 py-4 font-mono text-sm transition ${conflict ? "border-destructive text-destructive" : done ? "border-accent text-accent" : "border-primary/60 text-primary"}`}>
            {status}
          </div>
          <div className="flex justify-center rounded-xl border border-border bg-card p-6">
            <div className="grid rounded-md overflow-hidden border border-border" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)` }}>
              {Array.from({ length: n * n }, (_, i) => {
                const r = Math.floor(i / n), c = i % n;
                const queen = board[c] === r;
                const bad = conflict && conflict[0] === r && conflict[1] === c;
                const scan = scanning && scanning[0] === r && scanning[1] === c;
                return (
                  <div key={i} style={{ width: cell, height: cell, fontSize: cell * 0.32 }}
                    className={`relative flex items-center justify-center font-bold transition-all duration-300 ${(r + c) % 2 ? "bg-sq-dark" : "bg-sq-light"} ${scan && !bad && !queen ? "ring-2 ring-inset ring-primary" : ""}`}>
                    {queen && <div className="absolute inset-1 flex flex-col items-center justify-center rounded-md bg-destructive/20 border border-destructive animate-scale-in text-destructive leading-none">👑<span className="text-[0.6em]">Q</span></div>}
                    {bad && <div className="absolute inset-0 flex items-center justify-center bg-destructive/40 animate-flash">❌</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Telemetry */}
        <aside className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Empirical Telemetry</h2>
          {[
            ["Recursive Call Cycles", stats.calls, "text-primary"],
            ["Backtrack Steps", stats.backtracks, "text-destructive"],
            ["Constraint Validations", stats.checks, "text-accent"],
            ["Runtime (ms)", stats.ms, "text-chart-4"],
          ].map(([label, val, cls]) => (
            <div key={label as string} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`font-mono text-3xl font-semibold tabular-nums ${cls}`}>{(val as number).toLocaleString()}</p>
            </div>
          ))}
        </aside>
      </div>

      {/* 4. Results */}
      <section className="px-6 pb-10">
        <div className="rounded-xl border border-border bg-card">
          <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-4">
            <span className="font-semibold">Results Archive <span className="ml-2 font-mono text-sm text-accent">{solutions.length} solutions</span></span>
            <span className="text-muted-foreground">{open ? "▲" : "▼"}</span>
          </button>
          {open && (
            <div className="border-t border-border p-5 space-y-6">
              {solutions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Run the engine to populate verified solution blueprints.</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {solutions.map((sol, k) => (
                    <div key={k} className="animate-fade-in">
                      <div className="grid border border-border" style={{ gridTemplateColumns: `repeat(${n}, 14px)` }}>
                        {Array.from({ length: n * n }, (_, i) => {
                          const r = Math.floor(i / n), c = i % n;
                          return <div key={i} className={`h-[14px] w-[14px] ${sol[c] === r ? "bg-destructive" : (r + c) % 2 ? "bg-sq-dark" : "bg-sq-light"}`} />;
                        })}
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">#{k + 1} [{sol.join(",")}]</p>
                    </div>
                  ))}
                </div>
              )}
              {done && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead className="text-left text-muted-foreground"><tr className="border-b border-border"><th className="py-2">Metric</th><th>Theoretical</th><th>Empirical</th></tr></thead>
                    <tbody>
                      <tr className="border-b border-border"><td className="py-2">Worst-case time</td><td>O(N!) = {fact(n).toLocaleString()}</td><td>{stats.calls.toLocaleString()} calls</td></tr>
                      <tr className="border-b border-border"><td className="py-2">Brute-force space (Nᴺ)</td><td>{(n ** n).toLocaleString()}</td><td>{stats.checks.toLocaleString()} checks</td></tr>
                      <tr className="border-b border-border"><td className="py-2">Branches pruned</td><td>—</td><td>{stats.backtracks.toLocaleString()} backtracks</td></tr>
                      <tr className="border-b border-border"><td className="py-2">Search efficiency</td><td>100%</td><td className="text-accent">{((stats.calls / fact(n)) * 100).toFixed(2)}% of N!</td></tr>
                      <tr><td className="py-2">Auxiliary space</td><td>O(N)</td><td>{n} cells (recursion depth)</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
