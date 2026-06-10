import { useEffect, useRef, useState } from "react";

/* ============================================================
   CONFIG
   ============================================================ */
const PROFILE = {
  name: "Killian Cottrelle",
  tagline: "Graphics Programmer · C++",
  email: "killian.cottrelle@epitech.eu",
  github: "https://github.com/Krio18",
  linkedin: "https://www.linkedin.com/in/killian-cottrelle/",
  cvUrl: "#", // lien vers ton CV PDF
};

const GH_USER = "Krio18";

const PROJECTS = [
  {
    id: "voxelengine",
    repoName: "VOXEL",
    accent: "#f5a524",
    accentDim: "rgba(245,165,36,0.10)",
    kicker: "Moteur de jeu · C++17 · bgfx",
    name: "VoxelEngine",
    pitch:
      "Moteur de jeu 3D de type Unity, construit from scratch : architecture par managers, ECS data-oriented (EnTT), rendu bgfx multiplateforme (Vulkan / D3D12 / Metal), pipeline d'assets avec hot-reload et éditeur ImGui. Conçu pour être distribué en bibliothèque C++ que d'autres développeurs peuvent linker.",
    decisions: [
      "Service Locator + lifecycle de managers ordonné",
      "ECS data-oriented (EnTT) — Systems produisent, Managers consomment",
      "bgfx : Vulkan / D3D12 / Metal auto-détecté",
      "Assets référencés par GUID — survie aux déplacements de fichiers",
      "Hot-reload shaders & textures (inotify / FSEvents / RDCW)",
      "Layout vertex vérifié par static_assert (contrat GPU)",
      "Convention GLM left-handed + depth 0..1 forcée pour bgfx",
      "CI multiplateforme dès le premier commit",
    ],
    phases: [
      { label: "Core Architecture", status: "done" },
      { label: "Minimal Rendering", status: "done" },
      { label: "Manager Infrastructure", status: "done" },
      { label: "Scene & ECS", status: "wip" },
      { label: "Asset Pipeline", status: "todo" },
      { label: "Editor & Tools", status: "todo" },
      { label: "SDK & Library Build", status: "todo" },
    ],
    stack: ["C++17", "bgfx", "SDL2", "EnTT", "GLM", "CMake", "vcpkg"],
    fallback: {
      stars: 0,
      forks: 0,
      pushedAt: "2026-06-01T00:00:00Z",
      languages: { "C++": 82, CMake: 12, GLSL: 6 },
      commits: [
        { msg: "RenderManager: tri opaque front-to-back + transparent back-to-front", date: "2026-06-01T00:00:00Z" },
        { msg: "CameraManager: submitCamera + ViewProjection vers RenderManager", date: "2026-05-28T00:00:00Z" },
        { msg: "Engine base class: hooks onInit/onUpdate/onShutdown + Sandbox", date: "2026-05-24T00:00:00Z" },
      ],
    },
  },
  {
    id: "orbitsim",
    repoName: "OrbitSim",
    accent: "#4cc9f0",
    accentDim: "rgba(76,201,240,0.10)",
    kicker: "Simulation aérospatiale · C++ · float64",
    name: "OrbitSim",
    pitch:
      "Simulation orbitale de type Kerbal où les orbites émergent de l'intégration des forces — pas de trajectoires scriptées. Cœur déterministe à pas fixe, intégrateurs symplectiques, gravité hybride n-corps, atmosphères multi-couches et descente propulsée autonome façon Falcon 9.",
    decisions: [
      "Velocity Verlet / Leapfrog — conservation d'énergie sur le long terme",
      "Modèle hybride : corps sur rails képlériens, vaisseau en n-corps",
      "float64 partout + origine flottante pour le rendu",
      "μ = GM chargé directement (plus précis que G·M séparés)",
      "Atmosphères multi-couches dérivées de la composition (masse molaire)",
      "Time warp via propagation analytique des coniques",
      "Sim testable sans fenêtre — cœur physique découplé du rendu",
      "Validation analytique : vis-viva, Tsiolkovsky, T = 2π√(a³/μ)",
    ],
    phases: [
      { label: "Sim Core (état, dt fixe, intégrateurs)", status: "wip" },
      { label: "First Orbit 2D", status: "todo" },
      { label: "Système solaire data-driven", status: "todo" },
      { label: "Vaisseau 6DOF & propulsion", status: "todo" },
      { label: "Atmosphères & aérodynamique", status: "todo" },
      { label: "GNC — atterrissage autonome", status: "todo" },
      { label: "Prédiction de trajectoire & warp", status: "todo" },
    ],
    stack: ["C++", "GLM (dvec3)", "SDL2", "nlohmann-json", "GoogleTest"],
    fallback: {
      stars: 0,
      forks: 0,
      pushedAt: "2026-06-02T00:00:00Z",
      languages: { "C++": 90, CMake: 10 },
      commits: [
        { msg: "Roadmap: validation analytique + stratégie de tests", date: "2026-06-02T00:00:00Z" },
        { msg: "Core: State representation + Derivative struct", date: "2026-05-30T00:00:00Z" },
        { msg: "Init repo: architecture deterministe fixed-timestep", date: "2026-05-27T00:00:00Z" },
      ],
    },
  },
];

const TICKER = [
  "C++17", "bgfx", "Vulkan", "Direct3D 12", "Metal", "ECS / EnTT", "GLM",
  "Velocity Verlet", "Fixed Timestep", "float64", "Floating Origin",
  "Keplerian Rails", "Shadow Mapping", "Hot-Reload", "ImGui", "CMake",
  "Blinn-Phong", "Frustum Culling", "Quaternions", "PID Control",
];

const LANG_COLORS = {
  "C++": "#f34b7d", C: "#555555", CMake: "#064f8c", GLSL: "#5686a5",
  Shell: "#89e051", Makefile: "#427819", Python: "#3572A5", Other: "#8b97a8",
};

/* ============================================================
   GITHUB API — fetch live, fallback statique si indisponible
   ============================================================ */
function useGithubRepo(project) {
  const [data, setData] = useState({ ...project.fallback, live: false });

  useEffect(() => {
    let cancelled = false;
    const base = `https://api.github.com/repos/${GH_USER}/${project.repoName}`;

    const load = async () => {
      try {
        const [repoRes, langRes, commitsRes] = await Promise.all([
          fetch(base),
          fetch(`${base}/languages`),
          fetch(`${base}/commits?per_page=3`),
        ]);
        if (!repoRes.ok) throw new Error("repo fetch failed");

        const repo = await repoRes.json();
        const langs = langRes.ok ? await langRes.json() : {};
        const commitsRaw = commitsRes.ok ? await commitsRes.json() : [];

        const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
        const languages = {};
        Object.entries(langs)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .forEach(([k, v]) => {
            languages[k] = Math.round((v / totalBytes) * 100);
          });

        const commits = (Array.isArray(commitsRaw) ? commitsRaw : [])
          .slice(0, 3)
          .map((c) => ({
            msg: (c.commit?.message || "").split("\n")[0],
            date: c.commit?.author?.date || c.commit?.committer?.date,
            sha: (c.sha || "").slice(0, 7),
            url: c.html_url,
          }));

        if (!cancelled) {
          setData({
            stars: repo.stargazers_count ?? 0,
            forks: repo.forks_count ?? 0,
            pushedAt: repo.pushed_at,
            languages: Object.keys(languages).length ? languages : project.fallback.languages,
            commits: commits.length ? commits : project.fallback.commits,
            description: repo.description,
            live: true,
          });
        }
      } catch {
        /* offline / rate-limit → on garde le fallback, le site reste complet */
      }
    };
    load();
    return () => { cancelled = true; };
  }, [project.repoName]);

  return data;
}

function timeAgoFr(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "aujourd'hui";
  if (d === 1) return "hier";
  if (d < 30) return `il y a ${d} j`;
  const m = Math.floor(d / 30);
  if (m < 12) return `il y a ${m} mois`;
  return `il y a ${Math.floor(m / 12)} an${m >= 24 ? "s" : ""}`;
}

/* ============================================================
   HERO CANVAS — starfield + cube wireframe 3D + orbites Verlet
   ============================================================ */
function HeroCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0, w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /* --- starfield (3 couches de parallaxe) --- */
    const stars = [];
    for (let i = 0; i < 160; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        z: 0.3 + Math.random() * 0.7,
        tw: Math.random() * Math.PI * 2,
      });
    }

    /* --- orbites : Velocity Verlet, dt fixe --- */
    const mu = 26000;
    const sats = [];
    for (let i = 0; i < 3; i++) {
      const r = 120 + i * 60;
      const v = Math.sqrt(mu / r) * (i === 1 ? 0.93 : 1.0);
      const a0 = (i * 2 * Math.PI) / 3;
      sats.push({
        x: r * Math.cos(a0), y: r * Math.sin(a0),
        vx: -v * Math.sin(a0), vy: v * Math.cos(a0),
        trail: [],
      });
    }
    const accel = (x, y) => {
      const d2 = x * x + y * y, d = Math.sqrt(d2);
      const a = -mu / (d2 * d);
      return [a * x, a * y];
    };
    const dt = 1 / 60;
    const stepSat = (s) => {
      let [ax, ay] = accel(s.x, s.y);
      s.x += s.vx * dt + 0.5 * ax * dt * dt;
      s.y += s.vy * dt + 0.5 * ay * dt * dt;
      const [ax2, ay2] = accel(s.x, s.y);
      s.vx += 0.5 * (ax + ax2) * dt;
      s.vy += 0.5 * (ay + ay2) * dt;
      s.trail.push([s.x, s.y]);
      if (s.trail.length > 260) s.trail.shift();
    };

    /* --- cube wireframe : projection perspective manuelle --- */
    const V = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
    ];
    const E = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];
    const project = (p, rx, ry, scale, cx, cy) => {
      let [x, y, z] = p;
      // rotation Y
      let c = Math.cos(ry), s = Math.sin(ry);
      [x, z] = [x * c + z * s, -x * s + z * c];
      // rotation X
      c = Math.cos(rx); s = Math.sin(rx);
      [y, z] = [y * c - z * s, y * s + z * c];
      const f = 4 / (4 + z); // perspective divide
      return [cx + x * f * scale, cy + y * f * scale, f];
    };

    let t = 0;
    const drawFrame = (animate) => {
      t += animate ? 1 : 0;
      ctx.clearRect(0, 0, w, h);

      // fond : vignette radiale
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.7);
      bgGrad.addColorStop(0, "rgba(35,45,65,0.5)");
      bgGrad.addColorStop(1, "rgba(13,16,22,0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // étoiles
      stars.forEach((st) => {
        const tw = 0.5 + 0.5 * Math.sin(st.tw + t * 0.02 * st.z);
        ctx.fillStyle = `rgba(200,215,240,${0.12 + 0.35 * tw * st.z})`;
        ctx.fillRect(st.x * w, st.y * h, st.z * 1.6, st.z * 1.6);
      });

      // grille de viewport
      ctx.strokeStyle = "rgba(120,140,170,0.05)";
      ctx.lineWidth = 1;
      const grid = 52;
      for (let gx = 0; gx < w; gx += grid) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy < h; gy += grid) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

      const ocx = w * 0.72, ocy = h * 0.46; // centre orbites (côté droit)
      const ccx = w * 0.72, ccy = h * 0.46; // cube au centre des orbites

      // corps central lumineux
      const g2 = ctx.createRadialGradient(ocx, ocy, 0, ocx, ocy, 56);
      g2.addColorStop(0, "rgba(245,165,36,0.55)");
      g2.addColorStop(1, "rgba(245,165,36,0)");
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(ocx, ocy, 56, 0, Math.PI * 2); ctx.fill();

      // cube wireframe (le "moteur") qui tourne au centre
      const rx = t * 0.006 + 0.5, ry = t * 0.009;
      const pts = V.map((p) => project(p, rx, ry, 34, ccx, ccy));
      E.forEach(([a, b]) => {
        const depth = (pts[a][2] + pts[b][2]) * 0.5;
        ctx.strokeStyle = `rgba(245,165,36,${0.25 + depth * 0.45})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(pts[a][0], pts[a][1]);
        ctx.lineTo(pts[b][0], pts[b][1]);
        ctx.stroke();
      });
      pts.forEach((p) => {
        ctx.fillStyle = `rgba(245,200,120,${0.4 + p[2] * 0.5})`;
        ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, Math.PI * 2); ctx.fill();
      });

      // satellites + traînées
      sats.forEach((s, i) => {
        if (animate) for (let k = 0; k < 2; k++) stepSat(s);
        const col = i === 1 ? "76,201,240" : "150,175,210";
        ctx.beginPath();
        s.trail.forEach(([px, py], k) => {
          const sx = ocx + px, sy = ocy + py;
          if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        });
        ctx.strokeStyle = `rgba(${col},0.4)`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        // halo vaisseau
        const sg = ctx.createRadialGradient(ocx + s.x, ocy + s.y, 0, ocx + s.x, ocy + s.y, 9);
        sg.addColorStop(0, `rgba(${col},0.8)`);
        sg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(ocx + s.x, ocy + s.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${col},1)`;
        ctx.beginPath(); ctx.arc(ocx + s.x, ocy + s.y, 2.6, 0, Math.PI * 2); ctx.fill();
      });

      if (animate) raf = requestAnimationFrame(() => drawFrame(true));
    };

    if (reduced) {
      sats.forEach((s) => { for (let k = 0; k < 260; k++) stepSat(s); });
      t = 120;
      drawFrame(false);
    } else {
      raf = requestAnimationFrame(() => drawFrame(true));
    }

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}

/* ============================================================
   COMPOSANTS
   ============================================================ */
function LangBar({ languages, accent }) {
  const entries = Object.entries(languages);
  return (
    <div className="lang-block">
      <div className="lang-bar">
        {entries.map(([name, pct]) => (
          <span
            key={name}
            style={{ width: `${pct}%`, background: LANG_COLORS[name] || LANG_COLORS.Other }}
            title={`${name} ${pct}%`}
          />
        ))}
      </div>
      <div className="lang-legend">
        {entries.map(([name, pct]) => (
          <span key={name}>
            <i style={{ background: LANG_COLORS[name] || LANG_COLORS.Other }} />
            {name} <b>{pct}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function CommitFeed({ commits, repoUrl }) {
  return (
    <div className="commit-feed">
      {commits.map((c, i) => (
        <a
          key={i}
          className="commit"
          href={c.url || repoUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="commit-sha">{c.sha || "·······"}</span>
          <span className="commit-msg">{c.msg}</span>
          <span className="commit-date">{timeAgoFr(c.date)}</span>
        </a>
      ))}
    </div>
  );
}

function PhaseTrack({ phases, accent }) {
  const done = phases.filter((p) => p.status === "done").length;
  const wip = phases.filter((p) => p.status === "wip").length;
  const pct = Math.round(((done + wip * 0.5) / phases.length) * 100);
  return (
    <div>
      <div className="progress-line">
        <div className="progress-fill" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <div className="progress-label">{pct}% de la roadmap engagée</div>
      <div className="phase-track">
        {phases.map((p, i) => (
          <div key={i} className={`phase phase--${p.status}`}>
            <span
              className="phase-dot"
              style={p.status !== "todo" ? { background: accent, boxShadow: `0 0 8px ${accent}` } : undefined}
            />
            <span className="phase-label">{p.label}</span>
            <span className="phase-status">
              {p.status === "done" ? "fait" : p.status === "wip" ? "en cours" : "à venir"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectSection({ project, flip }) {
  const gh = useGithubRepo(project);
  const repoUrl = `https://github.com/${GH_USER}/${project.repoName}`;

  return (
    <section id={project.id} className={`project ${flip ? "project--flip" : ""}`}>
      <div className="project-main">
        <p className="kicker" style={{ color: project.accent }}>{project.kicker}</p>
        <h2 className="project-title">{project.name}</h2>

        <div className="repo-stats">
          <span className="repo-stat">★ {gh.stars}</span>
          <span className="repo-stat">⑂ {gh.forks} forks</span>
          <span className="repo-stat">
            dernier push : <b>{timeAgoFr(gh.pushedAt)}</b>
          </span>
          <span className={`repo-stat repo-live ${gh.live ? "is-live" : ""}`}>
            {gh.live ? "● synchronisé avec GitHub" : "○ données locales"}
          </span>
        </div>

        <p className="project-pitch">{project.pitch}</p>

        <div className="decisions">
          <h3 className="block-label">Décisions techniques</h3>
          <ul className="decisions-grid">
            {project.decisions.map((d, i) => (
              <li key={i}>
                <span className="tick" style={{ color: project.accent }}>▸</span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div className="stack-row">
          {project.stack.map((s) => (
            <span key={s} className="stack-chip">{s}</span>
          ))}
        </div>

        <div className="cta-row">
          <a className="btn btn--solid" style={{ background: project.accent }} href={`${repoUrl}/releases`} target="_blank" rel="noreferrer">
            Télécharger
          </a>
          <a className="btn btn--ghost" href={repoUrl} target="_blank" rel="noreferrer">
            Code source
          </a>
        </div>
      </div>

      <aside className="project-side">
        <div className="side-card">
          <h3 className="block-label">Langages du dépôt</h3>
          <LangBar languages={gh.languages} accent={project.accent} />
        </div>
        <div className="side-card">
          <h3 className="block-label">Derniers commits</h3>
          <CommitFeed commits={gh.commits} repoUrl={repoUrl} />
        </div>
        <div className="side-card">
          <h3 className="block-label">Roadmap</h3>
          <PhaseTrack phases={project.phases} accent={project.accent} />
        </div>
      </aside>
    </section>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function Portfolio() {
  const [copied, setCopied] = useState(false);
  const copyEmail = () => {
    navigator.clipboard?.writeText(PROFILE.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="page">
      <style>{`
        :root {
          --bg: #0d1016;
          --bg-raise: #141925;
          --bg-card: #11151f;
          --line: rgba(140,160,190,0.14);
          --text: #e2e8f2;
          --text-dim: #8b97a8;
          --amber: #f5a524;
          --cyan: #4cc9f0;
          --mono: "JetBrains Mono", ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace;
          --sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .page { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; line-height: 1.6; }
        a { color: inherit; }
        :focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; border-radius: 2px; }

        /* ---------- NAV ---------- */
        .nav {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 32px;
          background: rgba(13,16,22,0.82);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--line);
        }
        .nav-brand { font-family: var(--mono); font-size: 14px; letter-spacing: 0.04em; }
        .nav-brand b { color: var(--amber); }
        .nav-links { display: flex; gap: 22px; font-size: 13px; font-family: var(--mono); }
        .nav-links a { color: var(--text-dim); text-decoration: none; transition: color .15s; }
        .nav-links a:hover { color: var(--text); }

        /* ---------- HERO ---------- */
        .hero { position: relative; min-height: 88vh; display: flex; align-items: center; overflow: hidden; }
        .hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
        .hero-content { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding: 90px 32px; width: 100%; }
        .hero-eyebrow {
          font-family: var(--mono); font-size: 13px; color: var(--cyan);
          letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .hero-eyebrow::before { content: ""; width: 28px; height: 1px; background: var(--cyan); }
        .hero h1 {
          font-family: var(--mono);
          font-size: clamp(34px, 5.2vw, 62px);
          font-weight: 700; line-height: 1.12; letter-spacing: -0.02em;
          max-width: 720px; text-wrap: balance;
          text-shadow: 0 0 40px rgba(13,16,22,0.9);
        }
        .hero h1 .accent { color: var(--amber); text-shadow: 0 0 24px rgba(245,165,36,0.35); }
        .hero h1 .accent2 { color: var(--cyan); text-shadow: 0 0 24px rgba(76,201,240,0.35); }
        .hero-sub { margin-top: 22px; max-width: 540px; color: var(--text-dim); font-size: 17px; text-shadow: 0 0 20px rgba(13,16,22,0.9); }
        .hero-sub code {
          font-family: var(--mono); font-size: 14px;
          background: var(--bg-raise); padding: 2px 7px; border-radius: 4px;
          border: 1px solid var(--line); color: var(--text);
        }
        .hero-cta { margin-top: 34px; display: flex; gap: 14px; flex-wrap: wrap; }
        .live-note {
          margin-top: 44px; font-family: var(--mono); font-size: 12px; color: var(--text-dim);
          display: flex; align-items: center; gap: 8px;
        }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 10px var(--cyan); animation: pulse 2s infinite; }
        @keyframes pulse { 50% { opacity: 0.35; } }
        @media (prefers-reduced-motion: reduce) { .live-dot { animation: none; } .ticker-inner { animation: none !important; } }

        /* ---------- TICKER ---------- */
        .ticker {
          border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
          background: var(--bg-card); overflow: hidden; white-space: nowrap;
          padding: 13px 0; position: relative; z-index: 2;
        }
        .ticker-inner {
          display: inline-block;
          animation: scroll 42s linear infinite;
          font-family: var(--mono); font-size: 13px; color: var(--text-dim);
        }
        .ticker-inner span { margin: 0 26px; }
        .ticker-inner span::after { content: "·"; margin-left: 26px; color: var(--amber); }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ---------- BUTTONS ---------- */
        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: 6px;
          font-family: var(--mono); font-size: 13.5px; font-weight: 600;
          text-decoration: none; cursor: pointer;
          border: 1px solid transparent;
          transition: transform .12s, box-shadow .12s, border-color .12s;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn--solid { color: #14110a; }
        .btn--solid:hover { box-shadow: 0 6px 24px rgba(245,165,36,0.25); }
        .btn--ghost { border-color: var(--line); color: var(--text); background: rgba(255,255,255,0.03); }
        .btn--ghost:hover { border-color: var(--text-dim); }

        /* ---------- PROJECTS ---------- */
        .projects-wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
        .project {
          display: grid; grid-template-columns: 1.5fr 1fr; gap: 52px;
          padding: 92px 0; border-bottom: 1px solid var(--line);
        }
        .project--flip .project-main { order: 2; }
        .project--flip .project-side { order: 1; }

        .kicker { font-family: var(--mono); font-size: 12.5px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px; }
        .project-title { font-family: var(--mono); font-size: clamp(30px, 3.6vw, 46px); font-weight: 700; letter-spacing: -0.02em; }

        .repo-stats { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px; }
        .repo-stat {
          font-family: var(--mono); font-size: 12px;
          padding: 5px 12px; border-radius: 99px;
          background: var(--bg-raise); border: 1px solid var(--line); color: var(--text-dim);
        }
        .repo-stat b { color: var(--text); font-weight: 600; }
        .repo-live.is-live { color: #6ee7a0; border-color: rgba(110,231,160,0.3); }

        .project-pitch { margin-top: 18px; color: var(--text-dim); font-size: 16px; max-width: 620px; }

        .block-label {
          font-family: var(--mono); font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-dim);
          margin-bottom: 14px;
        }
        .decisions { margin-top: 34px; }
        .decisions-grid {
          list-style: none;
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px;
        }
        .decisions-grid li { font-size: 13.5px; display: flex; gap: 9px; align-items: baseline; }
        .tick { font-family: var(--mono); flex-shrink: 0; }

        .stack-row { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
        .stack-chip {
          font-family: var(--mono); font-size: 12px;
          padding: 5px 11px; border-radius: 5px;
          background: var(--bg-raise); border: 1px solid var(--line); color: var(--text-dim);
        }
        .cta-row { margin-top: 30px; display: flex; gap: 12px; flex-wrap: wrap; }

        /* ---------- SIDE CARDS ---------- */
        .project-side { display: grid; gap: 18px; align-content: start; padding-top: 50px; }
        .side-card {
          border: 1px solid var(--line); border-radius: 12px;
          background: var(--bg-card); padding: 18px 18px 16px;
        }

        .lang-bar { display: flex; height: 8px; border-radius: 99px; overflow: hidden; background: var(--bg-raise); }
        .lang-bar span { display: block; height: 100%; }
        .lang-legend { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px 16px; font-family: var(--mono); font-size: 11.5px; color: var(--text-dim); }
        .lang-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
        .lang-legend b { color: var(--text); font-weight: 600; }

        .commit-feed { display: grid; gap: 2px; }
        .commit {
          display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: baseline;
          padding: 8px 10px; border-radius: 7px; text-decoration: none;
          transition: background .12s;
        }
        .commit:hover { background: var(--bg-raise); }
        .commit-sha { font-family: var(--mono); font-size: 11px; color: var(--amber); }
        .commit-msg {
          font-size: 12.5px; color: var(--text);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .commit-date { font-family: var(--mono); font-size: 10.5px; color: var(--text-dim); white-space: nowrap; }

        .progress-line { height: 5px; border-radius: 99px; background: var(--bg-raise); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; }
        .progress-label { margin: 8px 0 12px; font-family: var(--mono); font-size: 11px; color: var(--text-dim); }
        .phase-track { display: grid; }
        .phase {
          display: flex; align-items: center; gap: 11px;
          padding: 8px 4px; font-size: 12.5px;
          border-bottom: 1px solid rgba(140,160,190,0.07);
        }
        .phase:last-child { border-bottom: none; }
        .phase-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--line); flex-shrink: 0; }
        .phase-label { flex: 1; }
        .phase--todo .phase-label { color: var(--text-dim); }
        .phase-status { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); }
        .phase--done .phase-status { color: var(--text); }

        /* ---------- METHOD ---------- */
        .method { max-width: 1180px; margin: 0 auto; padding: 86px 32px; border-bottom: 1px solid var(--line); }
        .method h2 { font-family: var(--mono); font-size: clamp(22px, 2.6vw, 30px); letter-spacing: -0.01em; margin-bottom: 44px; max-width: 720px; }
        .method-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .method-card { padding: 24px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg-card); }
        .method-card h3 { font-family: var(--mono); font-size: 14px; margin-bottom: 10px; color: var(--amber); }
        .method-card p { font-size: 13.5px; color: var(--text-dim); }
        .terminal {
          grid-column: 1 / -1;
          border: 1px solid var(--line); border-radius: 12px; overflow: hidden;
          background: #0a0d12;
        }
        .terminal-bar {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 14px; border-bottom: 1px solid var(--line);
          background: var(--bg-card);
        }
        .terminal-bar i { width: 11px; height: 11px; border-radius: 50%; background: var(--line); }
        .terminal-bar i:nth-child(1) { background: #e5605c; }
        .terminal-bar i:nth-child(2) { background: #e0b341; }
        .terminal-bar i:nth-child(3) { background: #5fc465; }
        .terminal-bar span { margin-left: 8px; font-family: var(--mono); font-size: 11px; color: var(--text-dim); }
        .terminal pre {
          padding: 18px 20px; font-family: var(--mono); font-size: 13px;
          line-height: 1.8; color: var(--text-dim); overflow-x: auto;
        }
        .terminal pre .p { color: var(--cyan); }
        .terminal pre .c { color: #5a6678; }
        .terminal pre .ok { color: #6ee7a0; }

        /* ---------- CONTACT ---------- */
        .contact { max-width: 1180px; margin: 0 auto; padding: 92px 32px 76px; text-align: center; }
        .contact h2 { font-family: var(--mono); font-size: clamp(26px, 3.4vw, 40px); letter-spacing: -0.02em; }
        .contact p { margin-top: 14px; color: var(--text-dim); max-width: 500px; margin-left: auto; margin-right: auto; }
        .contact-row { margin-top: 32px; display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .email-line { margin-top: 26px; font-family: var(--mono); font-size: 13px; color: var(--text-dim); }
        .email-line button {
          background: none; border: none; color: var(--cyan);
          font-family: var(--mono); font-size: 13px; cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px;
        }
        .footer {
          border-top: 1px solid var(--line);
          padding: 20px 32px;
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
          font-family: var(--mono); font-size: 12px; color: var(--text-dim);
        }
        .footer a { color: var(--text-dim); text-decoration: none; margin-left: 18px; }
        .footer a:hover { color: var(--text); }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 920px) {
          .project, .project--flip { grid-template-columns: 1fr; gap: 32px; padding: 64px 0; }
          .project--flip .project-main { order: 1; }
          .project--flip .project-side { order: 2; }
          .project-side { padding-top: 0; }
          .decisions-grid { grid-template-columns: 1fr; }
          .method-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .hero { min-height: 76vh; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-brand"><b>~/</b>killian-cottrelle</div>
        <div className="nav-links">
          <a href="#voxelengine">VoxelEngine</a>
          <a href="#orbitsim">OrbitSim</a>
          <a href="#methode">Méthode</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <HeroCanvas />
        <div className="hero-content">
          <p className="hero-eyebrow">{PROFILE.tagline}</p>
          <h1>
            Du <span className="accent">draw call</span> à l'<span className="accent2">orbite</span> —
            je construis le rendu et la physique qui les fait tourner.
          </h1>
          <p className="hero-sub">
            Graphics programmer. Deux projets, une même exigence : architecture
            documentée, physique validée contre l'analytique, déterminisme au cœur.
            Le cube et les orbites derrière ce texte sont projetés et intégrés
            en <code>Velocity Verlet</code>, en direct, dans votre navigateur.
          </p>
          <div className="hero-cta">
            <a className="btn btn--solid" style={{ background: "var(--amber)" }} href="#voxelengine">
              Voir les projets
            </a>
            <a className="btn btn--ghost" href={PROFILE.github} target="_blank" rel="noreferrer">
              github.com/Krio18
            </a>
          </div>
          <div className="live-note">
            <span className="live-dot" />
            rendu live — projection perspective + intégration symplectique · dt = 1/60 s
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-inner">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* PROJECTS */}
      <main className="projects-wrap">
        {PROJECTS.map((p, i) => (
          <ProjectSection key={p.id} project={p} flip={i % 2 === 1} />
        ))}
      </main>

      {/* METHOD */}
      <section id="methode" className="method">
        <h2>Deux projets différents, une méthode commune — celle d'un code fait pour durer.</h2>
        <div className="method-grid">
          <div className="method-card">
            <h3>// Architecture explicite</h3>
            <p>
              Ordre d'initialisation des systèmes documenté, séparation sim/rendu
              stricte, patterns partagés entre projets (Service Locator, fixed
              timestep, lifecycle de managers). Les décisions sont écrites avant le code.
            </p>
          </div>
          <div className="method-card">
            <h3>// Validation, pas vibes</h3>
            <p>
              Chaque système a sa vérité-terrain : énergie orbitale conservée, Δv
              vérifié contre Tsiolkovsky, static_assert sur les layouts mémoire.
              Une simulation qui a juste l'air correcte ne suffit pas.
            </p>
          </div>
          <div className="method-card">
            <h3>// Pièges anticipés</h3>
            <p>
              Origine flottante avant que la float32 ne tremble, intégrateurs
              symplectiques avant que les orbites ne spiralent, CI multiplateforme
              avant que les builds ne cassent.
            </p>
          </div>
          <div className="method-card">
            <h3>// Roadmaps traçables</h3>
            <p>
              Chaque projet a une roadmap versionnée dans le dépôt : phases,
              décisions techniques justifiées, tâches reportées tracées, stratégie
              de tests. Le plan fait partie du livrable.
            </p>
          </div>
          <div className="terminal">
            <div className="terminal-bar">
              <i /><i /><i />
              <span>build — toutes plateformes</span>
            </div>
            <pre>
{`$ `}<span className="p">git clone</span>{` https://github.com/Krio18/VOXEL && cd VOXEL
$ `}<span className="p">cmake</span>{` -B build -DCMAKE_BUILD_TYPE=Release
$ `}<span className="p">cmake</span>{` --build build
`}<span className="c"># Vulkan sur Linux · D3D12 sur Windows · Metal sur macOS — auto-détecté par bgfx</span>{`
`}<span className="ok">[100%] Built target VoxelEngine ✓</span>
            </pre>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact">
        <h2>Parlons rendu.</h2>
        <p>
          À la recherche d'opportunités en graphics programming.
          Le code des deux projets est ouvert — la meilleure façon de me jauger
          est de le lire.
        </p>
        <div className="contact-row">
          <a className="btn btn--solid" style={{ background: "var(--cyan)" }} href={`mailto:${PROFILE.email}`}>
            M'écrire un email
          </a>
          <a className="btn btn--ghost" href={PROFILE.github} target="_blank" rel="noreferrer">GitHub</a>
          <a className="btn btn--ghost" href={PROFILE.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <p className="email-line">
          {PROFILE.email} ·{" "}
          <button onClick={copyEmail}>{copied ? "copié ✓" : "copier l'adresse"}</button>
        </p>
      </section>

      <footer className="footer">
        <span>Killian Cottrelle — Graphics Programmer</span>
        <span>
          <a href={PROFILE.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={PROFILE.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={`mailto:${PROFILE.email}`}>Email</a>
        </span>
      </footer>
    </div>
  );
}
