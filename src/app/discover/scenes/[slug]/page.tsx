import Link from "next/link";

const directory: Record<string,{name:string;category:string;members:string;description:string;rules:string[];tone:string}> = {
  "alte-society":{name:"Alté Society",category:"MUSIC & CULTURE",members:"23.4K members",description:"A home for alternative culture, independent music, fashion and creative expression. Share discoveries, meet collaborators and shape the next wave.",rules:["Respect every member and creative voice.","Credit artists and creators when sharing their work.","Keep conversations relevant and welcoming."],tone:"violet"},
  "afterhours":{name:"Afterhours",category:"NIGHTLIFE",members:"18.7K members",description:"For the people who know the city after dark. Discover nights out, share recommendations and connect around the Lagos scene.",rules:["Keep event information accurate.","Respect privacy and consent.","No harassment, unsafe meetups or doxxing."],tone:"pink"},
  "sound-district":{name:"Sound District",category:"MUSIC",members:"12.1K members",description:"A community for new music, underground drops, producers and artist conversations.",rules:["Give constructive feedback.","Only share music you have permission to post.","Support emerging artists."],tone:"silver"},
  "the-drip-room":{name:"The Drip Room",category:"FASHION",members:"16.9K members",description:"Outfits, sneakers, personal style and fashion battles. Bring your perspective and celebrate originality.",rules:["Critique the fit, never attack the person.","Credit photographers and designers.","Keep it inclusive."],tone:"orange"}
};

export default async function SceneDetail({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const scene=directory[slug];
  if(!scene) return <main className="feed-shell"><Link href="/discover" className="back-link">‹ Back to Discover</Link><h1>Scene not found</h1><p className="supporting">This preview Scene may have moved.</p></main>;
  return <main className="feed-shell">
    <header className="chat-header"><Link href="/discover">‹</Link><div><strong>Scene details</strong><small>Discover your community</small></div></header>
    <section className={"scene-detail-art "+scene.tone}><span>NOCHALANT SCENE</span><h1>{scene.name}</h1><small>{scene.category}</small></section>
    <div className="scene-detail-meta"><strong>{scene.members}</strong><span>Public Scene · Preview</span></div>
    <p className="scene-detail-description">{scene.description}</p>
    <div className="queue-heading"><h2>About this Scene</h2></div>
    <div className="scene-rules">{scene.rules.map((rule,i)=><p key={rule}><b>{i+1}</b>{rule}</p>)}</div>
    <div className="owner-notice"><strong>Preview community</strong><p>Membership and Scene discussions will become available when secure member accounts and database services are connected.</p></div>
    <Link href="/discover" className="yellow-cta link-cta">Back to Discover <span>→</span></Link>
  </main>;
}
