import { useEffect, useMemo, useRef, useState } from "react";
import {
  affiliations,
  authors,
  citation,
  familyDescriptions,
  methodFigures,
  navItems,
  projectLinks,
  videoEntries,
} from "./data/projectData";
import type { FigurePanel, VideoEntry, VideoVariant } from "./types";

type DemoMode = "compare" | VideoVariant;

const sectionIds = {
  abstract: "abstract",
  method: "method",
  results: "results",
  demos: "demos",
  citation: "citation",
} as const;

function withBase(path: string) {
  const cleanPath = path.replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}

function variantDisplayLabel(variant: VideoVariant) {
  return variant === "base"
    ? "Qwen3-VL-8B-Instruct (before training)"
    : "Odysseus (after training)";
}

const trainingPerformanceColumns = [
  "W1-L1",
  "W1-L2",
  "W1-L3",
  "W2-L1",
  "W2-L2",
  "Avg.",
] as const;

const trainingPerformanceRows = [
  { model: "GPT-5.4", values: ["403.62", "67.62", "654.86", "252.75", "173.50", "310.47"] },
  { model: "Gemini-3-Flash", values: ["529.12", "255.88", "493.43", "187.75", "239.50", "341.14"] },
  { model: "Claude-Sonnet-4.6", values: ["608.12", "132.00", "502.62", "206.50", "291.75", "348.19"] },
  {
    model: "Qwen3-VL-235B-A22B-Instruct",
    values: ["424.42", "51.69", "511.48", "186.88", "222.77", "279.45"],
  },
  {
    model: "InternVL3.5-241B-A28B",
    values: ["442.41", "78.12", "390.11", "188.61", "196.40", "259.13"],
  },
  { model: "GLM-4.6V (106B-A12B)", values: ["731.28", "364.85", "534.04", "478.46", "455.94", "512.91"] },
  {
    model: "Qwen3-VL-8B-Instruct (base)",
    values: ["513.57", "129.14", "274.20", "238.92", "195.33", "270.23"],
  },
  { model: "Odysseus-SFT", values: ["479.47", "90.92", "300.76", "245.01", "192.69", "261.77"] },
  { model: "Odysseus-Zero", values: ["1545.50", "1222.69", "1551.57", "1262.18", "1192.71", "1354.93"] },
  { model: "Odysseus", values: ["1644.43", "1430.88", "1603.36", "1352.30", "1528.51", "1511.90"] },
  { model: "Maximum", values: ["2351", "2190", "2336", "2510", "2191", "2315.6"] },
] as const;

const generalBenchmarkColumns = ["MMMUval", "MathVision", "RealWorldQA"] as const;

const generalBenchmarkRows = [
  { model: "Qwen3-VL-8B-Instruct (base)", values: ["69.00", "54.64", "71.11"] },
  { model: "Odysseus-SFT", values: ["70.44", "55.00", "71.37"] },
  { model: "Odysseus-Zero", values: ["70.22", "54.44", "70.72"] },
  { model: "Odysseus", values: ["70.77", "53.52", "71.11"] },
] as const;

function FigureCard({ figure }: { figure: FigurePanel }) {
  return (
    <article className="figure-card">
      {figure.tag ? <div className="figure-tag">{figure.tag}</div> : null}
      <img src={withBase(figure.src)} alt={figure.title} loading="lazy" />
      <div className="figure-copy">
        <h3>{figure.title}</h3>
        <p>{figure.caption}</p>
      </div>
    </article>
  );
}

function ResultsTable({
  columns,
  rows,
  highlightRow,
}: {
  columns: readonly string[];
  rows: readonly { model: string; values: readonly string[] }[];
  highlightRow?: string;
}) {
  return (
    <div className="results-table-shell">
      <table className="results-table">
        <thead>
          <tr>
            <th>Model</th>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.model} className={row.model === highlightRow ? "is-highlight" : ""}>
              <th>{row.model}</th>
              {row.values.map((value, index) => (
                <td key={`${row.model}-${columns[index]}`}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const groupedFamilies = useMemo(() => {
    return Object.entries(
      videoEntries.reduce<Record<string, VideoEntry[]>>((acc, entry) => {
        acc[entry.family] ??= [];
        acc[entry.family].push(entry);
        return acc;
      }, {}),
    ).map(([family, entries]) => {
      const scenarios = Object.entries(
        entries.reduce<Record<string, VideoEntry[]>>((acc, entry) => {
          acc[entry.scenarioId] ??= [];
          acc[entry.scenarioId].push(entry);
          return acc;
        }, {}),
      )
        .map(([scenarioId, scenarioEntries]) => ({
          scenarioId,
          scenarioLabel: scenarioEntries[0].scenarioLabel,
          entries: [...scenarioEntries].sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
        }))
        .sort((a, b) => a.entries[0].sortKey.localeCompare(b.entries[0].sortKey));

      return {
        family: family as VideoEntry["family"],
        label: familyDescriptions[family as VideoEntry["family"]].label,
        description: familyDescriptions[family as VideoEntry["family"]].description,
        scenarios,
      };
    });
  }, []);

  const initialState = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      family: params.get("family") ?? groupedFamilies[0]?.family ?? "land",
      scenario: params.get("scene") ?? groupedFamilies[0]?.scenarios[0]?.scenarioId ?? "",
      mode: (params.get("mode") as DemoMode | null) ?? "compare",
    };
  }, [groupedFamilies]);

  const [selectedFamily, setSelectedFamily] = useState(initialState.family);
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialState.scenario);
  const [demoMode, setDemoMode] = useState<DemoMode>(initialState.mode);

  const familyData = groupedFamilies.find((family) => family.family === selectedFamily) ?? groupedFamilies[0];
  const scenarioData =
    familyData?.scenarios.find((scenario) => scenario.scenarioId === selectedScenarioId) ??
    familyData?.scenarios[0];

  const baseEntry = scenarioData?.entries.find((entry) => entry.variant === "base");
  const improvedEntry = scenarioData?.entries.find((entry) => entry.variant === "improved");

  const availableModes = useMemo(() => {
    if (baseEntry && improvedEntry) {
      return ["compare", "base", "improved"] as DemoMode[];
    }
    if (improvedEntry) {
      return ["improved"] as DemoMode[];
    }
    return ["base"] as DemoMode[];
  }, [baseEntry, improvedEntry]);

  useEffect(() => {
    if (!familyData) {
      return;
    }
    const hasScenario = familyData.scenarios.some((scenario) => scenario.scenarioId === selectedScenarioId);
    if (!hasScenario) {
      setSelectedScenarioId(familyData.scenarios[0]?.scenarioId ?? "");
    }
  }, [familyData, selectedScenarioId]);

  useEffect(() => {
    if (!availableModes.includes(demoMode)) {
      setDemoMode(availableModes[0]);
    }
  }, [availableModes, demoMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("family", selectedFamily);
    if (selectedScenarioId) {
      params.set("scene", selectedScenarioId);
    }
    params.set("mode", demoMode);
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, [demoMode, selectedFamily, selectedScenarioId]);

  const baseVideoRef = useRef<HTMLVideoElement | null>(null);
  const improvedVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (demoMode !== "compare" || !baseVideoRef.current || !improvedVideoRef.current) {
      return;
    }

    const baseVideo = baseVideoRef.current;
    const improvedVideo = improvedVideoRef.current;
    const videos = [baseVideo, improvedVideo];
    const finishedVideos = new Set<HTMLVideoElement>();
    let locked = false;

    const syncCurrentTime = (source: HTMLVideoElement, target: HTMLVideoElement) => {
      if (locked || finishedVideos.has(target)) {
        return;
      }
      locked = true;
      if (Math.abs(target.currentTime - source.currentTime) > 0.2) {
        target.currentTime = source.currentTime;
      }
      locked = false;
    };

    const handlePlay = (source: HTMLVideoElement, target: HTMLVideoElement) => () => {
      if (locked || finishedVideos.has(source) || finishedVideos.has(target)) {
        return;
      }
      syncCurrentTime(source, target);
      void target.play().catch(() => undefined);
    };

    const handlePause = (source: HTMLVideoElement, target: HTMLVideoElement) => () => {
      if (locked || source.ended || finishedVideos.has(source)) {
        return;
      }
      syncCurrentTime(source, target);
      target.pause();
    };

    const handleSeek = (source: HTMLVideoElement, target: HTMLVideoElement) => () => {
      syncCurrentTime(source, target);
    };

    const handleEnded = (source: HTMLVideoElement, target: HTMLVideoElement) => () => {
      finishedVideos.add(source);
      source.pause();
      source.currentTime = source.duration || source.currentTime;

      if (!finishedVideos.has(target)) {
        return;
      }

      locked = true;
      videos.forEach((video) => {
        video.pause();
        video.currentTime = 0;
      });
      finishedVideos.clear();
      locked = false;

      videos.forEach((video) => {
        void video.play().catch(() => undefined);
      });
    };

    const cleanupFns = [
      [baseVideo, "play", handlePlay(baseVideo, improvedVideo)],
      [improvedVideo, "play", handlePlay(improvedVideo, baseVideo)],
      [baseVideo, "pause", handlePause(baseVideo, improvedVideo)],
      [improvedVideo, "pause", handlePause(improvedVideo, baseVideo)],
      [baseVideo, "seeking", handleSeek(baseVideo, improvedVideo)],
      [improvedVideo, "seeking", handleSeek(improvedVideo, baseVideo)],
      [baseVideo, "ratechange", handleSeek(baseVideo, improvedVideo)],
      [improvedVideo, "ratechange", handleSeek(improvedVideo, baseVideo)],
      [baseVideo, "ended", handleEnded(baseVideo, improvedVideo)],
      [improvedVideo, "ended", handleEnded(improvedVideo, baseVideo)],
    ] as const;

    cleanupFns.forEach(([video, eventName, handler]) => {
      video.addEventListener(eventName, handler);
    });

    return () => {
      cleanupFns.forEach(([video, eventName, handler]) => {
        video.removeEventListener(eventName, handler);
      });
    };
  }, [demoMode, selectedScenarioId]);

  const activeSingleEntry =
    demoMode === "base" ? baseEntry : demoMode === "improved" ? improvedEntry : undefined;

  const demoExplorerSection = (
    <section className="section-block demo-section" id={sectionIds.demos}>
      <div className="section-heading">
        <h2>Odysseus Demos</h2>
      </div>

      <div className="demo-shell">
        <div className="demo-toolbar">
          <div className="toolbar-group">
            <div className="pill-row" role="tablist" aria-label="Demo families">
              {groupedFamilies.map((family) => (
                <button
                  key={family.family}
                  className={family.family === selectedFamily ? "pill active" : "pill"}
                  onClick={() => setSelectedFamily(family.family)}
                  type="button"
                >
                  {family.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="scenario-strip" aria-label="Available scenarios">
          {familyData?.scenarios.map((scenario) => (
            <button
              key={scenario.scenarioId}
              className={
                scenario.scenarioId === scenarioData?.scenarioId
                  ? "scenario-pill active"
                  : "scenario-pill"
              }
              onClick={() => setSelectedScenarioId(scenario.scenarioId)}
              type="button"
            >
              {scenario.scenarioLabel}
            </button>
          ))}
        </div>

        <div className="mode-row" role="tablist" aria-label="Video display mode">
          {availableModes.map((mode) => (
            <button
              key={mode}
              className={demoMode === mode ? "mode-pill active" : "mode-pill"}
              onClick={() => setDemoMode(mode)}
              type="button"
            >
              {mode === "compare"
                ? "Compare"
                : mode === "base"
                  ? "Qwen3-VL-8B-Instruct (before training)"
                  : "Odysseus (after training)"}
            </button>
          ))}
        </div>

        <div className={demoMode === "compare" ? "video-grid compare" : "video-grid single"}>
          {demoMode === "compare" && baseEntry && improvedEntry ? (
            <>
              <article className="video-card">
                <div className="video-card-header">
                  <h3>{variantDisplayLabel(baseEntry.variant)}</h3>
                </div>
                <div className="video-frame">
                  <video
                    key={baseEntry.id}
                    ref={baseVideoRef}
                    poster={withBase(baseEntry.posterSrc)}
                    controls
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                  >
                    <source src={withBase(baseEntry.videoSrc)} type="video/mp4" />
                  </video>
                </div>
              </article>

              <article className="video-card">
                <div className="video-card-header">
                  <h3>{variantDisplayLabel(improvedEntry.variant)}</h3>
                </div>
                <div className="video-frame">
                  <video
                    key={improvedEntry.id}
                    ref={improvedVideoRef}
                    poster={withBase(improvedEntry.posterSrc)}
                    controls
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                  >
                    <source src={withBase(improvedEntry.videoSrc)} type="video/mp4" />
                  </video>
                </div>
              </article>
            </>
          ) : activeSingleEntry ? (
            <article className="video-card video-card-wide">
              <div className="video-card-header">
                <h3>{variantDisplayLabel(activeSingleEntry.variant)}</h3>
              </div>
              <div className="video-frame">
                <video
                  key={activeSingleEntry.id}
                  poster={withBase(activeSingleEntry.posterSrc)}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                >
                  <source src={withBase(activeSingleEntry.videoSrc)} type="video/mp4" />
                </video>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      <nav className="top-nav" aria-label="Main navigation">
        <a className="top-nav-brand" href="#abstract">
          Odysseus
        </a>
        <div className="top-nav-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <main>
        <section className="hero" id={sectionIds.abstract}>
          <div className="hero-row">
            <div className="hero-title-block">
              <h1>
                <span className="hero-title-label">Odysseus</span>
                : Scaling VLMs to 100+ Turn Decision-Making in Games via RL
              </h1>
            </div>

            <div className="hero-copy">
              <div className="meta-block">
                <p className="meta-line meta-line-authors">
                  {authors.map((author, index) => {
                    const shouldBreakAfter = index === 2 || index === authors.length - 4;

                    return (
                      <span key={author.name}>
                        <strong>{author.name}</strong>
                        <sup>
                          {author.affiliations.join(",")}
                          {"equalContribution" in author && author.equalContribution ? ",*" : ""}
                        </sup>
                        {index < authors.length - 1 ? ", " : ""}
                        {shouldBreakAfter ? <br /> : null}
                      </span>
                    );
                  })}
                </p>
                <p className="meta-line meta-line-note">
                  <sup>*</sup> Equal contribution in random order
                </p>
                <p className="meta-line meta-line-muted">
                  {affiliations.map((affiliation, index) => (
                    <span key={affiliation.id}>
                      <sup>{affiliation.id}</sup> {affiliation.label}
                      {index < affiliations.length - 1 ? " · " : ""}
                    </span>
                  ))}
                </p>
              </div>

              <p className="hero-tldr">
                <strong>TL;DR:</strong> Odysseus is an RL training framework that turns
                VLMs into much stronger long-horizon (100+ turn) decision-making agents in games, achieving
                large performance gains in Super Mario Land.
              </p>

              <figure className="abstract-teaser">
                <div className="overview-figure-row">
                  <img
                    className="overview-figure-main"
                    src={withBase("assets/figures/teaser.png")}
                    alt="Overview of the Odysseus training recipe for scaling VLMs to long-horizon gameplay"
                  />
                  <img
                    className="overview-figure-side"
                    src={withBase("assets/figures/model_score_histogram.png")}
                    alt="Model performance comparison averaged over the first five Super Mario Land levels"
                  />
                </div>
              </figure>

              <div className="cta-row">
                {projectLinks.map((link) => (
                  <a
                    key={link.label}
                    className={`cta-button ${link.state === "coming-soon" ? "is-muted" : ""}`}
                    href={link.href ?? "#cite"}
                    aria-disabled={link.state === "coming-soon"}
                  >
                    {link.label}
                    {link.state === "coming-soon" ? " · Coming Soon" : ""}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {demoExplorerSection}

        <section className="section-block abstract-section">
          <div className="section-heading">
            <h2>Overview</h2>
            <div className="overview-points" role="list" aria-label="Overview highlights">
              <p className="overview-point" role="listitem">
                <strong>Challenge:</strong> Existing VLM-RL methods are mostly tested on short
                20-30 turn tasks. Odysseus studies a harder regime: visually grounded
                <em> Super Mario Land</em> gameplay that often requires <strong>100+ turns</strong> of
                coordinated perception, reasoning, and action.
              </p>
              <p className="overview-point" role="listitem">
                <strong>Approach:</strong> The framework combines lightweight supervised
                initialization with multi-task RL, using an adapted PPO algorithm (a small
                turn-level CNN critic + positive-advantage filtering) and an auto-curriculum to make long-horizon VLM
                training more stable and sample-efficient.
              </p>
              <p className="overview-point" role="listitem">
                <strong>Insight:</strong>
              </p>
              <ul className="overview-subpoints" aria-label="Insight details">
                <li>
                  Odysseus demonstrates that with the right framework, VLM-RL can be made stable and effective for
                  long-horizon settings.
                </li>
                <li>
                  Pretrained VLMs provide useful action priors that classical RL agents trained
                  from scratch do not have, reducing the need for hand-engineered action spaces
                  and improving sample efficiency.
                </li>
              </ul>
              <p className="overview-point" role="listitem">
                <strong>Result:</strong> Odysseus achieves large gains over the base
                Qwen3-VL-8B-Instruct model and strong frontier VLMs, with at least 3x average
                game-progress improvement over frontier baselines, while retaining general
                multimodal capabilities and improving in-game and cross-game generalization.
              </p>
            </div>
          </div>

        </section>

        <section className="section-block protocol-section">
          <h2>Interaction Protocol</h2>
          <div className="protocol-layout">
            <figure className="abstract-teaser protocol-figure">
              <img
                src={withBase("assets/figures/protocol_large.pdf.png")}
                alt="Interaction protocol between the VLM agent and Super Mario Land"
                loading="lazy"
              />
            </figure>

            <div className="overview-points" role="list" aria-label="Interaction protocol">
              <div className="overview-point" role="listitem">
                <strong>Observation:</strong> At each turn, the VLM receives the current game
                frame together with textual instructions describing the game objective, available
                buttons, action-space constraints, and required output format.
              </div>
              <div className="overview-point" role="listitem">
                <strong>Structured reasoning:</strong> The model responds with XML-style
                <code> &lt;perception&gt;</code>, <code>&lt;reasoning&gt;</code>, and{" "}
                <code>&lt;answer&gt;</code> fields, first grounding the scene, then explaining
                the strategy, and finally selecting the action.
              </div>
              <div className="overview-point" role="listitem">
                <strong>Action execution:</strong> The final answer is parsed as up to two
                simultaneous controller buttons from <code>a</code>, <code>b</code>,{" "}
                <code>up</code>, <code>down</code>, <code>left</code>, <code>right</code>, and{" "}
                <code>noop</code>.
              </div>
              <div className="overview-point" role="listitem">
                <strong>Closed-loop control:</strong> The selected action is applied for multiple
                emulator frames through frame skipping, then the next rendered frame is fed back to
                the VLM for the following turn.
              </div>
            </div>
          </div>
        </section>

        <section className="section-block algorithm-section">
          <h2>PPO: Turn-Level CNN Critic + Positive-Advantage Filtering</h2>
          <div className="algorithm-layout">
            <figure className="abstract-teaser algorithm-figure">
              <img
                src={withBase("assets/figures/ppo.pdf.png")}
                alt="Adapted PPO algorithm with a lightweight turn-level critic"
                loading="lazy"
              />
            </figure>

            <div className="algorithm-results-layout">
              <div className="overview-points" aria-label="Adapted PPO algorithm">
                <p className="overview-point">
                  Odysseus starts from the standard PPO recipe, using clipped policy updates to
                  optimize the VLM agent from environment rewards over long game trajectories.
                </p>
                <ul className="overview-subpoints" aria-label="PPO adaptations">
                  <li>
                    <strong>Turn-level CNN critic:</strong> Instead of training a large token-level
                    value model, Odysseus uses a lightweight CNN critic that estimates value at the
                    game-turn level from visual observations.
                  </li>
                  <li>
                    <strong>Positive-Advantage Filtering:</strong> Odysseus keeps updates that
                    improve over the critic’s estimate (i.e., with a positive advantage), reducing
                    noisy or destabilizing gradients in the long-horizon setting.
                  </li>
                </ul>
                <p className="overview-point">
                  In experiments, these two adaptations make VLM-RL substantially more stable and
                  sample-efficient than critic-free baselines such as GRPO and Reinforce++, while
                  decoupling temporal credit assignment from token generation.
                </p>
              </div>

              <figure className="results-mini-figure algorithm-results-figure">
                <img
                  src={withBase("assets/figures/vlm_rl_compare.png")}
                  alt="Comparison of VLM-based RL methods"
                  loading="lazy"
                />
              </figure>
            </div>

            <details className="full-results-panel">
              <summary>Full training curves</summary>
              <div className="full-results-grid">
                {[
                  ["PPO + Positive Advantage", "vlm_delta_x_curves_ppo_pos_adv.png"],
                  ["PPO", "vlm_delta_x_curves_ppo.png"],
                  [
                    "GRPO Outcome + Positive Advantage",
                    "vlm_delta_x_curves_grpo_outcome_pos_adv.png",
                  ],
                  ["GRPO Outcome", "vlm_delta_x_curves_grpo_outcome.png"],
                  [
                    "GRPO Process + Positive Advantage",
                    "vlm_delta_x_curves_grpo_process_pos_adv.png",
                  ],
                  ["GRPO Process", "vlm_delta_x_curves_grpo_process.png"],
                  ["Reinforce++", "vlm_delta_x_curves_reinforce.png"],
                ].map(([label, filename]) => (
                  <figure className="results-mini-figure" key={filename}>
                    <img
                      src={withBase(`assets/figures/vlm_delta_x_curves_per_method/${filename}`)}
                      alt={`${label} per-method training curves`}
                      loading="lazy"
                    />
                    <figcaption>{label}</figcaption>
                  </figure>
                ))}
              </div>
            </details>
          </div>
        </section>

        <section className="section-block classical-rl-section">
          <h2>VLM-Based RL Training versus Classical Deep RL</h2>
          <div className="classical-rl-layout">
            <div className="overview-points" role="list" aria-label="VLM-based RL versus classical deep RL">
              <p className="overview-point" role="listitem">
                <strong>Key message:</strong> Classical deep RL must learn perception and control from
                scratch, making exploration difficult in long-horizon gameplay. In contrast,
                VLM-based RL starts from pretrained visual-language knowledge, giving the agent
                useful priors about objects, spatial relations, and actions.
              </p>
              <p className="overview-point" role="listitem">
                <strong>Takeaway:</strong> These priors make VLM-based RL more sample-efficient and
                less dependent on manually engineered action spaces, while classical deep RL remains
                much more sensitive to the action-space design.
              </p>
            </div>

            <figure className="results-mini-figure classical-rl-figure">
              <img
                src={withBase("assets/figures/classical_rl_compare.png")}
                alt="Comparison of VLM-based RL and classical deep RL"
                loading="lazy"
              />
            </figure>
          </div>

          <details className="full-results-panel">
            <summary>Full training curves</summary>
            <div className="full-results-grid classical-full-results-grid">
              {[
                [
                  "(a) VLM-based RL (i.e., PPO with a turn-level CNN critic and positive advantage filtering).",
                  "classical_rl_delta_x_curves_vlm_based_rl.png",
                ],
                [
                  "(b) Classical RL (i.e., PPO training a CNN policy from scratch) using the engineered action space.",
                  "classical_rl_delta_x_curves_classical_rl_engineered_action.png",
                ],
                [
                  "(c) Classical RL (i.e., PPO training a CNN policy from scratch) using the original action space.",
                  "classical_rl_delta_x_curves_classical_rl_original_action.png",
                ],
              ].map(([label, filename]) => (
                <figure className="results-mini-figure" key={filename}>
                  <img
                    src={withBase(`assets/figures/classical_rl_delta_x_curves_per_method/${filename}`)}
                    alt={`${label} per-method training curves`}
                    loading="lazy"
                  />
                  <figcaption>{label}</figcaption>
                </figure>
              ))}
            </div>
          </details>
        </section>

        <section className="section-block method-section" id={sectionIds.method}>
          <div className="section-heading">
            <h2>The Odysseus Framework</h2>
            <div className="method-framework-layout">
              <div className="method-subsections">
                <section className="method-subsection">
                  <h3>Lightweight SFT Initialization</h3>
                  <p className="overview-point">
                    Odysseus first improves the base VLM’s game-specific perception and domain
                    knowledge using sampled gameplay frames and teacher-generated{" "}
                    <code>&lt;perception&gt;</code>, <code>&lt;reasoning&gt;</code>, and{" "}
                    <code>&lt;answer&gt;</code> responses. The sampled frames come from walkthrough
                    videos rather than expensive action-labeled expert trajectories, making the
                    stage lightweight and easier to scale. Its goal is not to solve control by
                    imitation; it teaches game knowledge and visual grounding so RL starts from a
                    better initial policy.
                  </p>
                </section>

                <section className="method-subsection">
                  <h3>Multi-task RL with Auto-curriculum</h3>
                  <p className="overview-point">
                    The framework then applies the adapted PPO recipe across multiple levels
                    simultaneously, optimizing action selection from environment rewards. An
                    auto-curriculum tracks average trajectory length for each level and samples
                    future batches with inverse-trajectory weighting, so shorter or less-explored
                    levels get more training attention. This prevents easy levels from dominating
                    the batch, balances learning across tasks, and improves stability.
                  </p>
                </section>
              </div>

              <figure className="abstract-teaser method-inline-figure">
                <img
                  src={withBase("assets/figures/auto_curriculum.pdf.png")}
                  alt="Multi-task auto-curriculum for Odysseus training"
                  loading="lazy"
                />
              </figure>
            </div>
          </div>
        </section>

        <section className="section-block" id={sectionIds.results}>
          <div className="section-heading">
            <h2>Experimental Results</h2>
            <p>
              The main training setting uses Qwen3-VL-8B-Instruct as the base model and trains
              Odysseus on five <em>Super Mario Land</em> levels:
              World 1 Level 1, World 1 Level 2, World 1 Level 3, World 2 Level 1, and World 2 Level 2. Performance is measured
              by game progress over long-horizon rollouts.
            </p>
          </div>

          <div className="results-stack">
            <section className="results-panel">
              <div className="results-panel-copy">
                <h3>Superior Training Performances</h3>
                <p>
                  On the five RL training levels, Odysseus substantially improves over the base
                  model and outperforms strong frontier VLMs. SFT alone (i.e., Odysseus-SFT) does not raise final
                  performance, but it becomes a useful initialization that makes RL stronger, compared to direct RL training from the base model (i.e., Odysseus-Zero).
                </p>
              </div>
              <ResultsTable
                columns={trainingPerformanceColumns}
                rows={trainingPerformanceRows}
                highlightRow="Odysseus"
              />
            </section>

            <section className="results-panel">
              <div className="results-panel-copy">
                <h3>Generalizations in Games</h3>
                <p>
                  Beyond the five RL training levels, the paper tests whether the learned policy
                  still makes good decisions under progressively larger distribution shifts:
                </p>
                <ul className="overview-subpoints">
                  <li>
                    <strong>In-game off-policy states:</strong> 50 manually curated states from
                    the five training levels of <em>Super Mario Land</em>, with 10 states per
                    level sampled independently from the agent’s own rollouts.
                  </li>
                  <li>
                    <strong>In-game unseen states:</strong> 50 manually collected states from the
                    five held-out <em>Super Mario Land</em> levels, testing new levels with the
                    same game mechanics and visual structure.
                  </li>
                  <li>
                    <strong>Cross-game transfer:</strong> evaluations from the start of all 32
                    levels in <em>Super Mario Bros.</em>, testing a larger domain shift in level
                    design and visual appearance.
                  </li>
                </ul>
              </div>
              <div className="results-generalization-grid">
                <figure className="results-mini-figure">
                  <img
                    src={withBase("assets/figures/super_mario_bros_and_land_grouped_improvement_land_w1_w2.pdf.png")}
                    alt="In-game off-policy generalization results"
                    loading="lazy"
                  />
                  <figcaption>In-game off-policy states from the five training levels.</figcaption>
                </figure>
                <figure className="results-mini-figure">
                  <img
                    src={withBase("assets/figures/super_mario_bros_and_land_grouped_improvement_land_w3_w4.pdf.png")}
                    alt="In-game unseen-state generalization results"
                    loading="lazy"
                  />
                  <figcaption>In-game unseen states from held-out Mario levels.</figcaption>
                </figure>
                <figure className="results-mini-figure results-wide-figure">
                  <img
                    src={withBase("assets/figures/super_mario_bros_and_land_grouped_improvement_bros.pdf.png")}
                    alt="Cross-game generalization results on Super Mario Bros"
                    loading="lazy"
                  />
                  <figcaption>Cross-game transfer across all 32 Super Mario Bros. levels.</figcaption>
                </figure>
              </div>
            </section>

            <section className="results-panel">
              <div className="results-panel-copy">
                <h3>Performances in General Domains</h3>
                <p>
                  Even after extensive RL in the game environment, the Odysseus models retain the
                  base model’s general-purpose multimodal strengths on STEM and real-world reasoning
                  benchmarks.
                </p>
              </div>
              <ResultsTable
                columns={generalBenchmarkColumns}
                rows={generalBenchmarkRows}
                highlightRow="Odysseus"
              />
            </section>
          </div>
        </section>

        <section className="section-block citation-section" id={sectionIds.citation}>
          <div className="section-heading">
            <h2>Citation and Contact</h2>
          </div>
          <details className="full-results-panel citation-panel" open>
            <summary>BibTeX</summary>
            <pre>{citation}</pre>
          </details>
          <details className="full-results-panel contact-panel">
            <summary>Contacts</summary>
            <div className="contact-copy">
              <ul>
                <li>
                  <strong>Chengshuai Shi:</strong>{" "}
                  <a href="mailto:cs1083@princeton.edu">cs1083@princeton.edu</a>
                </li>
                <li>
                  <strong>Wenzhe Li:</strong>{" "}
                  <a href="mailto:wenzhe.li@princeton.edu">wenzhe.li@princeton.edu</a>
                </li>
                <li>
                  <strong>Xinran Liang:</strong>{" "}
                  <a href="mailto:xinranliang@princeton.edu">xinranliang@princeton.edu</a>
                </li>
                <li>
                  <strong>Chi Jin:</strong>{" "}
                  <a href="mailto:chij@princeton.edu">chij@princeton.edu</a>
                </li>
              </ul>
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}
