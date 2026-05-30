import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { RustCanvas } from "@/components/RustCanvas";
import { AnimatedStat } from "@/components/AnimatedStat";
import { IntroLogo } from "@/components/IntroLogo";
import { useAuth } from "@/hooks/useAuth";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import blacklistedLogo from "@/assets/blacklisted-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlackListed — Global Transaction Due Diligence Database" },
      { name: "description", content: "Public due diligence platform. Search and share verified experiences with individuals, companies, agents, brokers and suppliers before you transact." },
      { property: "og:title", content: "BlackListed — Protect Yourself Before You Transact" },
      { property: "og:description", content: "Global transaction due diligence & public experience database." },
    ],
  }),
  component: Index,
});

type Status = "allegation" | "verified" | "court" | "resolved" | "review";

const statusMeta: Record<Status, { label: string; cls: string }> = {
  allegation: { label: "Allegation", cls: "bl-badge-medium" },
  verified: { label: "Verified by Documents", cls: "bl-badge-verified" },
  court: { label: "Court Confirmed", cls: "bl-badge-court" },
  resolved: { label: "Resolved", cls: "bl-badge-resolved" },
  review: { label: "Under Review", cls: "bl-badge-review" },
};

const reports = [
  {
    name: "Marcus V. — Crypto Investment Scheme",
    risk: "high" as const,
    status: "verified" as Status,
    rows: [
      ["Country / City", "United Arab Emirates · Dubai"],
      ["Transaction Type", "Crypto Investment"],
      ["Amount", "USD 12,500"],
      ["Passport", "AB123***"],
      ["Wallet", "bc1q...8x4f"],
    ],
    excerpt: "Promised 300% returns on a 'managed BTC fund'. After receiving deposit, communication channels were closed. Contracts, wire receipts and chat logs attached.",
    when: "2 days ago", evidence: 4, reportsCount: 3,
  },
  {
    name: "Goldline Trading FZE — Commodity Fraud",
    risk: "high" as const,
    status: "court" as Status,
    rows: [
      ["Industry", "Gold / Precious Metals"],
      ["Country", "Hong Kong"],
      ["Reference", "INV-2025-0418"],
      ["Bank Acct", "****6721"],
      ["Court Case", "HC-2025-1147"],
    ],
    excerpt: "Issued forged LBMA certificates against a 50kg bullion contract. Confirmed by court ruling. Buyer never received delivery; partial recovery in progress.",
    when: "5 days ago", evidence: 11, reportsCount: 7,
  },
  {
    name: "Sarah J. — Rental Misrepresentation",
    risk: "medium" as const,
    status: "allegation" as Status,
    rows: [
      ["Email", "sarah.rentals@***mail.com"],
      ["Country / City", "Spain · Barcelona"],
      ["Transaction Type", "Real Estate Deposit"],
      ["Amount", "EUR 800"],
    ],
    excerpt: "Listed an apartment she did not own on Facebook Marketplace. Took refundable deposit and disappeared. Multiple similar reports linked to same email domain.",
    when: "1 week ago", evidence: 2, reportsCount: 4,
  },
];

const searchFilters = [
  "Full Name", "Alias / Nickname", "Company Name", "Country", "City",
  "Passport No. (partial)", "National ID (partial)", "Phone Number", "Email Address",
  "Bank Account (partial)", "Crypto Wallet", "Website Domain", "Transaction Type",
  "Commodity Type", "Reference Number", "Social Media", "Court Case No.", "Police Report No.",
];

const reportCategories = [
  "Fraud", "Scam Attempt", "Contract Breach", "Non-Payment", "Misrepresentation",
  "Fake Investment Scheme", "Cryptocurrency Fraud", "Gold / Commodity / Trade Fraud",
  "Identity Fraud", "Other Business Misconduct",
];

function Index() {
  const [submitted, setSubmitted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [heroQuery, setHeroQuery] = useState("");
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const runHeroSearch = () => {
    navigate({ to: "/reports", search: { q: heroQuery.trim() || undefined } });
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <IntroLogo />
      <div className="grain-overlay" aria-hidden />

      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-border px-4 md:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4 sticky top-0 z-50">
        <a href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <img src={blacklistedLogo} alt="BlackListed" className="h-9 md:h-10 w-auto drop-shadow-[0_2px_8px_rgba(229,57,53,0.5)]" />
        </a>
        <nav className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/reports" className="hover:text-white transition-colors">Reports</Link>
          <button onClick={() => scrollTo("legal-section")} className="hover:text-white transition-colors">Legal Notice</button>
          <button onClick={() => scrollTo("privacy-section")} className="hover:text-white transition-colors">Privacy</button>
          {isAdmin && <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>}
        </nav>
        <div className="flex gap-2.5 items-center">
          <div className="hidden md:flex gap-2.5">
            {user ? (
              <button className="bl-btn bl-btn-outline" onClick={() => signOut()}>Log Out</button>
            ) : (
              <Link to="/auth" className="bl-btn bl-btn-outline">Log In</Link>
            )}
            <button className="bl-btn bl-btn-primary" onClick={() => navigate({ to: user ? "/submit" : "/auth" })}>➕ Submit Report</button>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      {/* Hero */}
      <section id="search-section" className="relative max-w-3xl mx-auto px-6 pt-2 pb-10 md:pt-4 md:pb-14 text-center min-h-[420px] flex flex-col justify-center overflow-hidden">
        <RustCanvas />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground mb-6">
            <span className="live-dot" />
            Global Due Diligence · Community-Verified
          </div>
          <h1 className="mb-6 flex justify-center">
            <img src={blacklistedLogo} alt="BlackListed — Protect Yourself Before You Transact" className="w-full max-w-md md:max-w-lg h-auto drop-shadow-[0_20px_40px_rgba(229,57,53,0.45)]" />
          </h1>
          <p className="text-sm md:text-base uppercase tracking-[0.25em] text-[var(--accent-glow)] font-semibold mb-3">
            Protect Yourself Before You Transact
          </p>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8">
            A public due diligence platform where users share real experiences with individuals, companies, agents, brokers, suppliers, buyers, investors and service providers — worldwide.
          </p>
          <div className="bl-search">
            <input
              type="text"
              placeholder="Name, company, passport, wallet, phone, email, IBAN..."
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runHeroSearch(); }}
            />
            <button className="bl-btn bl-btn-primary" onClick={runHeroSearch}>
              🔍 Search
            </button>
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="text-xs text-[var(--accent-glow)] mt-4 hover:underline tracking-wide"
          >
            {showFilters ? "− Hide" : "+ Show"} advanced search filters ({searchFilters.length})
          </button>
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
              {searchFilters.map((f) => (
                <span key={f} className="bl-chip">{f}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-5">
            Example: AB123*** · 0xA1b2...c9f0 · INV-2025-0418 · goldline-trading.com
          </p>
        </div>
        <div className="absolute bottom-3 right-5 text-[0.65rem] text-[var(--text-muted)] z-20 pointer-events-none tracking-[0.15em] uppercase">
          🦀 Rust Network
        </div>
      </section>

      {/* Stats */}
      <div className="flex justify-center gap-8 md:gap-12 flex-wrap px-6 py-6 max-w-[900px] mx-auto mb-8">
        <AnimatedStat value={12847} label="Reports Filed" />
        <AnimatedStat value={9203} label="Entities Listed" />
        <AnimatedStat value={4.2} prefix="$" suffix="M" label="Fraud Prevented" />
        <AnimatedStat value={98} suffix="%" label="Evidence-Backed" />
        <AnimatedStat value={147} label="Countries Covered" />
      </div>

      <div className="max-w-[1100px] mx-auto px-6">
        {/* How it works */}
        <h2 className="text-center text-2xl font-bold mb-1">How BlackListed Works</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">Search before you trust — submit if you've been wronged.</p>
        <div className="grid gap-6 mb-16 grid-cols-1 md:grid-cols-3">
          {[
            { icon: "🔍", title: "1. Search", text: "Before sending money, signing, or investing — look up names, companies, wallets, IBANs, passports or court cases." },
            { icon: "📋", title: "2. Review", text: "See independent user reports with risk scores, supporting documents, status flags and rebuttals from the accused." },
            { icon: "🛡️", title: "3. Decide", text: "Make an informed transaction decision. High risk? Walk away. Clean record? Proceed with proper due diligence." },
          ].map((s) => (
            <div key={s.title} className="bl-card bl-card-hover p-7 text-center group">
              <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{s.icon}</div>
              <h4 className="font-bold mb-1">{s.title}</h4>
              <p className="text-muted-foreground text-sm">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <h2 className="text-center text-2xl font-bold mb-1">What You Can Report</h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">Submission is free of charge. Supporting documents may be attached.</p>
        <div className="flex flex-wrap gap-2 justify-center mb-16 max-w-3xl mx-auto">
          {reportCategories.map((c) => (
            <span key={c} className="bl-chip bl-chip-accent">{c}</span>
          ))}
        </div>

        {/* Recent Reports */}
        <h2 id="reports-section" className="text-center text-2xl font-bold mb-1">⚠️ Recent Community Reports</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">Independent user submissions. All identifiers are partially masked to protect privacy.</p>
        <div className="grid gap-5 mb-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => {
            const st = statusMeta[r.status];
            return (
              <div key={r.name} className="bl-card bl-card-hover report-shimmer p-5">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <span className="font-bold leading-tight">{r.name}</span>
                  <span className={`bl-badge ${r.risk === "high" ? "bl-badge-high" : "bl-badge-medium"}`}>
                    {r.risk === "high" ? "High Risk" : "Medium Risk"}
                  </span>
                </div>
                <span className={`bl-badge ${st.cls} mb-3 inline-block`}>{st.label}</span>
                {r.rows.map(([k, v]) => (
                  <div key={k} className="text-muted-foreground text-sm mb-1">
                    <strong className="text-[#ccc]">{k}:</strong> {v}
                  </div>
                ))}
                <p className="text-[#bbb] text-sm mt-2 line-clamp-3">{r.excerpt}</p>
                <div className="mt-4 text-xs text-[#666] flex justify-between border-t border-border pt-3">
                  <span>📅 {r.when}</span>
                  <span>📎 {r.evidence} files</span>
                  <span>👥 {r.reportsCount} reports</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Report */}
        <div id="submit-section" className="bl-card p-8 md:p-10 mb-16 max-w-[760px] mx-auto">
          <h2 className="text-center text-2xl font-bold mb-1">📝 Submit Your Experience</h2>
          <p className="text-center text-muted-foreground mb-2 text-sm">
            Free of charge. <strong className="text-foreground">Email and phone verification required before publication.</strong>
          </p>
          <p className="text-center text-[var(--text-muted)] mb-8 text-xs">
            Do not submit full passport numbers, national ID numbers, or full home addresses. Use partial identifiers only.
          </p>

          {!submitted ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name / Company Name *"><input className="bl-input" placeholder="e.g. John Doe or Goldline Trading FZE" required maxLength={200} /></Field>
                <Field label="Alias / Nickname"><input className="bl-input" placeholder="e.g. CryptoKing88" maxLength={100} /></Field>

                <Field label="Country *">
                  <input className="bl-input" placeholder="e.g. United Arab Emirates" required maxLength={80} />
                </Field>
                <Field label="City"><input className="bl-input" placeholder="e.g. Dubai" maxLength={80} /></Field>

                <Field label="Phone Number"><input type="tel" className="bl-input" placeholder="+971-50-000-0000" maxLength={30} /></Field>
                <Field label="Email Address"><input type="email" className="bl-input" placeholder="party@example.com" maxLength={120} /></Field>

                <Field label="Website / Domain"><input className="bl-input" placeholder="example.com" maxLength={120} /></Field>
                <Field label="Social Media Account"><input className="bl-input" placeholder="@handle / profile URL" maxLength={150} /></Field>

                <Field label="Passport No. (partial only)"><input className="bl-input" placeholder="AB123***" maxLength={20} /></Field>
                <Field label="National ID (partial only)"><input className="bl-input" placeholder="****5678" maxLength={20} /></Field>

                <Field label="Bank Account (partial only)"><input className="bl-input" placeholder="IBAN ****6721" maxLength={40} /></Field>
                <Field label="Crypto Wallet Address"><input className="bl-input" placeholder="0xA1b2...c9f0" maxLength={120} /></Field>

                <Field label="Transaction Type *">
                  <select className="bl-input" required defaultValue="">
                    <option value="" disabled>Select type...</option>
                    <option>Investment</option><option>Loan</option><option>Real Estate</option>
                    <option>Trade / Commodity</option><option>Cryptocurrency</option>
                    <option>Service Contract</option><option>Online Purchase</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Commodity / Industry">
                  <select className="bl-input" defaultValue="">
                    <option value="">Select industry...</option>
                    <option>Gold / Precious Metals</option><option>Crypto</option>
                    <option>Real Estate</option><option>Oil & Gas</option><option>FX / Forex</option>
                    <option>E-commerce</option><option>Logistics</option><option>Other</option>
                  </select>
                </Field>

                <Field label="Report Category *">
                  <select className="bl-input" required defaultValue="">
                    <option value="" disabled>Select category...</option>
                    {reportCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Amount Involved (USD)">
                  <input type="number" min={0} max={1000000000} className="bl-input" placeholder="e.g. 12500" />
                </Field>

                <Field label="Date of Incident"><input type="date" className="bl-input" /></Field>
                <Field label="Reference Number"><input className="bl-input" placeholder="Invoice / Contract ref" maxLength={80} /></Field>

                <Field label="Court Case Number"><input className="bl-input" placeholder="Optional" maxLength={80} /></Field>
                <Field label="Police Report Number"><input className="bl-input" placeholder="Optional" maxLength={80} /></Field>

                <div className="md:col-span-2">
                  <Field label="Describe Your Experience *">
                    <textarea className="bl-input min-h-[130px] resize-y" placeholder="Provide dates, amounts, what was agreed and what happened. Stick to verifiable facts." required maxLength={5000} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-[#ccc] block mb-1">Upload Supporting Evidence</label>
                  <label className="bg-[var(--input-bg)] border-[1.5px] border-dashed border-border rounded-lg p-4 text-center text-[#777] cursor-pointer block transition-all hover:border-[#555] hover:text-[#aaa]">
                    📁 Contracts, invoices, receipts, screenshots, emails, photos
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.eml,.msg" className="hidden" />
                  </label>
                </div>

                <div className="md:col-span-2 flex items-start gap-2 text-xs text-[#bbb]">
                  <input id="cert" type="checkbox" required className="mt-0.5" />
                  <label htmlFor="cert">
                    I certify that the information is truthful, based on actual events, and that I possess evidence supporting these statements. I agree to indemnify the website operator against any claims arising from this submission.
                  </label>
                </div>
              </div>
              <div className="bg-[rgba(255,179,0,0.06)] border border-[rgba(255,179,0,0.2)] rounded-lg p-4 text-xs text-[#bbb] text-center">
                ⚠️ <strong className="text-[var(--amber)]">Legal Notice:</strong> The submitter is solely responsible for the accuracy and legality of the information. False, defamatory, or malicious reports may result in account termination and legal action.
              </div>
              <button type="submit" className="bl-btn bl-btn-primary w-full py-3.5 text-base">🛡️ Submit Report for Review</button>
            </form>
          ) : (
            <div className="text-center p-6 bg-[rgba(46,125,50,0.15)] border border-[rgba(46,125,50,0.4)] rounded-lg text-[#a5d6a7]">
              ✅ <strong>Report Submitted.</strong> You'll receive an email and SMS verification link. After verification, our moderators will review within 24–72 hours.
            </div>
          )}
        </div>

        {/* Status Legend */}
        <h2 className="text-center text-2xl font-bold mb-1">Report Status Flags</h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">Every published report carries a transparent status flag.</p>
        <div className="grid gap-4 mb-16 grid-cols-2 md:grid-cols-5">
          {(Object.keys(statusMeta) as Status[]).map((k) => (
            <div key={k} className="bl-card p-4 text-center">
              <span className={`bl-badge ${statusMeta[k].cls} mb-2 inline-block`}>{statusMeta[k].label}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {k === "allegation" && "Unverified user claim."}
                {k === "verified" && "Backed by uploaded documents."}
                {k === "court" && "Confirmed by court ruling."}
                {k === "resolved" && "Dispute closed or settled."}
                {k === "review" && "Pending moderator review."}
              </p>
            </div>
          ))}
        </div>

        {/* Legal Notice */}
        <div id="legal-section" className="bl-card p-7 md:p-9 mb-10">
          <h2 className="text-xl font-bold mb-3">⚖️ Important Legal Notice</h2>
          <p className="text-sm text-muted-foreground mb-3">
            All reports published on this website are submitted by independent users. The submitter is <strong className="text-foreground">solely and exclusively responsible</strong> for the accuracy, truthfulness, legality, and completeness of any information provided.
          </p>
          <p className="text-sm text-muted-foreground mb-2">By submitting a report, the user represents and warrants that:</p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mb-3">
            <li>The information is truthful and based on actual events.</li>
            <li>The user possesses evidence supporting the statements made.</li>
            <li>The submission does not knowingly contain false, misleading, defamatory, abusive, or malicious content.</li>
            <li>The submission does not violate any applicable laws or third-party rights.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            The website operator does not independently verify every submission and does not endorse or guarantee the accuracy of any user-generated content. Users agree to indemnify and hold harmless the website owner, operators, employees, affiliates, and service providers against any claims, losses, damages, liabilities, costs, or legal expenses arising from their submissions.
          </p>
        </div>

        {/* Right of Reply + Removal Policy */}
        <div className="grid gap-5 mb-10 grid-cols-1 md:grid-cols-2">
          <div className="bl-card p-6">
            <h3 className="text-lg font-bold mb-2">🗣️ Right of Reply</h3>
            <p className="text-sm text-muted-foreground">
              Any individual or organization identified in a report may submit a response, correction, clarification, or rebuttal. Verified responses are published alongside the original report so readers see both sides.
            </p>
          </div>
          <div className="bl-card p-6">
            <h3 className="text-lg font-bold mb-2">🧹 Review & Removal Policy</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Reject submissions or edit for compliance.</li>
              <li>Remove abusive, duplicate, or unsupported content.</li>
              <li>Suspend or terminate user accounts.</li>
              <li>Comply with lawful court orders and government requests.</li>
            </ul>
          </div>
        </div>

        {/* Privacy */}
        <div id="privacy-section" className="bl-card p-7 md:p-9 mb-16">
          <h2 className="text-xl font-bold mb-3">🔐 Privacy Protection</h2>
          <p className="text-sm text-muted-foreground mb-3">
            To protect privacy and comply with data protection laws, the following identifiers are <strong className="text-foreground">always partially masked</strong> before publication:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { k: "Passport", v: "AB123***" },
              { k: "National ID", v: "****5678" },
              { k: "Bank / IBAN", v: "****6721" },
              { k: "Address", v: "Dubai, UAE" },
            ].map((m) => (
              <div key={m.k} className="bg-[var(--input-bg)] border border-border rounded-lg p-3 text-center">
                <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-1">{m.k}</div>
                <div className="font-mono text-sm text-white">{m.v}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Users should only submit information that is directly relevant to the reported transaction. Sensitive personal information will be redacted at moderation.
          </p>
        </div>

        {/* Safety Center */}
        <h2 className="text-center text-2xl font-bold mb-1">🛡️ Safety Center</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm">Practical steps for safer transactions.</p>
        <div className="grid gap-5 mb-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "🔍 Always Search First", text: "Run names, companies, wallets and IBANs through BlackListed before sending funds or signing." },
            { title: "🚩 Know the Red Flags", text: "Guaranteed returns, urgency, off-platform payment, crypto-only deals, refusal to KYC — classic risk signals." },
            { title: "📸 Keep Evidence", text: "Preserve contracts, invoices, chats and receipts. Originals strengthen reports and recovery efforts." },
            { title: "⚖️ Dispute or Reply", text: "Named in a report? Submit a rebuttal with evidence at disputes@blacklisted.com — verified replies are published." },
          ].map((c) => (
            <div key={c.title} className="bl-card p-5 hover:border-[#444] hover:-translate-y-0.5 transition-all">
              <h4 className="font-bold mb-1">{c.title}</h4>
              <p className="text-muted-foreground text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10 text-center text-xs text-[#555] flex flex-col gap-3">
        <div className="flex justify-center gap-6 flex-wrap">
          {["Terms of Use", "Privacy Policy", "Moderation Policy", "Right of Reply", "Removal Requests", "Contact Us"].map((l) => (
            <a key={l} href="#" className="text-[#777] hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <p>© 2026 BlackListed — Global Transaction Due Diligence. All rights reserved.</p>
        <p className="max-w-[720px] mx-auto text-[#555] text-[0.72rem] leading-relaxed">
          <strong>Disclaimer:</strong> This website is a public information and due diligence resource only. Content does not constitute legal, financial, investment, or professional advice. The operator makes no representations regarding the accuracy, reliability, completeness, or suitability of any user-published content. Users must conduct their own independent investigations before making any decisions. If you are in immediate danger or have suffered a crime, contact local law enforcement.
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
