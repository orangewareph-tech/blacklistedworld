import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BlackListed — Who We Are" },
      { name: "description", content: "BlackListed is a public due diligence platform built to help people verify counterparties before transacting." },
      { property: "og:title", content: "About BlackListed" },
      { property: "og:description", content: "Independent due diligence database — built by investigators, lawyers and victims of fraud." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">← Back</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">About BlackListed</h1>
        <p className="text-muted-foreground mb-8">Independent global due diligence — built to stop fraud before it happens.</p>

        <div className="bl-card p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-2">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every year, billions are lost to investment scams, fake brokers, counterfeit goods and rental fraud.
              BlackListed exists so that anyone, anywhere, can search a name, company, wallet or bank account
              before transferring funds or signing a contract.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">How It Works</h2>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>Anyone can submit a report with evidence — documents, receipts, chat logs.</li>
              <li>Our moderators review every submission within 24–72 hours.</li>
              <li>Only verified, approved reports become publicly searchable.</li>
              <li>Subjects of reports may submit rebuttals — verified replies are published.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">Who We Are</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              BlackListed is operated by a team of fraud investigators, compliance lawyers and software engineers
              who have spent years helping clients recover from cross-border fraud. We operate independently and
              do not accept payment to remove reports.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
