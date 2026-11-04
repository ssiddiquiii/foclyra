import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Cpu, Globe, Mail, Sun, Moon, ExternalLink } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function PrivacyPolicy() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = "November 4, 2026";

  const sections = [
    { id: 'introduction', title: '1. Introduction & Overview' },
    { id: 'youtube-api', title: '2. YouTube API Services & Google Privacy' },
    { id: 'data-we-collect', title: '3. Information We Collect' },
    { id: 'local-first', title: '4. Local-First Architecture & Storage' },
    { id: 'ai-tutor', title: '5. AI Study Tutor & Google Gemini Processing' },
    { id: 'data-usage', title: '6. How We Use Information' },
    { id: 'gdpr-ccpa', title: '7. GDPR & CCPA/CPRA Privacy Rights' },
    { id: 'security', title: '8. Security & Bot/Abuse Guardrails' },
    { id: 'retention', title: '9. Data Retention & Deletion' },
    { id: 'children', title: '10. Children\'s Privacy' },
    { id: 'contact', title: '11. Contact & Data Inquiries' }
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
              <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white">Privacy Policy</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/terms"
              className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2.5 py-1.5 rounded-lg transition"
            >
              Terms of Service
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <Globe className="size-3.5" />
            <span>International Standard Compliance (GDPR, CCPA, YouTube API Services)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            At Foclyra, we believe studying should be focused, private, and distraction-free. This Privacy Policy details how we handle, process, and protect your information across our web applications, in full compliance with international standards.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-500 pt-2">
            <span>Effective Date: {lastUpdated}</span>
            <span>•</span>
            <span>Version: 2.1 (International Edition)</span>
          </div>
        </div>

        {/* 2-Column Layout: Sidebar TOC + Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
          {/* Table of Contents Sticky Aside */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Table of Contents
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
            <section id="introduction" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                1. Introduction & Overview
              </h2>
              <p>
                Foclyra (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Foclyra Study Studio platform accessible via foclyra-studio.vercel.app and associated domains. Foclyra provides a distraction-free educational workspace that allows students and self-directed learners to organize public YouTube educational playlists into structured courses with timestamped notes, progress tracking, and AI-assisted doubt resolution.
              </p>
              <p>
                We are committed to a <strong>privacy-first, local-first philosophy</strong>. We believe your notes, learning habits, and bookmarks belong exclusively to you. We do not sell your personal data to data brokers or third-party advertisers.
              </p>
            </section>

            {/* Section 2: YouTube API Terms */}
            <section id="youtube-api" className="space-y-4 scroll-mt-24 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-950 dark:text-white font-semibold text-base">
                <Globe className="size-4 text-red-500" />
                <h3>2. YouTube API Services & Google Privacy Policy</h3>
              </div>
              <p>
                Foclyra relies on YouTube API Services to retrieve public playlist metadata (video titles, durations, channel information, and descriptions) and utilizes the official YouTube IFrame Player API for video playback.
              </p>
              <div className="space-y-2 text-xs sm:text-sm bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
                <p className="font-medium text-zinc-900 dark:text-white">
                  Mandatory Legal Notice pursuant to YouTube Developer Policies:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                  <li>
                    By using Foclyra, you are agreeing to be bound by the{' '}
                    <a
                      href="https://www.youtube.com/t/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-950 dark:text-white font-medium underline inline-flex items-center gap-0.5"
                    >
                      YouTube Terms of Service <ExternalLink className="size-3" />
                    </a>.
                  </li>
                  <li>
                    Foclyra accesses and displays YouTube content in accordance with the{' '}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-950 dark:text-white font-medium underline inline-flex items-center gap-0.5"
                    >
                      Google Privacy Policy <ExternalLink className="size-3" />
                    </a>.
                  </li>
                  <li>
                    Foclyra does not store private YouTube user credentials or access private user channels. If you authenticate with Google, you may revoke Foclyra&apos;s access at any time via the{' '}
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-950 dark:text-white font-medium underline inline-flex items-center gap-0.5"
                    >
                      Google Security Settings page <ExternalLink className="size-3" />
                    </a>.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="data-we-collect" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                3. Information We Collect
              </h2>
              <p>
                We minimize data collection strictly to what is required to deliver your study workspace:
              </p>
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <strong className="text-zinc-950 dark:text-white block text-sm">A. Account Credentials (Optional)</strong>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed block mt-1">
                    If you register for an optional account, we store your email address and securely hashed authentication credentials through Supabase Auth. Foclyra never sees or stores plaintext passwords.
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <strong className="text-zinc-950 dark:text-white block text-sm">B. Device & Network Telemetry</strong>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed block mt-1">
                    For rate-limiting, security guardrails, and DDoS mitigation, our serverless edge endpoints inspect your IP address and client user-agent. IP records used for burst limits are cached in volatile memory and purged automatically.
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <strong className="text-zinc-950 dark:text-white block text-sm">C. User-Provided API Keys</strong>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed block mt-1">
                    If you enter a personal Google Gemini API key in Settings, it is saved exclusively in your browser&apos;s local storage (<code className="font-mono text-zinc-900 dark:text-zinc-100">localStorage</code>) and transmitted only in authorization headers for your own queries.
                  </span>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="local-first" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <Database className="size-5 text-emerald-500" />
                <span>4. Local-First Architecture & Storage</span>
              </h2>
              <p>
                Unlike traditional online platforms that hoard your learning activities on centralized cloud servers, Foclyra uses an advanced <strong>Local-First Database (Dexie IndexedDB)</strong> architecture.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>
                  <strong>Notes & Summaries:</strong> Your timestamped notes and lecture insights are written directly to your browser&apos;s IndexedDB database.
                </li>
                <li>
                  <strong>Playback Bookmarks:</strong> Your lecture resume positions and completed progress checkboxes are stored locally on your device.
                </li>
                <li>
                  <strong>AI Chat Histories:</strong> Your doubt solving sessions are isolated per lecture and stored in local IndexedDB (<code className="font-mono text-zinc-900 dark:text-zinc-100">aiChats</code> table).
                </li>
                <li>
                  <strong>Export & Clear:</strong> You maintain total sovereign ownership. You can export your full course notes as a formatted Word document (.docx) or wipe your entire local database with one click in Settings at any time.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="ai-tutor" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <Cpu className="size-5 text-amber-500" />
                <span>5. AI Study Tutor & Google Gemini Processing</span>
              </h2>
              <p>
                When you ask a question to Foclyra&apos;s In-Context AI Study Tutor, your query is transmitted to Google&apos;s Gemini API to generate an accurate, pedagogical answer.
              </p>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs sm:text-sm space-y-2 text-zinc-700 dark:text-zinc-300">
                <strong className="text-zinc-950 dark:text-white block font-semibold">Transparency of AI Transmission:</strong>
                <p>
                  The payload sent to the Gemini API includes only: (i) your typed question, (ii) course and lesson title, (iii) sanitized video description snippet, (iv) current playback timestamp, and (v) the recent conversation turns from that lesson.
                </p>
                <p>
                  <strong>No Private Note Ingestion:</strong> Foclyra does NOT transmit your personal notes or passwords to train third-party foundation models.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="data-usage" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                6. How We Use Information
              </h2>
              <p>We use collected data solely for the following legitimate purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>To import YouTube playlists and format them into structured courses.</li>
                <li>To deliver timestamp-anchored AI tutoring responses.</li>
                <li>To synchronize progress for registered accounts across devices via secure Supabase backends.</li>
                <li>To prevent abuse, bot scraping, denial of service, and cryptocurrency mining abuse.</li>
                <li>To deliver customer support when you submit feedback.</li>
              </ul>
            </section>

            {/* Section 7: GDPR & CCPA */}
            <section id="gdpr-ccpa" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <Shield className="size-5 text-indigo-500" />
                <span>7. GDPR & CCPA/CPRA Privacy Rights</span>
              </h2>
              <p>
                Depending on your geographic location (including the European Economic Area, the UK, and California), you possess specific statutory rights regarding your personal information:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <strong className="text-zinc-900 dark:text-white block">Right to Access & Portability</strong>
                  <span className="text-zinc-600 dark:text-zinc-400 mt-1 block">Request a copy of any personal data we hold about you, or export your notes directly to Word (.docx).</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <strong className="text-zinc-900 dark:text-white block">Right to Erasure (To Be Forgotten)</strong>
                  <span className="text-zinc-600 dark:text-zinc-400 mt-1 block">Delete your account and all associated cloud data via Settings or by submitting a written request.</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <strong className="text-zinc-900 dark:text-white block">No Sale of Personal Data (CCPA)</strong>
                  <span className="text-zinc-600 dark:text-zinc-400 mt-1 block">Foclyra does not sell, rent, or share personal information with third parties for monetary consideration.</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <strong className="text-zinc-900 dark:text-white block">Right to Non-Discrimination</strong>
                  <span className="text-zinc-600 dark:text-zinc-400 mt-1 block">We will never deny services, charge different prices, or alter quality if you exercise your privacy rights.</span>
                </div>
              </div>
            </section>

            {/* Section 8: Security */}
            <section id="security" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <Lock className="size-5 text-emerald-500" />
                <span>8. Security & Bot/Abuse Guardrails</span>
              </h2>
              <p>
                We deploy multi-layer defensive guardrails to protect user privacy and system resources:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li><strong>CORS & Origin Hardening:</strong> Requests originating from unauthorized external domains or non-browser bots are automatically rejected.</li>
                <li><strong>Anti-Abuse Pre-Flight Guardrails:</strong> Our API endpoints scan incoming queries for illicit patterns (such as cryptocurrency mining payloads, web3 drainers, and exploit scripts) and reject them prior to model execution.</li>
                <li><strong>Rate Limiting:</strong> In-memory sliding-window limiters throttle automated request bursts to protect community availability.</li>
                <li><strong>Data Encryption:</strong> All in-transit communications utilize TLS 1.3 / HTTPS encryption.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="retention" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                9. Data Retention & Deletion
              </h2>
              <p>
                Local storage data resides on your client machine indefinitely until you clear your browser cache or utilize the &quot;Clear Data&quot; tool inside Settings. For registered accounts, account records are retained until you request account closure. Transient telemetry logs are automatically rotated and purged within 30 days.
              </p>
            </section>

            {/* Section 10 */}
            <section id="children" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                10. Children&apos;s Privacy (COPPA Compliance)
              </h2>
              <p>
                Foclyra is designed for self-directed adult and student learning and does not knowingly collect personal information from children under the age of 13 (or under 16 in the European Economic Area). If you believe a child has provided us with personal data, please contact us immediately and we will delete the information promptly.
              </p>
            </section>

            {/* Section 11 */}
            <section id="contact" className="space-y-4 scroll-mt-24 p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                <Mail className="size-5 text-zinc-900 dark:text-white" />
                <span>11. Contact & Data Inquiries</span>
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If you have questions regarding this Privacy Policy, wish to exercise your data rights, or have security inquiries, please contact our team:
              </p>
              <div className="text-xs space-y-1 font-mono text-zinc-800 dark:text-zinc-200">
                <p>Email: <a href="mailto:support@foclyra.com" className="underline font-semibold">support@foclyra.com</a> (or <a href="mailto:sameedsiddiqui9@gmail.com" className="underline">sameedsiddiqui9@gmail.com</a>)</p>
                <p>Project Repository: <a href="https://github.com/ssiddiquiii/foclyra" target="_blank" rel="noopener noreferrer" className="underline">github.com/ssiddiquiii/foclyra</a></p>
                <p>Response Time: Within 48 hours for data subject inquiries.</p>
              </div>
            </section>

          </article>
        </div>

        {/* Bottom Footer Callout */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Foclyra. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-zinc-950 dark:hover:text-white transition underline">
              Terms of Service
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
