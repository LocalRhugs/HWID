import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy Policy — HWID Sessions" },
      { name: "description", content: "Privacy policy for the HWID Sessions service." },
    ],
  }),
});

function Privacy() {
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
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: May 8, 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Who we are</h2>
          <p className="text-muted-foreground">
            HWID Sessions ("the Service") is a small developer utility that throttles repeated
            requests from the same hardware identifier so that a single client cannot abuse the
            operator's resources. It is operated for personal/community use and is not a
            commercial product. We are not affiliated with Roblox Corporation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. Information we collect</h2>
          <p className="text-muted-foreground">We collect only the minimum technical data required to operate session throttling:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>
              <strong>Hardware identifier (HWID)</strong> — a random string supplied by the
              executing client. We do not generate it, link it to your real identity, or use it
              for fingerprinting beyond rate limiting.
            </li>
            <li>
              <strong>Roblox PlaceId</strong> — the numeric ID of the experience the request was
              made from, used to confirm the request is from an allow-listed game.
            </li>
            <li>
              <strong>Timestamps</strong> — when a session started and when a cooldown began,
              so the timer logic works.
            </li>
            <li>
              <strong>Admin access</strong> — the dashboard is protected by a single shared
              site password; no account or personal identity is collected.
            </li>
          </ul>
          <p className="text-muted-foreground">
            We do <strong>not</strong> collect: real names, phone numbers, postal addresses,
            payment data, IP addresses for tracking, browsing history, location data,
            biometric data, or data from anyone under the age of 13.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. How we use the information</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>To enforce per-HWID session length and cooldown windows.</li>
            <li>To prevent abuse, spam, and automated scraping of the endpoint.</li>
            <li>To allow the operator to ban abusive HWIDs.</li>
            <li>To authenticate the small set of operator accounts allowed into the dashboard.</li>
          </ul>
          <p className="text-muted-foreground">We do not use any of this data for advertising, profiling, or sale.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Cookies and tracking</h2>
          <p className="text-muted-foreground">
            The Service does not run advertising trackers, analytics, or third-party tracking
            pixels. The only cookie used is the authentication session cookie set by our
            sign-in provider so the operator stays logged in.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. Data sharing</h2>
          <p className="text-muted-foreground">
            We do not sell, rent, trade, or share any collected data with third parties. Data
            is processed by our hosting providers (Lovable Cloud and the underlying database
            and edge infrastructure) solely to operate the Service. These providers act as
            data processors and are bound by their own privacy commitments.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Data retention</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Active session records are kept for the length of the session window (default 30 minutes).</li>
            <li>Cooldown records are kept for the cooldown window (default 5 hours), then automatically removed.</li>
            <li>Banned HWIDs are kept until manually removed by the operator.</li>
            <li>Operator login records follow our auth provider's standard retention.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">7. Your rights</h2>
          <p className="text-muted-foreground">
            Because we do not collect personally identifying information from end users, we
            usually cannot identify a specific individual from our records. If you believe a
            specific HWID belongs to you and you want it removed or unbanned, contact the
            operator (see Section 10) and provide the HWID value.
          </p>
          <p className="text-muted-foreground">
            Where applicable laws (such as GDPR or CCPA) grant rights of access, correction,
            deletion, or restriction of processing, we will honour them to the extent the data
            we hold can be tied to you.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">8. Children's privacy</h2>
          <p className="text-muted-foreground">
            The Service is not directed at children under 13. We do not knowingly collect
            personal data from children. If you believe a child has provided personal data to
            us, contact the operator and we will delete it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">9. Security</h2>
          <p className="text-muted-foreground">
            All requests are served over HTTPS. Database access is restricted by row-level
            security and a service-role key held only on the server side. Admin access is
            protected by a shared site password stored only on the server.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p className="text-muted-foreground">
            For data removal requests, questions, or to report abuse, contact the operator of
            this deployment through the same channel you use to access the Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">11. Changes to this policy</h2>
          <p className="text-muted-foreground">
            We may update this policy from time to time. The "Last updated" date at the top
            reflects the most recent revision. Continued use of the Service after changes
            constitutes acceptance of the revised policy.
          </p>
        </section>

        <p className="pt-6">
          <Link to="/" className="text-primary hover:underline">← Back home</Link>
        </p>
      </main>
    </div>
  );
}
