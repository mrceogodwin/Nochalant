import Link from "next/link";
const items=[
 {icon:"♡",title:"Afterhours liked your post",detail:"“Best club in Lagos right now?”",time:"12 min ago",unread:true},
 {icon:"▢",title:"Mira commented on a post",detail:"“The new spot in VI is a vibe.”",time:"1 hour ago",unread:true},
 {icon:"✦",title:"Alté Society posted a Scene update",detail:"The weekend is calling. Who’s outside?",time:"4 hours ago",unread:false},
 {icon:"♫",title:"Sound District added a new discussion",detail:"What sound deserves more attention?",time:"Yesterday",unread:false}
];
export default function NotificationsPage(){return <main className="feed-shell"><header className="chat-header"><Link href="/club">‹</Link><div><strong>Notifications</strong><small>What’s happening around your Club</small></div></header><div className="queue-heading"><h2>Recent activity</h2><span className="selection-hint">Preview</span></div><div className="notification-list">{items.map((item,i)=><article className={item.unread?"notification-item unread":"notification-item"} key={i}><span className="notification-icon">{item.icon}</span><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.time}</small></div>{item.unread&&<i/>}</article>)}</div><div className="owner-notice"><strong>Illustrative notifications</strong><p>These are sample activity items. Live notifications require a signed-in account and notification delivery service.</p></div><Link href="/club" className="yellow-cta link-cta">Back to the feed <span>→</span></Link></main>}
