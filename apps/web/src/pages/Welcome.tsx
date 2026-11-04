import { Button } from "@rakazo/ui-web";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  FileText,
  Folder,
  Globe,
  LockKeyhole,
  Menu,
  MessageSquare,
  Monitor,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WindowChrome } from "./WindowChrome";
import "./welcome.css";

const coworkers = [
  {
    id: "chief",
    name: "Chief of Staff",
    short: "Chief",
    job: "A clear plan. A team in sync.",
    description:
      "Turns your brief into a plan and brings the right coworkers into the conversation.",
    message:
      "I’ll coordinate the launch. Engineer, take the page. Creative, prepare the artwork. Growth, bring it together for review.",
    file: "Launch plan",
    icon: FileText,
  },
  {
    id: "engineer",
    name: "Staff Engineer",
    short: "Engineer",
    job: "From a bug to a better build.",
    description:
      "Builds pages, investigates broken code, and prepares pull requests for your approval.",
    message:
      "The landing page is ready. I’ve checked the interaction and prepared the changes for your review.",
    file: "Landing page",
    icon: Globe,
  },
  {
    id: "creative",
    name: "Creative Director",
    short: "Creative",
    job: "Your idea, made tangible.",
    description:
      "Works from your brief and product footage to create artwork the whole team can use.",
    message:
      "The product cutout and campaign artwork are saved. Engineer and Growth can use the same assets.",
    file: "Campaign artwork",
    icon: Folder,
  },
  {
    id: "growth",
    name: "Meta Growth Operator",
    short: "Growth",
    job: "A launch you’re ready to share.",
    description: "Prepares campaign content and bilingual social drafts, ready for a human review.",
    message:
      "Six draft candidates are ready: Instagram, Facebook and Threads, in English and Hindi. Waiting for your review.",
    file: "Marketing drafts",
    icon: MessageSquare,
  },
] as const;

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a
      href="#top"
      className={`muse-brand${footer ? " muse-brand-footer" : ""}`}
      aria-label="MuseOrg home"
    >
      <img src="/icon-192.png" width="32" height="32" alt="" />
      <span>MuseOrg</span>
    </a>
  );
}

export function WelcomePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const coworker = coworkers[selected] ?? coworkers[0];
  const ArtifactIcon = coworker.icon;
  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="muse-landing" data-theme="light" data-rakazo-surface="welcome" id="top">
      <a className="muse-skip" href="#main">
        Skip to content
      </a>
      <div className="muse-window-chrome app-drag">
        <WindowChrome />
      </div>
      <header className="muse-header">
        <Brand />
        <nav className="muse-desktop-nav" aria-label="Main navigation">
          <a href="#workspace">How it works</a>
          <a href="#team">The team</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="muse-header-actions">
          <Link to="/sign-in" className="muse-sign-in">
            Sign in
          </Link>
          <Button className="muse-button muse-nav-cta" onClick={() => navigate("/sign-up")}>
            Get started <ArrowRight aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="muse-menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="muse-mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <nav id="muse-mobile-menu" className="muse-mobile-menu" aria-label="Mobile navigation">
            <a href="#workspace" onClick={closeMenu}>
              How it works
            </a>
            <a href="#team" onClick={closeMenu}>
              The team
            </a>
            <a href="#questions" onClick={closeMenu}>
              Questions
            </a>
          </nav>
        )}
      </header>

      <main id="main">
        <section className="muse-hero" aria-labelledby="muse-headline">
          <a href="#access" className="muse-beta">
            <span /> A new way to work <ArrowRight size={13} aria-hidden="true" />
          </a>
          <h1 id="muse-headline">
            Meet your
            <br />
            <span>new AI team.</span>
          </h1>
          <p>
            Good ideas deserve a great team. Hire AI coworkers
            <br className="muse-desktop-break" /> that share a computer and move the work forward.
          </p>
          <div className="muse-hero-actions">
            <Button className="muse-button" onClick={() => navigate("/sign-up")}>
              Build your team <ArrowRight aria-hidden="true" />
            </Button>
            <a href="#workspace" className="muse-text-action">
              See how it works <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
          <span className="muse-hero-note">Invite-only beta. Built with Meta.</span>
        </section>

        <section
          className="muse-workspace-section muse-container"
          id="workspace"
          aria-label="Example shared workspace"
        >
          <div className="muse-workspace-caption">
            <span>
              <span className="muse-small-mark" aria-hidden="true">
                m
              </span>{" "}
              One workspace. A whole team.
            </span>
            <span>Example workspace</span>
          </div>
          <div className="muse-workspace">
            <aside className="muse-preview-sidebar" aria-label="Preview coworkers">
              <div className="muse-sidebar-label">
                <span>Your team</span>
                <Plus size={15} aria-hidden="true" />
              </div>
              {coworkers.map((bot, index) => (
                <button
                  key={bot.id}
                  className={`muse-coworker-tab${index === selected ? " is-selected" : ""}`}
                  type="button"
                  aria-pressed={index === selected}
                  onClick={() => setSelected(index)}
                >
                  <img src={`/landing/${bot.id}.webp`} width="43" height="43" alt="" />
                  <span>
                    <strong>{bot.short}</strong>
                    <small>{bot.name}</small>
                  </span>
                  {index === selected && <span className="muse-current-dot" aria-hidden="true" />}
                </button>
              ))}
              <div className="muse-shared-computer">
                <Monitor size={16} aria-hidden="true" />
                <span>Shared computer</span>
                <LockKeyhole size={12} aria-hidden="true" />
              </div>
            </aside>
            <div className="muse-preview-thread">
              <div className="muse-thread-heading">
                <span>
                  <img src={`/landing/${coworker.id}.webp`} width="28" height="28" alt="" />
                  {coworker.name}
                </span>
                <Monitor size={16} aria-hidden="true" />
              </div>
              <div className="muse-conversation" aria-live="polite">
                <div className="muse-thread-date">A little teamwork goes a long way</div>
                <div className="muse-user-message">Let’s get this product ready to launch.</div>
                <div className="muse-bot-message">
                  <img src={`/landing/${coworker.id}.webp`} width="36" height="36" alt="" />
                  <div>
                    <span className="muse-message-author">{coworker.short}</span>
                    <p>{coworker.message}</p>
                    <div className="muse-file-chip">
                      <ArtifactIcon size={17} aria-hidden="true" />
                      <span>{coworker.file}</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </div>
                  </div>
                </div>
                <div className="muse-handoff">
                  <CheckCheck size={14} aria-hidden="true" /> Shared with the team
                </div>
              </div>
              <div className="muse-preview-composer">
                <Plus size={16} aria-hidden="true" />
                <span>Message {coworker.short}…</span>
                <span className="muse-preview-send">
                  <ArrowRight size={15} aria-hidden="true" />
                </span>
              </div>
            </div>
            <aside className="muse-project-preview" aria-label="Example project outputs">
              <div className="muse-project-label">
                <Folder size={14} aria-hidden="true" /> Launch project
              </div>
              <div className="muse-mini-site">
                <div className="muse-mini-site-nav">
                  <span>FIELDNOTES</span>
                  <span>↗</span>
                </div>
                <div className="muse-mini-site-copy">
                  <span>MADE FOR WHAT’S NEXT</span>
                  <h3>
                    A little less
                    <br />
                    ordinary.
                  </h3>
                  <div className="muse-paper-object" aria-hidden="true">
                    <span>
                      field
                      <br />
                      notes.
                    </span>
                  </div>
                  <span className="muse-mini-site-link">
                    Find your next idea <ArrowRight size={10} aria-hidden="true" />
                  </span>
                </div>
              </div>
              <div className="muse-output-row">
                <Globe size={14} aria-hidden="true" />
                <span>Landing page</span>
                <Check size={13} aria-hidden="true" />
              </div>
              <div className="muse-output-row">
                <Folder size={14} aria-hidden="true" />
                <span>Campaign artwork</span>
                <Check size={13} aria-hidden="true" />
              </div>
              <div className="muse-output-row">
                <MessageSquare size={14} aria-hidden="true" />
                <span>Social drafts</span>
                <span className="muse-review-label">For review</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="muse-team muse-container" id="team" aria-labelledby="muse-team-title">
          <div className="muse-section-heading">
            <span className="muse-eyebrow">A role for every kind of work</span>
            <h2 id="muse-team-title">
              Small team.
              <br />
              Big possibilities.
            </h2>
            <p>
              Start with four specialists.
              <br />
              Make the team your own.
            </p>
          </div>
          <div className="muse-roster">
            {coworkers.map((bot, index) => (
              <article className="muse-role-card" key={bot.id}>
                <div className="muse-role-art">
                  <img
                    src={`/landing/${bot.id}.webp`}
                    width="256"
                    height="256"
                    loading="lazy"
                    alt={`${bot.name} coworker character`}
                  />
                </div>
                <h3>{bot.name}</h3>
                <span className="muse-role-job">{bot.job}</span>
                <p>{bot.description}</p>
                <a
                  href="#workspace"
                  onClick={() => setSelected(index)}
                  aria-label={`Preview ${bot.name}`}
                >
                  Meet {bot.short} <ArrowRight size={15} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="muse-together muse-container" aria-labelledby="muse-together-title">
          <div className="muse-editorial-copy">
            <span className="muse-eyebrow">Less passing things around</span>
            <h2 id="muse-together-title">
              One brief.
              <br />
              Shared momentum.
            </h2>
            <p>
              Your coworkers share files, context, and a persistent computer. When the brief
              changes, the team can pick it up together.
            </p>
            <a href="/sign-up" className="muse-inline-link">
              Give them something to work on <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div
            className="muse-handoff-illustration"
            aria-label="Illustration of coworkers sharing a project"
          >
            <div className="muse-shared-file">
              <Folder size={26} aria-hidden="true" />
              <span>
                Product launch<strong>One shared project</strong>
              </span>
              <span className="muse-file-count">4 coworkers</span>
            </div>
            <div className="muse-sharing-note">
              <img src="/landing/chief.webp" width="38" height="38" alt="" />
              <div>
                <strong>Chief</strong>
                <p>A new headline. I’ll bring the team up to speed.</p>
              </div>
            </div>
            <div className="muse-shared-assets">
              <span>
                <Globe size={16} aria-hidden="true" /> Page
              </span>
              <span>
                <Folder size={16} aria-hidden="true" /> Artwork
              </span>
              <span>
                <FileText size={16} aria-hidden="true" /> Drafts
              </span>
            </div>
          </div>
        </section>

        <section className="muse-approval muse-container" aria-labelledby="muse-control-title">
          <div className="muse-approval-illustration">
            <div className="muse-approval-icon">
              <CheckCheck size={28} aria-hidden="true" />
            </div>
            <span className="muse-eyebrow">Ready for your review</span>
            <h3>
              The work moves.
              <br />
              You make the call.
            </h3>
            <div className="muse-approval-footer">
              <span>
                <LockKeyhole size={14} aria-hidden="true" /> Owner approval
              </span>
              <span className="muse-draft-tag">Draft</span>
            </div>
          </div>
          <div className="muse-editorial-copy">
            <span className="muse-eyebrow">Always your team</span>
            <h2 id="muse-control-title">
              A helping hand.
              <br />
              You’re still in charge.
            </h2>
            <p>
              Review the drafts. Approve important changes. Connect the tools you want your team to
              use, and decide who gets access.
            </p>
          </div>
        </section>

        <section
          className="muse-faq muse-container"
          id="questions"
          aria-labelledby="muse-faq-title"
        >
          <h2 id="muse-faq-title">A few good questions.</h2>
          <div className="muse-faq-list">
            <details>
              <summary>
                What is MuseOrg?
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>
                A workspace for AI coworkers with their own responsibilities and chats. They share a
                persistent computer and can hand off work, files, and context.
              </p>
            </details>
            <details>
              <summary>
                How do I get access?
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>
                Create an account, then enter your invite code to unlock the beta and hire your
                team.
              </p>
            </details>
            <details>
              <summary>
                Do I need my own model API key?
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>
                The invite-only beta includes access to our configured Meta models. You can get
                started without a personal model API key.
              </p>
            </details>
            <details>
              <summary>
                What can the team do with my connected accounts?
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>
                That depends on the tools and permissions you connect. Our marketing demo prepares
                drafts for review; publishing, sending messages, and activating ads need separate
                authorization.
              </p>
            </details>
          </div>
        </section>

        <section className="muse-final-cta muse-container" id="access">
          <div className="muse-final-mascots" aria-hidden="true">
            {coworkers.map((bot) => (
              <img
                src={`/landing/${bot.id}.webp`}
                width="80"
                height="80"
                loading="lazy"
                alt=""
                key={bot.id}
              />
            ))}
          </div>
          <span className="muse-eyebrow">Your next chapter, together</span>
          <h2>
            Good work
            <br />
            starts with a team.
          </h2>
          <Button className="muse-button" onClick={() => navigate("/sign-up")}>
            Get started <ArrowRight aria-hidden="true" />
          </Button>
          <p>Have an invite? Your team is waiting.</p>
        </section>
      </main>
      <footer className="muse-footer muse-container">
        <Brand footer />
        <span>Built for the Meta AI hackathon.</span>
        <a href="https://github.com/ayushdevani01/MuseOrg" target="_blank" rel="noreferrer">
          <FileText size={16} aria-hidden="true" /> Source code{" "}
          <ArrowRight size={13} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
