import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, ShieldAlert, Cpu, ExternalLink, Sun, Moon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function TermsOfService() {
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = "November 4, 2026";

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'service-desc', title: '2. Description of Service & License' },
    { id: 'youtube-terms', title: '3. YouTube API & Third-Party Content' },
    { id: 'intellectual-property', title: '4. Intellectual Property & Ownership' },
    { id: 'acceptable-use', title: '5. Acceptable Use & Security Prohibitions' },
    { id: 'crypto-prohibition', title: '6. Strict Crypto-Mining & Exploit Ban' },
    { id: 'ai-disclaimer', title: '7. AI Study Tutor Disclaimer' },
    { id: 'quotas-keys', title: '8. Study Quotas & API Key Usage' },
    { id: 'warranty-liability', title: '9. Disclaimer of Warranties & Liability' },
    { id: 'termination', title: '10. Termination & Account Cancellation' },
    { id: 'governing-law', title: '11. Governing Law & Dispute Resolution' },
    { id: 'contact', title: '12. Inquiries & Legal Notices' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#F5C542]/30 selection:text-black">
      {/* Top Editorial Sticky Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition group"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Foclyra</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <div className="flex items-center gap-1.5">
              <Scale className="size-4 text-zinc-900 dark:text-white" />
              <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white">Terms of Service</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/privacy"
              className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2.5 py-1.5 rounded-lg transition"
            >
              Privacy Policy
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="size-8 sm:size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Title & Metadata Banner */}
        <div className="space-y-4 pb-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium">
            <FileText className="size-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Standard User Agreement & Terms of Use</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            Please review these Terms of Service carefully prior to using Foclyra. By accessing our platform, you acknowledge your agreement to be legally bound by these terms, our Privacy Policy, and YouTube&apos;s Terms of Service.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-500 pt-2">
            <span>Effective Date: {lastUpdated}</span>
            <span>•</span>
            <span>Version: 2.1 (Global Standard)</span>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
          {/* Table of Contents Sticky Aside */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Contents
              </span>
              <nav className="space-y-1 text-xs">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block py-1.5 px-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition truncate"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Legal Prose Content */}
          <article className="lg:col-span-8 space-y-12 text-zinc-700 dark:text-zinc-300 text-sm sm:text-[15px] leading-relaxed">

            {/* Section 1 */}
            <section id="acceptance" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                1. Acceptance of Terms
              </h2>
              <p>
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;) and Foclyra (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By visiting, registering for, or using the Foclyra web application, you signify that you have read, understood, and agreed to be bound by these Terms and our accompanying Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the platform.
              </p>
            </section>

            {/* Section 2 */}
            <section id="service-desc" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                2. Description of Service & License Grant
              </h2>
              <p>
                Foclyra provides a specialized educational workspace designed to streamline online video learning. The platform enables users to import publicly available YouTube playlists, organize them into distraction-free course modules, record timestamped markdown notes, track lesson completion, and query an in-context AI tutor grounded in the video timeline.
              </p>
              <p>
                Subject to your compliance with these Terms, Foclyra grants you a personal, non-exclusive, non-transferable, revocable license to access and use the platform solely for your personal, educational, or professional self-improvement purposes.
              </p>
            </section>

            {/* Section 3: YouTube Terms */}
            <section id="youtube-terms" className="space-y-4 scroll-mt-24 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-950 dark:text-white font-semibold text-base">
                <ExternalLink className="size-4 text-red-500" />
                <h3>3. YouTube API Services & Third-Party Content</h3>
              </div>
              <p>
                Foclyra utilizes YouTube API Services to access publicly available playlist metadata and embed video content via the official YouTube player embed.
              </p>
              <div className="space-y-2 text-xs sm:text-sm bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
                <p className="font-medium text-zinc-900 dark:text-white">
                  Mandatory Notice pursuant to YouTube Developer Terms:
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  By using Foclyra, you acknowledge and agree that your playback and interaction with YouTube video content is additionally subject to the{' '}
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-950 dark:text-white font-semibold underline"
                  >
                    YouTube Terms of Service
                  </a>
                  {' '}and{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-950 dark:text-white font-semibold underline"
                  >
                    Google Privacy Policy
                  </a>.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Foclyra does not host, store, alter, or download raw YouTube video files. All streaming and content delivery originate directly from YouTube&apos;s content delivery network.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="intellectual-property" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                4. Intellectual Property & Ownership
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong>Third-Party Video Content:</strong> All rights, title, and intellectual property in and to the YouTube videos, audio, and creator thumbnails displayed inside Foclyra remain the exclusive property of their respective creators and copyright owners. Foclyra asserts no ownership whatsoever over third-party YouTube media.
                </li>
                <li>
                  <strong>Your Notes & Exports:</strong> Any notes, summaries, or exported documents (.docx) you create belong entirely to you. We assert zero intellectual property rights over your personal study notes.
                </li>
                <li>
                  <strong>Foclyra Platform IP:</strong> The Foclyra name, logo, branding, source code, UI designs, and editorial layouts are protected by copyright, trademark, and unfair competition laws. You may not reverse engineer, reproduce, or resell the Foclyra interface without express written consent.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="acceptable-use" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                5. Acceptable Use & Security Prohibitions
              </h2>
              <p>You agree not to engage in any of the following prohibited behaviors:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Automated scraping, crawling, or querying of Foclyra APIs via headless scripts, bots, or unauthorized proxies.</li>
                <li>Attempting to probe, scan, or breach Foclyra&apos;s serverless infrastructure, network defenses, or rate limiters.</li>
                <li>Injecting malicious scripts, XSS payloads, SQL injections, or denial-of-service traffic into the platform.</li>
                <li>Impersonating any person or misrepresenting an affiliation with Foclyra.</li>
                <li>Bypassing or circumventing account limits, authentication mechanisms, or CORS origin headers.</li>
              </ul>
            </section>

            {/* Section 6: Crypto & Exploit Ban */}
            <section id="crypto-prohibition" className="space-y-4 scroll-mt-24 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-base">
                <ShieldAlert className="size-5" />
                <h3>6. Strict Cryptocurrency-Mining & Exploit Prohibitions</h3>
              </div>
              <p className="text-zinc-800 dark:text-zinc-200">
                Foclyra maintains zero tolerance for computational abuse. You are strictly forbidden from utilizing Foclyra, its AI Tutor endpoints, or computing resources for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <li>Writing, testing, generating, or executing cryptocurrency mining software (including Monero, Bitcoin, XMRig, Stratum protocols, or CPU/GPU hashrate loops).</li>
                <li>Generating Web3/crypto wallet drainers, smart contract flash loan exploits, or unauthorized fund reallocation tools.</li>
                <li>Crafting offensive cyber payloads, reverse shells, keyloggers, ransomware, or botnet command-and-control scripts.</li>
                <li>Attempting prompt injections, jailbreaks (&quot;DAN&quot;), or extracting internal system prompts and server environment variables.</li>
              </ul>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Violations of this section result in immediate IP blacklisting and potential referral to relevant cybersecurity authorities.
              </p>
            </section>

            {/* Section 7 */}
            <section id="ai-disclaimer" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <Cpu className="size-5 text-amber-500" />
                <span>7. AI Study Tutor Disclaimer</span>
              </h2>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-950 dark:text-white font-semibold">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <span>Educational Assistance Only</span>
                </div>
                <p>
                  Foclyra&apos;s AI Tutor is an automated supplemental study aid powered by Google Gemini. While designed to ground explanations in course video timestamps, AI-generated responses may occasionally contain inaccuracies, incomplete code, or hallucinations.
                </p>
                <p>
                  AI explanations do not constitute professional, legal, medical, or financial advice. Users bear the sole responsibility of verifying technical accuracy before using code in production environments.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="quotas-keys" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                8. Study Quotas & Personal API Keys
              </h2>
              <p>
                To maintain high availability for all learners, free accounts are allocated a generous daily quota of 30 AI doubt-solving questions, resetting every night at 00:00 local time.
              </p>
              <p>
                Users requiring unlimited questions may supply their own personal Google Gemini API key via Settings. You are solely responsible for maintaining the confidentiality of your personal API key and any usage charges incurred on your Google Cloud Console account.
              </p>
            </section>

            {/* Section 9 */}
            <section id="warranty-liability" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                9. Disclaimer of Warranties & Limitation of Liability
              </h2>
              <p className="uppercase text-xs tracking-wider text-zinc-500 font-semibold">
                Provided &quot;As Is&quot; &amp; &quot;As Available&quot;
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                FOCLYRA IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR UNINTERRUPTED AVAILABILITY.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL FOCLYRA, ITS CREATORS, OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OR INABILITY TO USE THE PLATFORM.
              </p>
            </section>

            {/* Section 10 */}
            <section id="termination" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                10. Termination & Account Cancellation
              </h2>
              <p>
                We reserve the right to suspend or terminate access to Foclyra at our sole discretion, without prior notice, for conduct that violates these Terms or harms other users or the platform. You may terminate your relationship with Foclyra at any time by clearing your data in Settings or ceasing use of the site.
              </p>
            </section>

            {/* Section 11 */}
            <section id="governing-law" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                11. Governing Law & Severability
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws applicable to general electronic commerce and internet services, without regard to conflict of law principles. If any provision of these Terms is deemed unlawful or unenforceable, that provision shall be severable and shall not affect the validity of remaining provisions.
              </p>
            </section>

            {/* Section 12 */}
            <section id="contact" className="space-y-3 scroll-mt-24 p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                12. Inquiries & Legal Notices
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                For questions regarding these Terms or formal legal notices, please reach out to:
              </p>
              <div className="text-xs space-y-1 font-mono text-zinc-800 dark:text-zinc-200">
                <p>Email: <a href="mailto:support@foclyra.com" className="underline font-semibold">support@foclyra.com</a> (or <a href="mailto:sameedsiddiqui9@gmail.com" className="underline">sameedsiddiqui9@gmail.com</a>)</p>
                <p>Official Repository: <a href="https://github.com/ssiddiquiii/foclyra" target="_blank" rel="noopener noreferrer" className="underline">github.com/ssiddiquiii/foclyra</a></p>
              </div>
            </section>

          </article>
        </div>

        {/* Bottom Footer Callout */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Foclyra. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-zinc-950 dark:hover:text-white transition underline">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-zinc-950 dark:hover:text-white transition">
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
