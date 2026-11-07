"use client";

import Link from "next/link";
import { useState } from "react";

const stories = [{name:"Afterhours",tone:"pink"},{name:"Alté Society",tone:"violet"},{name:"Sound District",tone:"silver"},{name:"The Drip",tone:"orange"}];
const tabs = ["For You","Following","Scenes","Music"];

export default function ClubHome() {
  const [tab,setTab] = useState("For You");
  const [liked,setLiked] = useState(false);
  return <main className="feed-shell">
    <header className="feed-header"><Link href="/" className="feed-brand">Nochalant<small>CLUB</small></Link><div className="feed-actions"><button aria-label="Search">⌕</button><button aria-label="Notifications">♧<i/></button></div></header>
    <section className="stories-row" aria-label="Club stories">
      <button className="story-item"><span className="story-avatar add-story">＋</span><small>Your Story</small></button>
      {stories.map(s=><button className="story-item" key={s.name}><span className={"story-avatar "+s.tone}><b>{s.name.slice(0,1)}</b></span><small>{s.name}</small></button>)}
    </section>
    <nav className="feed-tabs">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?"selected":""}>{t}</button>)}</nav>
    <article className="post-card">
      <header className="post-author"><span className="author-avatar">♛</span><div><strong>Afterhours <b className="verified">✓</b></strong><small>2h ago · Lagos</small></div><button className="more-button" aria-label="More options">•••</button></header>
      <p className="post-copy">Best club in Lagos right now? 👀</p>
      <div className="post-art"><span>LAGOS</span><strong>AFTERHOURS</strong><small>THE CITY NEVER SLEEPS</small></div>
      <footer className="post-actions"><button onClick={()=>setLiked(!liked)} className={liked?"liked":""}>♡ <span>{liked?429:428}</span></button><button>▢ <span>96</span></button><button>↗</button><button className="save-post">♧</button></footer>
    </article>
    <article className="post-card compact-post"><header className="post-author"><span className="author-avatar alt">A</span><div><strong>Alté Society <b className="verified">✓</b></strong><small>4h ago · Scene update</small></div><button className="more-button">•••</button></header><p className="post-copy">The weekend is calling. Who’s outside? ✨</p><div className="event-strip"><span>THIS WEEKEND</span><strong>Find your next scene.</strong><Link href="/discover">Explore scenes →</Link></div><footer className="post-actions"><button>♡ <span>214</span></button><button>▢ <span>31</span></button><button>↗</button><button className="save-post">♧</button></footer></article>
    <nav className="bottom-nav"><Link className="active" href="/club"><span>⌂</span>Home</Link><Link href="/discover"><span>◉</span>Discover</Link><Link className="create-button" href="/club/create"><span>＋</span></Link><Link href="/chats"><span>▢</span>Chats</Link><Link href="/my-club"><span>♙</span>My Club</Link></nav>
  </main>;
}
