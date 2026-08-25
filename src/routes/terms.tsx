import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({
    meta: [
      { title: "Terms of Service — HWID Sessions" },
      { name: "description", content: "Terms of service for the HWID Sessions service." },
    ],
  }),
});

function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">HWID Sessions</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: May 8, 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Acceptance of terms</h2>
          <p className="text-muted-foreground">
            By accessing or using HWID Sessions ("the Service") you agree to be bound by these
            Terms of Service. If you do not agree, do not use the Service. The Service is
            provided by an independent operator and is not affiliated with, endorsed by, or
            sponsored by Roblox Corporation, Lovable, or any third party named in the
            documentation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. What the Service does</h2>
          <p className="text-muted-foreground">
            The Service is a developer utility that (a) throttles repeated requests from the
            same hardware identifier, (b) issues short-lived session tokens, and (c) returns
            operator-supplied text content to authenticated callers. It is intended for the
            operator's own personal projects and a small community of authorized users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. Acceptable use</h2>
          <p className="text-muted-foreground">You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Collect, transmit, or process personal data of other people through this endpoint.</li>
            <li>Distribute malware, spyware, ransomware, or any code intended to damage devices or data.</li>
            <li>Distribute content that is illegal, defamatory, harassing, hateful, sexual content involving minors, or that infringes anyone's intellectual property.</li>
            <li>Violate the Terms of Use of any third-party platform, including but not limited to Roblox.</li>
            <li>Attempt to circumvent the throttling, ban list, session limits, or authentication.</li>
            <li>Reverse-engineer, scrape at scale, or perform load tests without the operator's prior written permission.</li>
            <li>Resell, sublicense, or commercially redistribute access without the operator's permission.</li>
            <li>Use the Service in any manner that could damage, disable, overburden, or impair it.</li>
          </ul>
          <p className="text-muted-foreground">
            The operator may suspend or terminate access (including permanently banning HWIDs)
            at any time and without notice for any violation of these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Operator content responsibility</h2>
          <p className="text-muted-foreground">
            The script content delivered by the Service is supplied entirely by the operator.
            The operator is solely responsible for ensuring that this content complies with all
            applicable laws and the terms of any platform it interacts with. Lovable, its
            hosting providers, and any infrastructure provider named in the documentation are
            not the authors of that content and bear no responsibility for it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Intellectual property</h2>
          <p className="text-muted-foreground">
            The Service's source code, branding, and documentation belong to the operator. You
            receive a limited, non-exclusive, revocable right to use the Service as intended.
            No other rights are granted.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Privacy</h2>
          <p className="text-muted-foreground">
            Use of the Service is also governed by our{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>,
            which describes the limited technical data we collect (HWID, PlaceId, timestamps)
            and how it is used.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">7. No warranty</h2>
          <p className="text-muted-foreground">
            The Service is provided <strong>"as is" and "as available"</strong>, without
            warranty of any kind, express or implied, including but not limited to warranties
            of merchantability, fitness for a particular purpose, non-infringement, or
            uninterrupted availability. The operator does not warrant that the Service will be
            error-free or secure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">8. Limitation of liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, the operator and its providers shall not
            be liable for any indirect, incidental, special, consequential, or punitive
            damages, or for any loss of profits, revenue, data, or goodwill, arising out of or
            related to your use of (or inability to use) the Service, even if advised of the
            possibility of such damages. The operator's total cumulative liability shall not
            exceed USD $0, reflecting that the Service is provided free of charge.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">9. Indemnity</h2>
          <p className="text-muted-foreground">
            You agree to indemnify and hold harmless the operator and its providers from any
            claim, damage, or expense (including reasonable legal fees) arising from your
            misuse of the Service or violation of these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">10. Termination</h2>
          <p className="text-muted-foreground">
            The operator may suspend or terminate the Service, or your access to it, at any
            time and for any reason. Upon termination, all rights granted under these terms
            cease immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">11. Changes</h2>
          <p className="text-muted-foreground">
            The operator may update these terms at any time. Continued use after changes
            constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">12. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these terms, contact the operator through the same channel you
            use to access the Service.
          </p>
        </section>

        <p className="pt-6">
          <Link to="/" className="text-primary hover:underline">← Back home</Link>
        </p>
      </main>
    </div>
  );
}
