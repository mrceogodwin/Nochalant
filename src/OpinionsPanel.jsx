import React, { useEffect, useState } from "react";
import { authClient } from "./auth.js";

const topics = ["Music","Entertainment","Fashion","Lifestyle","Nightlife","Sports","Culture","Other"];
const reportReasons = ["Harassment or bullying","Hate or discrimination","Sexual content","Violence or threats","Spam or scam","False or harmful information","Other"];

async function getToken() {
  if (!authClient) throw new Error("Authentication is not configured.");
  const result = await authClient.token();
  if (result?.error) throw new Error(result.error.message || "Please sign in again.");
  if (!result?.data?.token) throw new Error("Please sign in again to continue.");
  return result.data.token;
}

export default function OpinionsPanel({ open, onClose, mode = "dashboard", opinion = null, onNotice = () => {} }) {
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("Culture");
  const [items, setItems] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [reason, setReason] = useState("Other");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeMode, setActiveMode] = useState(mode);

  useEffect(() => { setActiveMode(mode); setError(""); }, [mode, opinion?.id, open]);

  const request = async (url, options = {}) => {
    const token = await getToken();
    const response = await fetch(url, { ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "The request could not be completed.");
    return data;
  };

  const loadMine = async () => {
    const data = await request("/api/opinions/mine");
    setItems(data.opinions || []);
  };
  const loadAdmin = async () => {
    const data = await request("/api/admin/opinions");
    setItems(data.opinions || []);
    setReports(data.reports || []);
    setUsers(data.users || []);
  };

  useEffect(() => {
    if (!open) return;
    setBusy(true); setError("");
    const loader = activeMode === "admin" ? loadAdmin() : activeMode === "report" ? Promise.resolve() : loadMine();
    Promise.resolve(loader).catch(e => setError(e.message || "Could not load Opinions.")).finally(() => setBusy(false));
  }, [open, activeMode, opinion?.id]);

  const submit = async event => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (activeMode === "report") {
        if (!opinion?.id) throw new Error("Select an opinion to report.");
        await request(`/api/opinions/${encodeURIComponent(opinion.id)}/report`, { method: "POST", body: JSON.stringify({ reason, details }) });
        setDetails(""); onNotice("Report sent to the moderation team."); onClose();
      } else {
        await request("/api/opinions", { method: "POST", body: JSON.stringify({ body: body.trim(), topic }) });
        setBody(""); await loadMine(); onNotice("Opinion submitted for moderation.");
      }
    } catch (e) { setError(e.message || "Please try again."); }
    finally { setBusy(false); }
  };

  const moderate = async (action, values) => {
    setBusy(true); setError("");
    try { await request("/api/admin/opinions", { method: "POST", body: JSON.stringify({ action, ...values }) }); await loadAdmin(); onNotice("Moderation action saved."); }
    catch (e) { setError(e.message || "Moderation action failed."); }
    finally { setBusy(false); }
  };

  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal-card opinions-panel" role="dialog" aria-modal="true" aria-labelledby="opinions-panel-title">
      <button className="modal-close" onClick={onClose} aria-label="Close Opinions">×</button>
      <span className="eyebrow">NOCHALANT · THE PEOPLE HAVE A SAY</span>
      <h2 id="opinions-panel-title">{activeMode === "report" ? "Report an opinion" : activeMode === "admin" ? "Super Admin moderation" : "Your opinions"}</h2>
      {activeMode === "dashboard" && <div className="opinion-panel-tabs"><button onClick={() => setActiveMode("dashboard")} className="active">My opinions</button><button onClick={() => { setActiveMode("admin"); }}>Super Admin</button></div>}
      {activeMode === "dashboard" && <><p className="modal-intro">Share your take with the community. Submissions are reviewed before publication.</p><form onSubmit={submit} className="opinion-compose"><label>Topic<select value={topic} onChange={e => setTopic(e.target.value)}>{topics.map(t => <option key={t}>{t}</option>)}</select></label><label>Your opinion<textarea value={body} onChange={e => setBody(e.target.value)} minLength={8} maxLength={500} rows={4} placeholder="What is your take? Keep it real and respectful…" required /></label><small className="fine-print">{body.length}/500 characters · Minimum 8</small><button className="button button-green full-width" disabled={busy || body.trim().length < 8}>{busy ? "Please wait…" : "Submit for review"}</button></form><div className="opinion-dashboard-list"><div className="opinion-list-heading"><h3>Your submissions</h3><button className="button button-outline" onClick={() => {setBusy(true);loadMine().catch(e => setError(e.message)).finally(() => setBusy(false));}}>Refresh</button></div>{items.length ? items.map(item => <article className="opinion-status-item" key={item.id}><span className="opinion-topic">{item.topic} · {item.status}</span><p>{item.body}</p>{item.moderation_note && <small>{item.moderation_note}</small>}</article>) : <p className="fine-print">No submissions yet. Your opinions will appear here.</p>}</div></>}
      {activeMode === "report" && <><p className="modal-intro">Report content that breaks community standards. Reports are private.</p><blockquote className="opinion-report-quote">{opinion?.body || "Selected opinion"}</blockquote><form onSubmit={submit}><label>Reason<select value={reason} onChange={e => setReason(e.target.value)}>{reportReasons.map(r => <option key={r}>{r}</option>)}</select></label><label>Details<textarea rows={3} maxLength={500} value={details} onChange={e => setDetails(e.target.value)} placeholder="Optional details (up to 500 characters)" /></label><button className="button button-green full-width" disabled={busy}>{busy ? "Sending…" : "Send report"}</button></form></>}
      {activeMode === "admin" && <><p className="modal-intro">Restricted moderation queue. Only database-authorized Super Admin accounts can use these actions.</p><div className="opinion-dashboard-list"><h3>Account enforcement ({users.length})</h3>{users.map(user => <article className="opinion-status-item" key={user.id}><span className="opinion-topic">{user.display_name} · {user.role} · {user.account_status}</span><p>{user.email || "No email available"}</p><div className="opinion-admin-actions">{user.account_status === "banned" ? <button disabled={busy} onClick={() => moderate("unban", { targetUserId: user.id })}>Unban</button> : <><button disabled={busy} onClick={() => moderate("suspend", { targetUserId: user.id, suspendedUntil: new Date(Date.now() + 24*60*60*1000).toISOString(), reason: "24-hour moderation suspension" })}>Suspend 24h</button><button disabled={busy} onClick={() => moderate("ban", { targetUserId: user.id, reason: "Account banned by Super Admin" })}>Ban</button></>}{user.account_status === "suspended" && <button disabled={busy} onClick={() => moderate("unsuspend", { targetUserId: user.id })}>Unsuspend</button>}</div></article>)}</div><div className="opinion-dashboard-list"><h3>Pending and hidden opinions ({items.length})</h3>{items.map(item => <article className="opinion-status-item" key={item.id}><span className="opinion-topic">{item.topic} · {item.status} · {item.author_name}</span><p>{item.body}</p><div className="opinion-admin-actions"><button disabled={busy} onClick={() => moderate("approve", { opinionId: item.id })}>Approve</button><button disabled={busy} onClick={() => moderate("reject", { opinionId: item.id })}>Reject</button><button disabled={busy} onClick={() => moderate(item.status === "hidden" ? "restore" : "hide", { opinionId: item.id })}>{item.status === "hidden" ? "Restore" : "Hide"}</button></div></article>)}</div><div className="opinion-dashboard-list"><h3>Open reports ({reports.length})</h3>{reports.map(item => <article className="opinion-status-item" key={item.id}><span className="opinion-topic">{item.reason} · {item.reporter_name}</span><p>{item.opinion_body}</p><small>{item.details}</small><div className="opinion-admin-actions"><button disabled={busy} onClick={() => moderate("resolve_report", { reportId: item.id })}>Resolve</button><button disabled={busy} onClick={() => moderate("dismiss_report", { reportId: item.id })}>Dismiss</button></div></article>)}</div><button className="button button-outline full-width" onClick={() => {setBusy(true);loadAdmin().catch(e => setError(e.message)).finally(() => setBusy(false));}}>Refresh queue</button></>}
      {error && <p className="opinion-panel-error" role="alert">{error}</p>}
    </section>
  </div>;
}