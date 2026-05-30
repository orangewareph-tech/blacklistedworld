import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { RustCanvas } from "@/components/RustCanvas";
import { AnimatedStat } from "@/components/AnimatedStat";
import { IntroLogo } from "@/components/IntroLogo";
import blacklistedLogo from "@/assets/blacklisted-logo.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlackListed — Check Before You Trust" },
      { name: "description", content: "Search our community-driven database of reported scammers before you send money, share info, or sign anything." },
      { property: "og:title", content: "BlackListed — Check Before You Trust" },
      { property: "og:description", content: "Community-driven scam reporting and verification." },
    ],
  }),
  component: Index,
});

const reports = [
  {
    name: "Marcus V. (CryptoScam_Pro)",
    risk: "high" as const,
    rows: [["Phone", "+1-555-0198"], ["Platform", "Telegram, WhatsApp"]],
    excerpt: "Promised 300% returns on crypto investments. After receiving $2,500 in BTC, blocked all communication. Screenshots provided.",
    when: "2 days ago", evidence: 4,
  },
  {
    name: "Sarah J. — Rental Fraud",
    risk: "medium" as const,
    rows: [["Email", "sarah.rentals@fakemail.com"], ["Platform", "Facebook Marketplace"]],
    excerpt: "Listed an apartment she didn't own. Took $800 deposit and disappeared. Multiple similar reports linked to same email.",
    when: "5 days ago", evidence: 2,
  },
  {
    name: "@tech_support_fake",
    risk: "high" as const,
    rows: [["Username", "@tech_support_fake (Instagram)"], ["Platform", "Instagram DMs"]],
    excerpt: "Impersonating a legitimate tech support account. Installed remote access software on victim's computer and stole banking info.",
    when: "1 week ago", evidence: 5,
  },
];

function Index() {
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };
  const scrollToSubmit = () => document.getElementById("submit-section")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <IntroLogo />
      <div className="grain-overlay" aria-hidden />

      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-border px-4 md:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-2.5 group cursor-default">
          <div className="bl-logo-icon">⚠️</div>
          <div className="text-2xl font-extrabold tracking-tight text-white">
            Black<span className="text-[var(--accent-glow)]">Listed</span>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button className="bl-btn bl-btn-outline" onClick={() => alert("🔒 Login / Sign Up — Coming soon.")}>Log In</button>
          <button className="bl-btn bl-btn-primary" onClick={scrollToSubmit}>➕ Submit Report</button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-3xl mx-auto px-6 py-20 md:py-24 text-center min-h-[460px] flex flex-col justify-center overflow-hidden">
        <RustCanvas />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground mb-6">
            <span className="live-dot" />
            Live · Community-Verified
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-[1.05] mb-4 text-white">
            Check <span className="hero-highlight">Before</span> You Trust.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-9">
            Search our community-driven database of reported scammers before you send money, share info, or sign anything.
          </p>
          <div className="bl-search">
            <input
              type="text"
              placeholder="Name, phone number, email, or username..."
            />
            <button className="bl-btn bl-btn-primary" onClick={() => alert("🔍 Search coming soon")}>
              🔍 Search
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-4">Example: +1-555-0198 • johndoe@fake.com • @crypto_guru_fake</p>
        </div>
        <div className="absolute bottom-3 right-5 text-[0.65rem] text-[var(--text-muted)] z-20 pointer-events-none tracking-[0.15em] uppercase">
          🦀 Rust Network
        </div>
      </section>

      {/* Stats */}
      <div className="flex justify-center gap-8 md:gap-12 flex-wrap px-6 py-6 max-w-[700px] mx-auto mb-8">
        <AnimatedStat value={12847} label="Reports Filed" />
        <AnimatedStat value={9203} label="Scammers Listed" />
        <AnimatedStat value={4.2} prefix="$" suffix="M" label="Fraud Prevented" />
        <AnimatedStat value={98} suffix="%" label="Evidence-Backed" />
      </div>

      <div className="max-w-[1100px] mx-auto px-6">
        {/* How it works */}
        <h2 className="text-center text-2xl font-bold mb-1">How BlackListed Works</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">A community shield — three simple steps.</p>
        <div className="grid gap-6 mb-16 grid-cols-1 md:grid-cols-3">
          {[
            { icon: "🔍", title: "1. Search", text: "Before any transaction, look up the person's name, phone, or email in our database." },
            { icon: "📋", title: "2. Review", text: "See community reports with risk scores and evidence — not just accusations." },
            { icon: "🛡️", title: "3. Decide", text: "Make an informed choice. High risk? Walk away. Clean record? Proceed with caution." },
          ].map((s) => (
            <div key={s.title} className="bl-card bl-card-hover p-7 text-center group">
              <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{s.icon}</div>
              <h4 className="font-bold mb-1">{s.title}</h4>
              <p className="text-muted-foreground text-sm">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Recent Reports */}
        <h2 className="text-center text-2xl font-bold mb-1">⚠️ Recent Community Reports</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">Latest allegations submitted by verified users. All reports are moderated.</p>
        <div className="grid gap-5 mb-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <div key={r.name} className="bl-card bl-card-hover report-shimmer p-5">
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="font-bold">{r.name}</span>
                <span className={`bl-badge ${r.risk === "high" ? "bl-badge-high" : "bl-badge-medium"}`}>
                  {r.risk === "high" ? "High Risk" : "Medium Risk"}
                </span>
              </div>
              {r.rows.map(([k, v]) => (
                <div key={k} className="text-muted-foreground text-sm mb-1">
                  <strong className="text-[#ccc]">{k}:</strong> {v}
                </div>
              ))}
              <p className="text-[#bbb] text-sm mt-2 line-clamp-2">{r.excerpt}</p>
              <div className="mt-4 text-xs text-[#555] flex justify-between">
                <span>📅 {r.when}</span>
                <span>📎 {r.evidence} evidence files</span>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Report */}
        <div id="submit-section" className="bl-card p-8 md:p-10 mb-16 max-w-[700px] mx-auto">
          <h2 className="text-center text-2xl font-bold mb-1">📝 Submit a Scam Report</h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Your report helps protect the community. <strong className="text-foreground">All submissions are reviewed.</strong>
          </p>

          {!submitted ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Scammer's Full Name *"><input className="bl-input" placeholder="e.g. John Doe" required /></Field>
                <Field label="Phone Number"><input type="tel" className="bl-input" placeholder="+1-555-0123" /></Field>
                <Field label="Email Address"><input type="email" className="bl-input" placeholder="scammer@example.com" /></Field>
                <Field label="Username / Handle"><input className="bl-input" placeholder="@scammer_handle" /></Field>
                <Field label="Platform Used *">
                  <select className="bl-input" required defaultValue="">
                    <option value="" disabled>Select platform...</option>
                    <option>WhatsApp</option><option>Telegram</option><option>Facebook / Messenger</option>
                    <option>Instagram</option><option>Email</option><option>Phone Call / SMS</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Scam Category *">
                  <select className="bl-input" required defaultValue="">
                    <option value="" disabled>Select category...</option>
                    <option>Investment / Crypto Scam</option><option>Romance Scam</option>
                    <option>Rental / Housing Scam</option><option>Phishing / Tech Support</option>
                    <option>Online Purchase Fraud</option><option>Identity Theft</option><option>Other</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Describe the Scam *">
                    <textarea className="bl-input min-h-[110px] resize-y" placeholder="Provide as much detail as possible. Include dates, amounts, and what happened..." required />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-[#ccc] block mb-1">Upload Evidence (Screenshots, Receipts)</label>
                  <label className="bg-[var(--input-bg)] border-[1.5px] border-dashed border-border rounded-lg p-4 text-center text-[#777] cursor-pointer block transition-all hover:border-[#555] hover:text-[#aaa]">
                    📁 Click to upload files (or drag and drop)
                    <input type="file" multiple accept="image/*,.pdf" className="hidden" />
                  </label>
                </div>
              </div>
              <div className="bg-[rgba(255,179,0,0.06)] border border-[rgba(255,179,0,0.2)] rounded-lg p-4 text-xs text-[#bbb] text-center">
                ⚠️ <strong className="text-[var(--amber)]">Legal Warning:</strong> By submitting this report, you certify that the information is true and accurate to the best of your knowledge. Filing a false report may result in legal consequences. All reports are moderated before publication.
              </div>
              <button type="submit" className="bl-btn bl-btn-primary w-full py-3.5 text-base">🛡️ Submit Report for Review</button>
            </form>
          ) : (
            <div className="text-center p-6 bg-[rgba(46,125,50,0.15)] border border-[rgba(46,125,50,0.4)] rounded-lg text-[#a5d6a7]">
              ✅ <strong>Report Submitted!</strong> Our moderation team will review it within 24-48 hours.
            </div>
          )}
        </div>

        {/* Safety Center */}
        <h2 className="text-center text-2xl font-bold mb-1">🛡️ Safety Center</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">Tips to protect yourself from scams.</p>
        <div className="grid gap-5 mb-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "🔍 Always Search First", text: "Before sending money or sharing personal info, search the person's details on BlackListed. 30 seconds can save you thousands." },
            { title: "🚩 Know the Red Flags", text: "Too-good-to-be-true returns, urgent pressure tactics, requests for gift cards or crypto — these are classic scam signals." },
            { title: "📸 Keep Evidence", text: "Save screenshots of all conversations, receipts, and profiles. This helps with reporting and potential recovery." },
            { title: "⚖️ Dispute a Report", text: "If you believe a report against you is false, contact us immediately at disputes@blacklisted.com with your evidence." },
          ].map((c) => (
            <div key={c.title} className="bl-card p-5 hover:border-[#444] hover:-translate-y-0.5 transition-all">
              <h4 className="font-bold mb-1">{c.title}</h4>
              <p className="text-muted-foreground text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-[#555] flex flex-col gap-3">
        <div className="flex justify-center gap-6 flex-wrap">
          {["Terms of Service", "Privacy Policy", "Moderation Policy", "Dispute a Report", "Contact Us"].map((l) => (
            <a key={l} href="#" className="text-[#777] hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <p>© 2026 BlackListed. All rights reserved.</p>
        <p className="max-w-[600px] mx-auto text-[#444] text-[0.72rem] leading-relaxed">
          <strong>Disclaimer:</strong> BlackListed is a neutral platform hosting user-generated reports. Allegations are not verified convictions.
          We do not guarantee the accuracy of any report. Use this information at your own discretion and always conduct your own due diligence.
          If you are in immediate danger, contact local law enforcement.
        </p>
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[#ccc]">{label}</label>
      {children}
    </div>
  );
}
