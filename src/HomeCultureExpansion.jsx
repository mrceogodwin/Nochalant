import React from "react";

const discoveryCategories = ["Trending","Afrobeats","Nollywood","Celebrity","BBNaija","Gossip","Hip-Hop","Street Culture","Fashion","Lifestyle","Comedy","Sports","Events","Podcasts","Technology","Viral Videos","Relationships","Influencers","Business","Politics"];
const sectionStory = (stories, terms, fallbackIndex=0) => stories.find(story => terms.some(term => (story.category||"").toLowerCase().includes(term))) || stories[fallbackIndex];
const StoryTile = ({story,onOpen,rank}) => story ? <button type="button" className="flagship-story" onClick={()=>onOpen?.(story)}><img src={story.image || ""} alt="" loading="lazy"/><span className="flagship-story-category">{story.category || "CULTURE"}</span><b>{story.title}</b><small>{story.read || "3 min read"} · {story.time || "Latest"}</small></button> : null;


export function HomeCultureDiscovery({onChooseCategory}) {
  return <section className="culture-pulse container" aria-label="Culture discovery">
    <div className="pulse-heading"><div><span className="eyebrow">YOUR CULTURE, YOUR WAY</span><h2>Find your <em>corner.</em></h2></div><span className="pulse-live">NOCHALANT DISCOVER</span></div>
    <div className="pulse-grid">{discoveryCategories.map((name,i)=><button type="button" key={name} className="pulse-chip" onClick={()=>onChooseCategory?.(name)}>{name}<span>{i===0?"":"›"}</span></button>)}</div>
  </section>;
}

export default function HomeCultureExpansion({stories=[],artists=[],onOpenStory,onChooseCategory}) {
  const published = stories.filter(s=>s && s.title && s.image);
  const trending = published.slice(0,5);
  const celebrity = published.filter(s=>/celebrity|nollywood|bbnaija|entertainment|artist/i.test((s.category||"")+" "+(s.title||""))).slice(0,5);
  const culture = published.filter(s=>/music|afrobeats|hip.?hop|street|fashion|lifestyle/i.test((s.category||"")+" "+(s.title||""))).slice(0,5);
  const buzz = published.slice(0,4);
  const tracks = artists.flatMap(a=>(a.tracks||[]).map(t=>({...t,artist_name:t.artist_name||a.name}))).slice(0,5);
  return <div className="home-culture-expansion">
    <section className="flagship-section container" aria-labelledby="trending-now-title">
      <div className="flagship-heading"><div><span className="eyebrow">THE STORIES MOVING RIGHT NOW</span><h2 id="trending-now-title">Naija Trending <em>Now.</em></h2><p>Freshly published stories from the Nochalant desk.</p></div><span className="flagship-kicker">01 / THE DAILY PULSE</span></div>
      <div className="flagship-grid">{trending.length ? trending.map((s,i)=><StoryTile key={s.id||s.slug||i} story={s} rank={i+1} onOpen={onOpenStory}/>) : <div className="flagship-empty">No published trending stories yet. Approved editorial stories will appear here automatically.</div>}</div>
    </section>

    <section className="flagship-section container" aria-labelledby="social-wire-title">
      <div className="flagship-heading"><div><span className="eyebrow">CONVERSATIONS ACROSS THE CULTURE</span><h2 id="social-wire-title">The Social <em>Wire.</em></h2><p>A home for notable public conversations and creator posts.</p></div><span className="flagship-kicker">02 / SOCIAL PULSE</span></div>
      <div className="wire-grid"><article className="wire-card"><span className="wire-label">X / PUBLIC POSTS</span><p>Verified public posts will appear here when an approved social provider or official embed is connected.</p><div><b>Source-led conversations</b><small>No fabricated tweets or engagement counts</small></div></article><article className="wire-card"><span className="wire-label">INSTAGRAM</span><p>Featured creator posts and public media embeds, subject to platform permissions.</p><div><b>Creator spotlight</b><small>Official embeds only</small></div></article><article className="wire-card"><span className="wire-label">TIKTOK</span><p>Culture clips and viral moments from verified public links and permitted embeds.</p><div><b>Video conversation</b><small>Attribution stays visible</small></div></article></div>
      <p className="flagship-note">Social provider connections are not configured yet, so this section does not pretend to show a live feed.</p>
    </section>

    <section className="flagship-section container" aria-labelledby="celebrity-radar-title">
      <div className="flagship-heading"><div><span className="eyebrow">PEOPLE TO KEEP ON YOUR RADAR</span><h2 id="celebrity-radar-title">Celebrity <em>Radar.</em></h2><p>Entertainment updates drawn from published Nochalant coverage.</p></div><span className="flagship-kicker">03 / THE SPOTLIGHT</span></div>
      <div className="radar-grid">{celebrity.length ? celebrity.map((s,i)=><button type="button" className="radar-card" key={s.id||s.slug||i} onClick={()=>onOpenStory?.(s)}><img src={s.image} alt="" loading="lazy"/><b>{s.title}</b><small>{s.category}</small></button>) : <div className="flagship-empty">Celebrity and entertainment coverage will appear here after publication. No unverified celebrity updates are shown.</div>}</div>
    </section>

    <section className="flagship-section container" aria-labelledby="culture-charts-title">
      <div className="flagship-heading"><div><span className="eyebrow">WHAT THE CULTURE IS PLAYING</span><h2 id="culture-charts-title">The Culture <em>Charts.</em></h2><p>Published stories and released music, with no invented rankings.</p></div><span className="flagship-kicker">04 / SOUND & CULTURE</span></div>
      <div className="charts-list">{tracks.length ? tracks.map((t,i)=><div className="chart-row" key={t.id}><strong>{i+1}</strong>{t.cover_art_url?<img src={t.cover_art_url} alt="" loading="lazy"/>:<span className="chart-art">♫</span>}<span className="chart-track"><b>{t.title}</b><small>{t.artist_name}</small></span><small className="chart-plays">{Number(t.plays_count||0).toLocaleString()} eligible plays</small></div>) : culture.length ? culture.map((s,i)=><div className="chart-row" key={s.id||s.slug||i}><strong>—</strong><img src={s.image} alt="" loading="lazy"/><span className="chart-track"><b>{s.title}</b><small>{s.category}</small></span><small className="chart-plays">Published</small></div>) : <div className="flagship-empty">The charts will populate from eligible artist releases and published culture coverage. Rankings only appear when real data is available.</div>}</div>
    </section>

    <section className="flagship-section container" aria-labelledby="buzzboard-title">
      <div className="flagship-heading"><div><span className="eyebrow">THE CULTURE HAS THE FLOOR</span><h2 id="buzzboard-title">The <em>Buzzboard.</em></h2><p>Stories worth debating, with community participation coming through the live discussion tools.</p></div><span className="flagship-kicker">05 / FAN VOICE</span></div>
      <div className="buzzboard-grid">{buzz.length ? buzz.map((s,i)=><button type="button" className="buzz-card" key={s.id||s.slug||i} onClick={()=>onOpenStory?.(s)}><span>{s.category || "THE CONVERSATION"}</span><b>{s.title}</b></button>) : <div className="flagship-empty">Community debates will be featured here as published stories and approved discussion prompts become available.</div>}</div>
    </section>
  </div>;
}
