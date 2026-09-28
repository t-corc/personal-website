let scoredRows = [];

const el = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const label = value => String(value || "").split("_").join(" ").toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());

function safeUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "#"; }
  catch (_) { return "#"; }
}

function items(value, fallback) {
  const values = String(value || "").split(";").map(x => x.trim()).filter(Boolean);
  return (values.length ? values : [fallback]).map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function breakdown(row) {
  return String(row.criteria_breakdown || "").split(";").map(item => {
    const match = item.trim().match(/^([^:]+):([\d.]+)\/([\d.]+)$/);
    if (!match) return "";
    const percent = Math.min(100, Number(match[2]) / Number(match[3]) * 100);
    return `<div class="criterion"><span>${escapeHtml(label(match[1]))}</span><div><i style="width:${percent}%"></i></div><b>${match[2]}/${match[3]}</b></div>`;
  }).join("");
}

function roleCard(row, rank) {
  const description = String(row.description || "").trim();
  return `<article class="role-card">
    <div class="rank">#${rank}</div>
    <div class="role-main">
      <div class="role-heading"><div><h3>${escapeHtml(row.title)}</h3><p>${escapeHtml(row.company)}</p></div><div class="score"><small>PRIORITY</small>${escapeHtml(row.score)}<small>/100</small></div></div>
      <div class="badges"><span class="decision ${escapeHtml((row.decision || "").toLowerCase())}">${escapeHtml(label(row.decision))}</span><span>📍 ${escapeHtml(row.location || "Location unavailable")}</span><span>${escapeHtml(row.location_category || "Location not classified")}</span><span>${escapeHtml(row.workplace || "Workplace not stated")}</span></div>
      <p class="description${description ? "" : " muted"}">${description ? `${escapeHtml(description.slice(0, 420))}${description.length > 420 ? "…" : ""}` : "No description supplied by this job feed."}</p>
      <div class="compensation"><strong>Compensation</strong><span>Base: ${escapeHtml(row.compensation_base || "Unknown – research required")}</span><span>Variable/OTE: ${escapeHtml(row.compensation_variable_ote || "Unknown")}</span><span>Equity: ${escapeHtml(row.compensation_equity || "Unknown")}</span><small>${escapeHtml(row.compensation_source || "No source")} · ${escapeHtml(row.compensation_confidence || "Low")} confidence</small></div>
      <details><summary>Fit evidence, gaps and ranking</summary><div class="ranking-detail"><div><h4>Why it suits me</h4><ul>${items(row.cv_evidence, "No verified CV evidence matched")}</ul><h4>Material gaps</h4><ul class="gaps">${items(row.material_gaps || row.hard_requirements, "No material gap identified from the supplied posting")}</ul><h4>Next action</h4><p>${escapeHtml(row.recommended_action || "Research before applying")}</p></div><div class="criteria">${breakdown(row)}</div></div></details>
    </div>
    <aside class="role-side"><div><label>Role fit</label><strong>${escapeHtml(row.fit_score)}/100</strong></div><div><label>Candidacy credibility</label><strong>${escapeHtml(row.candidacy_credibility)}/100</strong></div><div><label>Attractiveness</label><strong>${escapeHtml(row.opportunity_attractiveness)}/100</strong></div><div><label>Evidence confidence</label><strong>${escapeHtml(row.evidence_confidence)}/100</strong></div><a class="apply-link" href="${safeUrl(row.url)}" target="_blank" rel="noopener">View role / apply ↗</a></aside>
  </article>`;
}

function render() {
  const query = el("score-search").value.trim().toLowerCase();
  const location = el("score-location").value;
  const decision = el("score-decision").value;
  const sort = el("score-sort").value;
  let rows = scoredRows.filter(row => {
    const haystack = `${row.title} ${row.company}`.toLowerCase();
    const locationMatch = location === "all" || String(row.location || "").toLowerCase().includes(location);
    const decisionMatch = decision === "all" || (decision === "actionable" ? ["STRONG_APPLY", "RESEARCH_MORE"].includes(row.decision) : row.decision === decision);
    return (!query || haystack.includes(query)) && locationMatch && decisionMatch;
  });
  if (sort === "stretch") rows = rows.filter(row => Number(row.opportunity_attractiveness || 0) >= 55 && Number(row.candidacy_credibility || 0) < 60);
  const field = sort === "achievable" ? "candidacy_credibility" : sort === "stretch" ? "opportunity_attractiveness" : "score";
  rows.sort((a, b) => sort === "newest" ? String(b.date_found).localeCompare(String(a.date_found)) : sort === "upside" ? Number(b.criteria_raw_scores?.match(/compensation:(\d+)/)?.[1] || 0) - Number(a.criteria_raw_scores?.match(/compensation:(\d+)/)?.[1] || 0) : Number(b[field] || 0) - Number(a[field] || 0));
  const visible = rows.slice(0, 40);
  el("scores-count").textContent = `${visible.length} shown · ${rows.length} matching`;
  el("scores-cards").innerHTML = visible.length ? visible.map((row, index) => roleCard(row, index + 1)).join("") : `<div class="empty">No roles match this view.</div>`;
}

async function start() {
  try {
    const [rowsResponse, metaResponse] = await Promise.all([fetch("./data/scored.json"), fetch("./data/meta.json")]);
    if (!rowsResponse.ok || !metaResponse.ok) throw new Error("Published data is unavailable");
    scoredRows = await rowsResponse.json();
    const meta = await metaResponse.json();
    el("update-note").textContent = `${meta.total_roles} roles scanned · updated ${meta.updated_at} · Madrid and Barcelona`;
    render();
  } catch (error) {
    el("scores-count").textContent = "Unavailable";
    el("scores-cards").innerHTML = `<div class="empty">Unable to load the published shortlist. Please try again later.</div>`;
  }
}

["score-search", "score-location", "score-decision", "score-sort"].forEach(id => el(id).addEventListener("input", render));
start();
