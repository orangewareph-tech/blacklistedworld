import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact BlackListed — Get in Touch" },
      { name: "description", content: "Reach the BlackListed team for support, disputes, legal notices or media inquiries." },
      { property: "og:title", content: "Contact BlackListed" },
      { property: "og:description", content: "Support, disputes, legal and media contact details." },
    ],
  }),
  component: ContactPage,
});

const channels = [
  { label: "General Support", value: "support@blacklisted.com", href: "mailto:support@blacklisted.com" },
  { label: "Disputes & Rebuttals", value: "disputes@blacklisted.com", href: "mailto:disputes@blacklisted.com" },
  { label: "Legal / Takedown", value: "legal@blacklisted.com", href: "mailto:legal@blacklisted.com" },
  { label: "Press & Media", value: "press@blacklisted.com", href: "mailto:press@blacklisted.com" },
  { label: "Phone (24/7 Hotline)", value: "+44 20 4538 9921", href: "tel:+442045389921" },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-8">We respond to verified inquiries within 1 business day.</p>

        <div className="bl-card p-8 space-y-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="flex items-center justify-between gap-4 p-4 rounded-lg border border-white/10 hover:border-[var(--accent)]/50 hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-[#ccc]">{c.label}</span>
              <span className="text-sm text-[var(--accent-glow)]">{c.value}</span>
            </a>
          ))}
        </div>

        <div className="bl-card p-6 mt-6">
          <h2 className="text-sm font-bold mb-2">Registered Office</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            BlackListed Holdings Ltd.<br />
            71-75 Shelton Street, Covent Garden<br />
            London, WC2H 9JQ, United Kingdom
          </p>
        </div>
      </div>
    </div>
  );
}
