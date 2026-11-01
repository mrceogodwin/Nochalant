import React, { useEffect, useState } from "react";
import { getAuthToken } from "./auth.js";

export default function SocialSettingsAdmin() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = async (method = "GET", value) => {
    const token = await getAuthToken();
    if (!token) throw new Error("Administrator session expired. Sign in again.");
    const response = await fetch("/api/social/settings", {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
      ...(method === "POST" ? { body: JSON.stringify({ videoPostsEnabled: value }) } : {}),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Social settings could not be loaded.");
    return data;
  };

  const load = async () => {
    setBusy(true); setError(""); setNotice("");
    try { const data = await request(); setEnabled(data.videoPostsEnabled === true); setReady(true); }
    catch (err) { setReady(false); setError(err.message || "Social settings are unavailable."); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async next => {
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await request("POST", next);
      setEnabled(data.videoPostsEnabled === true);
      setReady(true);
      setNotice(next ? "Video posting has been enabled at the backend." : "Video posting has been disabled at the backend.");
    } catch (err) { setError(err.message || "The setting could not be saved."); }
    finally { setBusy(false); }
  };

  return <section className="promotion-admin-panel social-settings-admin">
    <div className="artists-heading"><div><span className="eyebrow">SOCIAL · FEATURE CONTROLS</span><h2>Social <em>permissions.</em></h2><p>Video posting is off by default. Only the Super Admin can change this backend setting.</p></div><button className="button button-outline" type="button" onClick={load} disabled={busy}>Refresh</button></div>
    <div className="social-video-setting-row">
      <div><strong>Member video posting</strong><p>{ready ? (enabled ? "Enabled in backend. Posting UI remains subject to the video upload and moderation pipeline." : "Disabled. Members cannot publish videos.") : "Waiting for the Social settings database migration."}</p></div>
      <button type="button" className={enabled && ready ? "button button-green" : "button button-outline"} disabled={busy || !ready} onClick={() => save(!enabled)}>{busy ? "Saving…" : enabled ? "Turn off" : "Turn on"}</button>
    </div>
    {error && <p className="promotion-message" role="alert">{error}</p>}
    {notice && <p className="promotion-message" role="status">{notice}</p>}
    <small className="fine-print">This switch controls the server-side feature flag. Enabling it does not publish a video composer until the upload, scanning, storage and moderation workflow is deployed.</small>
  </section>;
}
