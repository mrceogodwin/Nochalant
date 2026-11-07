import Link from "next/link";

const plans = [
  { name: "Open Club", price: "Free", detail: "Find your people and explore public Scenes.", features: ["Create your Club identity", "Join public Scenes", "Follow creators and artists"] },
  { name: "Inner Circle", price: "₦1,500", detail: "For members who want a little more from the Club.", features: ["Everything in Open Club", "Member-only Scene access where offered", "Exclusive community perks"] },
  { name: "Black Card", price: "₦5,000", detail: "A premium membership tier for the most involved members.", features: ["Everything in Inner Circle", "Premium member recognition", "Priority access to selected experiences"] },
];

export default function MembershipPage() {
  return (
    <main className="feed-shell">
      <header className="screen-heading">
        <Link href="/my-club" className="back-link">‹ Back to My Club</Link>
        <h1>Membership</h1>
        <p>Choose how you experience the Club.</p>
      </header>
      <div className="membership-plans">
        {plans.map((plan, index) => (
          <article className={index === 2 ? "membership-plan featured" : "membership-plan"} key={plan.name}>
            <p className="onboard-kicker">{index === 2 ? "PREMIUM TIER" : "CLUB MEMBERSHIP"}</p>
            <h2>{plan.name}</h2>
            <strong className="plan-price">{plan.price}<small>{index === 0 ? "" : " / month"}</small></strong>
            <p>{plan.detail}</p>
            <ul>{plan.features.map(feature => <li key={feature}>✓ {feature}</li>)}</ul>
            <span className="plan-status">{index === 0 ? "Available to everyone" : "Payments will be enabled after secure setup"}</span>
          </article>
        ))}
      </div>
      <p className="supporting">Membership checkout is not active on this preview. No payment will be collected here.</p>
    </main>
  );
}
