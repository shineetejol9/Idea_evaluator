import { useState, useEffect, useRef, useCallback } from "react";

/* ── Google Fonts ─────────────────────────────────────────────── */
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";

/* ── CSS ──────────────────────────────────────────────────────── */
const css = `
@import url('${FONT_URL}');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --c-void: #05050f; --c-deep: #080818;
  --c-surface: rgba(12,12,30,0.72);
  --c-glass: rgba(255,255,255,0.04);
  --c-glass-h: rgba(255,255,255,0.08);
  --c-border: rgba(255,255,255,0.08);
  --c-border-h: rgba(139,92,246,0.45);
  --g-neon: linear-gradient(90deg,#a855f7,#6366f1,#06b6d4);
  --g-text: linear-gradient(135deg,#e879f9 0%,#818cf8 40%,#38bdf8 80%);
  --glow-nav: 0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.08);
  --font-ui: 'Sora', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --nav-h: 68px;
  --r-sm: 8px; --r-md: 12px; --r-lg: 18px; --r-pill: 999px;
}
html { scroll-behavior: smooth; }
body { font-family: var(--font-ui); background: var(--c-void); color: #e2e8f0; min-height: 100vh; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

/* AURORA */
.aurora-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.aurora-bg::before, .aurora-bg::after { content:''; position:absolute; border-radius:50%; filter:blur(120px); opacity:0.12; }
.aurora-bg::before { width:800px; height:800px; background:radial-gradient(circle,#7c3aed,transparent 70%); top:-200px; left:-100px; animation:af1 14s ease-in-out infinite; }
.aurora-bg::after { width:700px; height:700px; background:radial-gradient(circle,#06b6d4,transparent 70%); bottom:-200px; right:-100px; animation:af2 18s ease-in-out infinite; }
.aurora-mid { position:absolute; width:600px; height:600px; background:radial-gradient(circle,#a855f7,transparent 70%); border-radius:50%; filter:blur(100px); opacity:0.08; top:50%; left:50%; transform:translate(-50%,-50%); animation:af3 22s ease-in-out infinite; }
@keyframes af1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,40px) scale(1.1)} 66%{transform:translate(-40px,80px) scale(0.95)} }
@keyframes af2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,-50px) scale(1.15)} 66%{transform:translate(40px,-30px) scale(0.9)} }
@keyframes af3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.3)} }

.grid-overlay { position:fixed; inset:0; z-index:0; pointer-events:none; background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px); background-size:48px 48px; mask-image:radial-gradient(ellipse at 50% 0%,black 30%,transparent 80%); }

.particles-wrap { position:fixed; inset:0; z-index:1; pointer-events:none; overflow:hidden; }
.particle { position:absolute; border-radius:50%; animation:pdrift linear infinite; }
@keyframes pdrift { 0%{transform:translateY(100vh) rotate(0deg);opacity:0} 10%{opacity:1} 90%{opacity:0.6} 100%{transform:translateY(-10vh) rotate(720deg);opacity:0} }

.sparkle-canvas { position:fixed; top:0; left:0; width:100%; height:var(--nav-h); pointer-events:none; z-index:101; }


/* LOGO */
.logo { display:flex; align-items:center; gap:10px; flex-shrink:0; text-decoration:none; animation:lfloat 6s ease-in-out infinite; }
@keyframes lfloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
.logo-icon { width:36px; height:36px; border-radius:10px; background:var(--c-glass); border:1px solid rgba(168,85,247,0.4); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; flex-shrink:0; box-shadow:0 0 16px rgba(168,85,247,0.3),inset 0 1px 0 rgba(255,255,255,0.1); transition:box-shadow 0.3s,transform 0.3s; }
.logo-icon::before { content:''; position:absolute; inset:-50%; background:conic-gradient(from 0deg,#a855f7,#6366f1,#06b6d4,#a855f7); animation:ispin 4s linear infinite; opacity:0.5; }
.logo-icon::after { content:''; position:absolute; inset:2px; background:#0d0d20; border-radius:8px; }
.logo-icon svg { position:relative; z-index:1; }
@keyframes ispin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.logo:hover .logo-icon { box-shadow:0 0 28px rgba(168,85,247,0.6),inset 0 1px 0 rgba(255,255,255,0.15); transform:scale(1.05); }
.logo-text { font-family:var(--font-ui); font-size:15px; font-weight:700; background:var(--g-text); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:tshimmer 4s linear infinite; white-space:nowrap; letter-spacing:-0.2px; }
@keyframes tshimmer { 0%{background-position:0% center} 100%{background-position:200% center} }

/* NAV LINKS */
.nav-links { display:flex; align-items:center; gap:2px; flex:1; justify-content:center; }
.nav-link { position:relative; font-size:13px; font-weight:500; color:rgba(148,163,184,0.9); padding:8px 15px; border-radius:var(--r-sm); border:none; background:none; cursor:pointer; font-family:var(--font-ui); transition:color 0.25s; white-space:nowrap; outline:none; }
.nav-link::before { content:''; position:absolute; inset:0; border-radius:var(--r-sm); background:var(--c-glass); border:1px solid transparent; opacity:0; transition:opacity 0.25s,border-color 0.25s; }
.nav-link::after { content:''; position:absolute; bottom:3px; left:50%; transform:translateX(-50%) scaleX(0); width:70%; height:1.5px; background:var(--g-neon); border-radius:2px; transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1); filter:blur(0.5px); }
.nav-link:hover { color:#e2e8f0; }
.nav-link:hover::before { opacity:1; border-color:var(--c-border-h); }
.nav-link:hover::after { transform:translateX(-50%) scaleX(1); }
.nav-link.active { color:#f0f4ff; font-weight:600; }
.nav-link.active::before { opacity:1; background:rgba(99,102,241,0.12); border-color:rgba(139,92,246,0.3); box-shadow:inset 0 1px 0 rgba(255,255,255,0.06),0 0 12px rgba(99,102,241,0.15); }
.nav-link.active::after { transform:translateX(-50%) scaleX(1); background:var(--g-neon); filter:drop-shadow(0 0 4px rgba(99,102,241,0.8)); }
.nav-link.cta { color:#c4b5fd; padding:8px 16px; }
.nav-link.cta::before { opacity:1; background:rgba(139,92,246,0.1); border-color:rgba(139,92,246,0.25); }
.nav-link.cta:hover { color:#fff; }
.nav-link.cta:hover::before { background:rgba(139,92,246,0.2); border-color:rgba(168,85,247,0.5); box-shadow:0 0 20px rgba(168,85,247,0.2),inset 0 1px 0 rgba(255,255,255,0.08); }
.nav-link.cta.active { color:#fff; }
.nav-link.cta.active::before { background:rgba(139,92,246,0.18); border-color:rgba(168,85,247,0.45); box-shadow:0 0 24px rgba(168,85,247,0.25),inset 0 1px 0 rgba(255,255,255,0.1); }

/* RIGHT */
.nav-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.icon-btn { position:relative; width:38px; height:38px; border-radius:var(--r-sm); background:var(--c-glass); border:1px solid var(--c-border); display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(148,163,184,0.8); transition:all 0.25s; }
.icon-btn:hover { background:var(--c-glass-h); border-color:rgba(168,85,247,0.4); color:#e2e8f0; box-shadow:0 0 16px rgba(168,85,247,0.2); transform:translateY(-1px); }
.notif-dot { position:absolute; top:8px; right:8px; width:7px; height:7px; background:radial-gradient(circle,#f472b6,#a855f7); border-radius:50%; border:1.5px solid var(--c-deep); animation:npulse 2.4s ease infinite; }
@keyframes npulse { 0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(244,114,182,0.6)} 50%{transform:scale(1.1);box-shadow:0 0 0 5px rgba(244,114,182,0)} }
.sparkle-icon { animation:sspin 8s linear infinite; }
@keyframes sspin { 0%,100%{transform:rotate(0deg) scale(1);filter:drop-shadow(0 0 4px rgba(168,85,247,0.7))} 25%{transform:rotate(15deg) scale(1.1);filter:drop-shadow(0 0 8px rgba(6,182,212,0.9))} 50%{transform:rotate(0deg) scale(1);filter:drop-shadow(0 0 4px rgba(244,114,182,0.7))} 75%{transform:rotate(-15deg) scale(1.1);filter:drop-shadow(0 0 8px rgba(99,102,241,0.9))} }

.profile-wrap { position:relative; }
.avatar-btn { display:flex; align-items:center; gap:8px; padding:4px 10px 4px 4px; background:var(--c-glass); border:1px solid var(--c-border); border-radius:var(--r-pill); cursor:pointer; transition:all 0.25s; font-family:var(--font-ui); }
.avatar-btn:hover { background:var(--c-glass-h); border-color:rgba(168,85,247,0.4); box-shadow:0 0 20px rgba(168,85,247,0.15); }
.avatar-ring { width:30px; height:30px; border-radius:50%; padding:2px; background:conic-gradient(from 0deg,#a855f7,#6366f1,#06b6d4,#a855f7); animation:rring 4s linear infinite; flex-shrink:0; }
@keyframes rring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.avatar-inner { width:100%; height:100%; border-radius:50%; background:linear-gradient(135deg,#4c1d95,#1e1b4b); display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700; color:#c4b5fd; font-family:var(--font-mono); letter-spacing:0.5px; }
.avatar-name { font-size:12.5px; font-weight:500; color:rgba(226,232,240,0.85); white-space:nowrap; }
.avatar-chevron { color:rgba(148,163,184,0.6); display:flex; align-items:center; transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),color 0.2s; }
.avatar-chevron.open { transform:rotate(180deg); color:#a855f7; }

.dropdown { position:absolute; top:calc(100% + 12px); right:0; width:230px; background:rgba(10,10,28,0.92); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(139,92,246,0.2); border-radius:var(--r-lg); overflow:hidden; opacity:0; transform:translateY(-10px) scale(0.96); pointer-events:none; transition:opacity 0.25s,transform 0.28s cubic-bezier(0.34,1.56,0.64,1); transform-origin:top right; box-shadow:0 24px 60px rgba(0,0,0,0.7),0 0 40px rgba(139,92,246,0.1); }
.dropdown.open { opacity:1; transform:translateY(0) scale(1); pointer-events:all; }
.dropdown::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:var(--g-neon); opacity:0.5; }
.dd-header { padding:16px 16px 14px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(139,92,246,0.05); }
.dd-avatar-row { display:flex; align-items:center; gap:10px; }
.dd-avatar-lg { width:40px; height:40px; border-radius:50%; padding:2px; background:conic-gradient(from 0deg,#a855f7,#6366f1,#06b6d4,#a855f7); animation:rring 4s linear infinite; flex-shrink:0; }
.dd-avatar-core { width:100%; height:100%; border-radius:50%; background:linear-gradient(135deg,#4c1d95,#1e1b4b); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#c4b5fd; font-family:var(--font-mono); }
.dd-name { font-size:13.5px; font-weight:600; color:#f0f4ff; }
.dd-email { font-size:11px; color:rgba(148,163,184,0.7); margin-top:2px; }
.dd-badge { display:inline-flex; align-items:center; gap:4px; margin-top:8px; padding:2px 9px; background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); color:#c4b5fd; font-size:10px; font-weight:600; border-radius:20px; letter-spacing:0.5px; text-transform:uppercase; font-family:var(--font-mono); }
.dd-section { padding:8px; }
.dd-item { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:var(--r-sm); font-size:13px; font-weight:500; color:rgba(148,163,184,0.85); cursor:pointer; transition:all 0.18s; border:none; background:none; width:100%; font-family:var(--font-ui); text-align:left; position:relative; overflow:hidden; }
.dd-item::before { content:''; position:absolute; inset:0; border-radius:var(--r-sm); background:rgba(139,92,246,0.06); opacity:0; transition:opacity 0.18s; }
.dd-item:hover { color:#e2e8f0; }
.dd-item:hover::before { opacity:1; }
.dd-item:hover svg { filter:drop-shadow(0 0 4px rgba(168,85,247,0.6)); color:#a855f7; }
.dd-item.danger { color:rgba(248,113,113,0.8); }
.dd-item.danger:hover { color:#fca5a5; }
.dd-item.danger:hover::before { background:rgba(239,68,68,0.08); }
.dd-item.danger:hover svg { filter:drop-shadow(0 0 4px rgba(239,68,68,0.5)); color:#f87171; }
.dd-item svg { flex-shrink:0; transition:color 0.18s,filter 0.18s; }
.dd-sep { height:1px; background:rgba(255,255,255,0.05); margin:4px 8px; }

.hamburger { display:none; flex-direction:column; justify-content:center; align-items:center; gap:5px; width:38px; height:38px; border-radius:var(--r-sm); background:var(--c-glass); border:1px solid var(--c-border); cursor:pointer; transition:all 0.25s; }
.hamburger:hover { background:var(--c-glass-h); border-color:rgba(168,85,247,0.4); box-shadow:0 0 16px rgba(168,85,247,0.15); }
.ham-line { width:16px; height:1.5px; border-radius:2px; transition:all 0.28s cubic-bezier(0.34,1.56,0.64,1); transform-origin:center; }
.ham-line:nth-child(1) { background:linear-gradient(90deg,#a855f7,#6366f1); }
.ham-line:nth-child(2) { background:linear-gradient(90deg,#6366f1,#06b6d4); }
.ham-line:nth-child(3) { background:linear-gradient(90deg,#06b6d4,#a855f7); width:10px; }

.mobile-drawer { position:fixed; top:calc(var(--nav-h) + 18px); left:16px; right:16px; background:rgba(8,8,24,0.95); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(139,92,246,0.2); border-radius:var(--r-lg); padding:10px; display:flex; flex-direction:column; gap:3px; opacity:0; transform:translateY(-12px) scale(0.98); pointer-events:none; transition:opacity 0.25s,transform 0.3s cubic-bezier(0.34,1.56,0.64,1); z-index:99; box-shadow:0 24px 60px rgba(0,0,0,0.6),0 0 40px rgba(99,102,241,0.08); overflow:hidden; }
.mobile-drawer::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:var(--g-neon); opacity:0.5; }
.mobile-drawer.open { opacity:1; transform:translateY(0) scale(1); pointer-events:all; }
.mob-link { font-size:13.5px; font-weight:500; color:rgba(148,163,184,0.85); padding:11px 14px; border-radius:var(--r-sm); cursor:pointer; border:none; background:none; font-family:var(--font-ui); text-align:left; width:100%; transition:all 0.2s; position:relative; }
.mob-link::after { content:''; position:absolute; inset:0; border-radius:var(--r-sm); background:rgba(139,92,246,0.08); opacity:0; transition:opacity 0.2s; }
.mob-link:hover { color:#e2e8f0; }
.mob-link:hover::after { opacity:1; }
.mob-link.active { color:#c4b5fd; font-weight:600; }
.mob-link.active::after { opacity:1; background:rgba(139,92,246,0.12); }
.mob-link.cta { color:#a78bfa; }
.mob-link.cta.active, .mob-link.cta:hover { color:#fff; }
.mob-link.cta.active::after, .mob-link.cta:hover::after { background:rgba(139,92,246,0.18); }

/* PAGE */
.page-content { position:relative; z-index:2; max-width:920px; margin:0 auto; padding:72px 32px 100px; }
.hero-chip { display:inline-flex; align-items:center; gap:8px; padding:5px 14px; background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.25); border-radius:var(--r-pill); font-size:11.5px; font-weight:600; color:#a78bfa; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:24px; font-family:var(--font-mono); }
.chip-dot { width:6px; height:6px; border-radius:50%; background:radial-gradient(circle,#a855f7,#6366f1); animation:npulse 2s ease infinite; }
.hero-title { font-size:clamp(32px,5.5vw,54px); font-weight:800; line-height:1.1; letter-spacing:-2px; color:#f0f4ff; margin-bottom:20px; max-width:680px; }
.hero-title .grad { background:var(--g-text); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:tshimmer 4s linear infinite; }
.hero-sub { font-size:16px; color:rgba(148,163,184,0.8); line-height:1.8; max-width:520px; margin-bottom:36px; }
.hero-btns { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:64px; }
.btn-glow { display:inline-flex; align-items:center; gap:8px; padding:12px 24px; border-radius:var(--r-md); font-size:14px; font-weight:600; letter-spacing:-0.1px; font-family:var(--font-ui); cursor:pointer; border:none; transition:all 0.25s; text-decoration:none; position:relative; overflow:hidden; }
.btn-glow::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.08),transparent); border-radius:inherit; opacity:0; transition:opacity 0.2s; }
.btn-glow:hover::before { opacity:1; }
.btn-primary-glow { background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff; box-shadow:0 0 20px rgba(124,58,237,0.4),inset 0 1px 0 rgba(255,255,255,0.15); }
.btn-primary-glow:hover { transform:translateY(-2px); box-shadow:0 0 32px rgba(124,58,237,0.6),inset 0 1px 0 rgba(255,255,255,0.2); }
.btn-ghost-glow { background:var(--c-glass); color:rgba(226,232,240,0.8); border:1px solid var(--c-border); }
.btn-ghost-glow:hover { background:var(--c-glass-h); color:#e2e8f0; border-color:rgba(139,92,246,0.35); box-shadow:0 0 16px rgba(139,92,246,0.1); }
.stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.stat-card { background:rgba(10,10,28,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:var(--r-lg); padding:24px; position:relative; overflow:hidden; transition:all 0.3s; cursor:default; }
.stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; opacity:0; transition:opacity 0.3s; }
.stat-card:nth-child(1)::before { background:linear-gradient(90deg,transparent,#a855f7,transparent); }
.stat-card:nth-child(2)::before { background:linear-gradient(90deg,transparent,#06b6d4,transparent); }
.stat-card:nth-child(3)::before { background:linear-gradient(90deg,transparent,#f472b6,transparent); }
.stat-card:hover { border-color:rgba(139,92,246,0.2); transform:translateY(-3px); }
.stat-card:hover::before { opacity:1; }
.stat-icon-wrap { width:38px; height:38px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
.stat-val { font-size:30px; font-weight:800; letter-spacing:-1.5px; line-height:1; background:var(--g-text); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:tshimmer 5s linear infinite; margin-bottom:5px; }
.stat-lbl { font-size:12.5px; color:rgba(148,163,184,0.65); font-weight:400; }
.stat-tag { display:inline-flex; align-items:center; gap:3px; margin-top:10px; font-size:11px; font-weight:600; color:#34d399; background:rgba(52,211,153,0.1); padding:2px 8px; border-radius:12px; font-family:var(--font-mono); }

/* ── CHAT OVERLAY ── */
.chat-overlay { position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(2,2,14,0.85); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); opacity:0; pointer-events:none; transition:opacity 0.35s ease; }
.chat-overlay.visible { opacity:1; pointer-events:all; }
.chat-panel { position:relative; width:100%; max-width:820px; height:min(700px,88vh); background:rgba(8,8,22,0.97); border:1px solid rgba(139,92,246,0.25); border-radius:24px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 0 0 1px rgba(255,255,255,0.04),0 32px 80px rgba(0,0,0,0.8),0 0 80px rgba(99,102,241,0.12); transform:translateY(24px) scale(0.97); transition:transform 0.38s cubic-bezier(0.34,1.56,0.64,1); }
.chat-overlay.visible .chat-panel { transform:translateY(0) scale(1); }

.chat-topbar { position:relative; display:flex; align-items:center; justify-content:space-between; padding:0 20px; height:58px; flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(139,92,246,0.04); overflow:hidden; }
.chat-topbar::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:var(--g-neon); opacity:0.5; animation:bflow 4s linear infinite; background-size:200% 100%; }
.chat-topbar-left { display:flex; align-items:center; gap:12px; }
.chat-ai-orb { width:34px; height:34px; border-radius:50%; flex-shrink:0; padding:2px; background:conic-gradient(from 0deg,#a855f7,#6366f1,#06b6d4,#a855f7); animation:rring 3s linear infinite; }
.chat-ai-orb-inner { width:100%; height:100%; border-radius:50%; background:linear-gradient(135deg,#1e1040,#0d0d20); display:flex; align-items:center; justify-content:center; }
.chat-title { font-size:14px; font-weight:700; color:#f0f4ff; letter-spacing:-0.3px; }
.chat-subtitle { font-size:11px; color:rgba(148,163,184,0.6); margin-top:1px; font-family:var(--font-mono); }
.chat-status { display:flex; align-items:center; gap:6px; font-size:11px; color:#34d399; font-family:var(--font-mono); font-weight:500; }
.chat-status-dot { width:6px; height:6px; border-radius:50%; background:#34d399; animation:npulse 2s ease infinite; }
.chat-close { width:32px; height:32px; border-radius:8px; background:var(--c-glass); border:1px solid var(--c-border); display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(148,163,184,0.7); transition:all 0.2s; flex-shrink:0; }
.chat-close:hover { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.3); color:#f87171; }

.chat-messages { flex:1; overflow-y:auto; padding:24px 20px; display:flex; flex-direction:column; gap:16px; scroll-behavior:smooth; }
.chat-messages::-webkit-scrollbar { width:4px; }
.chat-messages::-webkit-scrollbar-track { background:transparent; }
.chat-messages::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:4px; }

.msg { display:flex; gap:12px; animation:msgin 0.3s cubic-bezier(0.34,1.2,0.64,1); }
@keyframes msgin { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.msg.user { flex-direction:row-reverse; }
.msg-avatar { width:32px; height:32px; border-radius:50%; flex-shrink:0; margin-top:2px; }
.msg-avatar.ai { padding:2px; background:conic-gradient(from 0deg,#a855f7,#6366f1,#06b6d4,#a855f7); animation:rring 4s linear infinite; }
.msg-avatar-inner { width:100%; height:100%; border-radius:50%; background:linear-gradient(135deg,#1e1040,#0d0d20); display:flex; align-items:center; justify-content:center; font-size:10px; }
.msg-avatar.user-av { background:linear-gradient(135deg,#4c1d95,#1e1b4b); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#c4b5fd; font-family:var(--font-mono); border:1px solid rgba(168,85,247,0.3); }

.msg-body { max-width:72%; display:flex; flex-direction:column; gap:4px; }
.msg.user .msg-body { align-items:flex-end; }
.msg-bubble { padding:12px 16px; border-radius:16px; font-size:13.5px; line-height:1.65; font-weight:400; }
.msg.ai .msg-bubble { background:rgba(99,102,241,0.08); border:1px solid rgba(139,92,246,0.18); color:rgba(226,232,240,0.92); border-bottom-left-radius:4px; }
.msg.user .msg-bubble { background:linear-gradient(135deg,rgba(124,58,237,0.35),rgba(79,70,229,0.35)); border:1px solid rgba(139,92,246,0.3); color:#f0f4ff; border-bottom-right-radius:4px; }
.msg-time { font-size:10px; color:rgba(148,163,184,0.4); font-family:var(--font-mono); padding:0 4px; }

.score-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:12px; }
.score-card { background:rgba(99,102,241,0.08); border:1px solid rgba(139,92,246,0.2); border-radius:10px; padding:10px 12px; text-align:center; }
.score-val { font-size:22px; font-weight:800; letter-spacing:-1px; background:var(--g-text); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:tshimmer 4s linear infinite; }
.score-lbl { font-size:10px; color:rgba(148,163,184,0.6); margin-top:3px; font-family:var(--font-mono); text-transform:uppercase; letter-spacing:0.5px; }

.score-bar-wrap { margin-top:6px; }
.score-bar-label { display:flex; justify-content:space-between; font-size:11px; color:rgba(148,163,184,0.7); margin-bottom:4px; font-family:var(--font-mono); }
.score-bar-track { height:4px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; }
.score-bar-fill { height:100%; border-radius:4px; transition:width 1.2s cubic-bezier(0.34,1.56,0.64,1); }

.typing-dots { display:flex; gap:4px; padding:14px 16px; background:rgba(99,102,241,0.08); border:1px solid rgba(139,92,246,0.18); border-radius:16px; border-bottom-left-radius:4px; width:fit-content; }
.typing-dots span { width:6px; height:6px; border-radius:50%; background:rgba(168,85,247,0.7); animation:tbounce 1.2s ease infinite; }
.typing-dots span:nth-child(2) { animation-delay:0.2s; }
.typing-dots span:nth-child(3) { animation-delay:0.4s; }
@keyframes tbounce { 0%,100%{transform:translateY(0);opacity:0.5} 50%{transform:translateY(-5px);opacity:1} }

.prompt-chips { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
.prompt-chip { padding:6px 12px; border-radius:var(--r-pill); background:rgba(99,102,241,0.08); border:1px solid rgba(139,92,246,0.22); font-size:11.5px; color:#a78bfa; cursor:pointer; font-family:var(--font-ui); transition:all 0.2s; font-weight:500; }
.prompt-chip:hover { background:rgba(99,102,241,0.16); border-color:rgba(168,85,247,0.4); color:#c4b5fd; transform:translateY(-1px); box-shadow:0 0 12px rgba(99,102,241,0.15); }

.chat-input-area { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.06); background:rgba(139,92,246,0.03); flex-shrink:0; }
.chat-input-row { display:flex; gap:10px; align-items:flex-end; }
.chat-input-wrap { flex:1; position:relative; }
.chat-input { width:100%; min-height:44px; max-height:120px; background:rgba(255,255,255,0.04); border:1px solid rgba(139,92,246,0.2); border-radius:12px; padding:11px 14px; font-size:13.5px; font-family:var(--font-ui); color:#e2e8f0; resize:none; outline:none; transition:border-color 0.2s,box-shadow 0.2s; line-height:1.5; }
.chat-input::placeholder { color:rgba(148,163,184,0.4); }
.chat-input:focus { border-color:rgba(168,85,247,0.45); box-shadow:0 0 0 3px rgba(168,85,247,0.08),0 0 20px rgba(168,85,247,0.08); }
.chat-send { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#7c3aed,#4f46e5); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 0.2s; box-shadow:0 0 16px rgba(124,58,237,0.4); }
.chat-send:hover { transform:translateY(-1px); box-shadow:0 0 24px rgba(124,58,237,0.6); }
.chat-send:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
.chat-hint { font-size:10.5px; color:rgba(148,163,184,0.35); margin-top:8px; font-family:var(--font-mono); text-align:center; }

/* From Uiverse.io by JkHuger */ 
@keyframes snow {
  0% {
    opacity: 0;
    transform: translateY(0px);
  }

  20% {
    opacity: 1;
  }

  100% {
    opacity: 1;
    transform: translateY(650px);
  }
}

@keyframes astronaut {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.box-of-star1,
.box-of-star2,
.box-of-star3,
.box-of-star4 {
  width: 100%;
  position: absolute;
  z-index: 10;
  left: 0;
  top: 0;
  transform: translateY(0px);
  height: 700px;
}

.box-of-star1 {
  animation: snow 5s linear infinite;
}

.box-of-star2 {
  animation: snow 5s -1.64s linear infinite;
}

.box-of-star3 {
  animation: snow 5s -2.30s linear infinite;
}

.box-of-star4 {
  animation: snow 5s -3.30s linear infinite;
}

.star {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: #FFF;
  position: absolute;
  z-index: 10;
  opacity: 0.7;
}

.star:before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #FFF;
  position: absolute;
  z-index: 10;
  top: 80px;
  left: 70px;
  opacity: .7;
}

.star:after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #FFF;
  position: absolute;
  z-index: 10;
  top: 8px;
  left: 170px;
  opacity: .9;
}

.star-position1 {
  top: 30px;
  left: 20px;
}

.star-position2 {
  top: 110px;
  left: 250px;
}

.star-position3 {
  top: 60px;
  left: 570px;
}

.star-position4 {
  top: 120px;
  left: 900px;
}

.star-position5 {
  top: 20px;
  left: 1120px;
}

.star-position6 {
  top: 90px;
  left: 1280px;
}

.star-position7 {
  top: 30px;
  left: 1480px;
}

.astronaut {
  width: 250px;
  height: 300px;
  position: absolute;
  z-index: 11;
  top: calc(50% - 150px);
  left: calc(50% - 125px);
  animation: astronaut 5s linear infinite;
}

.schoolbag {
  width: 100px;
  height: 150px;
  position: absolute;
  z-index: 1;
  top: calc(50% - 75px);
  left: calc(50% - 50px);
  background-color: #94b7ca;
  border-radius: 50px 50px 0 0 / 30px 30px 0 0;
}

.head {
  width: 97px;
  height: 80px;
  position: absolute;
  z-index: 3;
  background: -webkit-linear-gradient(left, #e3e8eb 0%, #e3e8eb 50%, #fbfdfa 50%, #fbfdfa 100%);
  border-radius: 50%;
  top: 34px;
  left: calc(50% - 47.5px);
}

.head:after {
  content: "";
  width: 60px;
  height: 50px;
  position: absolute;
  top: calc(50% - 25px);
  left: calc(50% - 30px);
  background: -webkit-linear-gradient(top, #15aece 0%, #15aece 50%, #0391bf 50%, #0391bf 100%);
  border-radius: 15px;
}

.head:before {
  content: "";
  width: 12px;
  height: 25px;
  position: absolute;
  top: calc(50% - 12.5px);
  left: -4px;
  background-color: #618095;
  border-radius: 5px;
  box-shadow: 92px 0px 0px #618095;
}

.body {
  width: 85px;
  height: 100px;
  position: absolute;
  z-index: 2;
  background-color: #fffbff;
  border-radius: 40px / 20px;
  top: 105px;
  left: calc(50% - 41px);
  background: -webkit-linear-gradient(left, #e3e8eb 0%, #e3e8eb 50%, #fbfdfa 50%, #fbfdfa 100%);
}

.panel {
  width: 60px;
  height: 40px;
  position: absolute;
  top: 20px;
  left: calc(50% - 30px);
  background-color: #b7cceb;
}

.panel:before {
  content: "";
  width: 30px;
  height: 5px;
  position: absolute;
  top: 9px;
  left: 7px;
  background-color: #fbfdfa;
  box-shadow: 0px 9px 0px #fbfdfa, 0px 18px 0px #fbfdfa;
}

.panel:after {
  content: "";
  width: 8px;
  height: 8px;
  position: absolute;
  top: 9px;
  right: 7px;
  background-color: #fbfdfa;
  border-radius: 50%;
  box-shadow: 0px 14px 0px 2px #fbfdfa;
}

.arm {
  width: 80px;
  height: 30px;
  position: absolute;
  top: 121px;
  z-index: 2;
}

.arm-left {
  left: 30px;
  background-color: #e3e8eb;
  border-radius: 0 0 0 39px;
}

.arm-right {
  right: 30px;
  background-color: #fbfdfa;
  border-radius: 0 0 39px 0;
}

.arm-left:before,
.arm-right:before {
  content: "";
  width: 30px;
  height: 70px;
  position: absolute;
  top: -40px;
}

.arm-left:before {
  border-radius: 50px 50px 0px 120px / 50px 50px 0 110px;
  left: 0;
  background-color: #e3e8eb;
}

.arm-right:before {
  border-radius: 50px 50px 120px 0 / 50px 50px 110px 0;
  right: 0;
  background-color: #fbfdfa;
}

.arm-left:after,
.arm-right:after {
  content: "";
  width: 30px;
  height: 10px;
  position: absolute;
  top: -24px;
}

.arm-left:after {
  background-color: #6e91a4;
  left: 0;
}

.arm-right:after {
  right: 0;
  background-color: #b6d2e0;
}

.leg {
  width: 30px;
  height: 40px;
  position: absolute;
  z-index: 2;
  bottom: 70px;
}

.leg-left {
  left: 76px;
  background-color: #e3e8eb;
  transform: rotate(20deg);
}

.leg-right {
  right: 73px;
  background-color: #fbfdfa;
  transform: rotate(-20deg);
}

.leg-left:before,
.leg-right:before {
  content: "";
  width: 50px;
  height: 25px;
  position: absolute;
  bottom: -26px;
}

.leg-left:before {
  left: -20px;
  background-color: #e3e8eb;
  border-radius: 30px 0 0 0;
  border-bottom: 10px solid #6d96ac;
}

.leg-right:before {
  right: -20px;
  background-color: #fbfdfa;
  border-radius: 0 30px 0 0;
  border-bottom: 10px solid #b0cfe4;
}

@media (max-width:860px) { .nav-links{display:none !important} .avatar-name{display:none} .hamburger{display:flex !important} .stats-grid{grid-template-columns:1fr 1fr} }
@media (max-width:600px) { .chat-overlay{padding:12px} .chat-panel{height:92vh;border-radius:18px} .score-grid{grid-template-columns:1fr 1fr} }
@media (max-width:520px) { .page-content{padding:48px 20px 80px} .stats-grid{grid-template-columns:1fr} }
`;

/* ── ICONS ─────────────────────────────────────────────────────── */
const SparkleIcon = () => (
  <svg className="sparkle-icon" width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M8.5 1L9.9 6.1L15 7.5L9.9 8.9L8.5 14L7.1 8.9L2 7.5L7.1 6.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
    <path d="M14 1L14.6 3.4L17 4L14.6 4.6L14 7L13.4 4.6L11 4L13.4 3.4Z" fill="currentColor" opacity="0.6" />
  </svg>
);
const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M3 5L6.5 8.5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const StarIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
    <path d="M4 0L5 2.8L8 3.2L5.8 5.3L6.5 8L4 6.5L1.5 8L2.2 5.3L0 3.2L3 2.8Z" />
  </svg>
);
const ProfileSvg = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
    <path d="M2 12.5C2 10.3 4.24 8.5 7 8.5C9.76 8.5 12 10.3 12 12.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
  </svg>
);
const SettingsSvg = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
    <path d="M7 1.5v1.2M7 11.3v1.2M1.5 7h1.2M11.3 7h1.2M3.2 3.2l.85.85M9.95 9.95l.85.85M3.2 10.8l.85-.85M9.95 4.05l.85-.85" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const LogoutSvg = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H3C2.45 2 2 2.45 2 3V11C2 11.55 2.45 12 3 12H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M9 4.5L12 7L9 9.5M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 2v9M2 6.5h9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" fill="none" />
    <path d="M5.5 5.5C5.5 4.72 6.06 4.1 6.5 4.1s1 .72 1 1.4c0 .95-1 1.4-1 2.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <circle cx="6.5" cy="9.4" r="0.55" fill="currentColor" />
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 2L7 9M14 2L9.5 14L7 9L2 6.5L14 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const AISparkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1L9.4 5.6L14 7L9.4 8.4L8 13L6.6 8.4L2 7L6.6 5.6Z" fill="white" opacity="0.9" />
    <circle cx="8" cy="7" r="2" fill="rgba(255,255,255,0.3)" />
  </svg>
);

/* ── PARTICLES ─────────────────────────────────────────────────── */
const PARTICLE_COLORS = ["#a855f7", "#6366f1", "#06b6d4", "#f472b6", "#818cf8"];
function Particles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    duration: `${Math.random() * 18 + 12}s`, delay: `${Math.random() * 12}s`,
    opacity: Math.random() * 0.4 + 0.1,
  }));
  return (
    <div className="particles-wrap" aria-hidden>
      {particles.map((p) => (
        <div key={p.id} className="particle" style={{ left: p.left, width: p.width, height: p.width, background: p.color, animationDuration: p.duration, animationDelay: p.delay, opacity: p.opacity, boxShadow: `0 0 ${parseInt(p.width) * 3}px ${p.color}` }} />
      ))}
    </div>
  );
}

/* ── SPARKLE CANVAS ─────────────────────────────────────────────── */
function SparkleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let sparks = [], raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = 68; };
    resize(); window.addEventListener("resize", resize);
    const COLORS = ["#a855f7", "#6366f1", "#06b6d4", "#f472b6", "#818cf8", "#e879f9"];
    const spawn = () => {
      if (sparks.length < 18 && Math.random() < 0.3)
        sparks.push({ x: Math.random() * canvas.width, y: Math.random() * 68, r: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, life: 1, decay: Math.random() * 0.012 + 0.006, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); spawn();
      sparks = sparks.filter(s => s.life > 0);
      sparks.forEach(s => {
        ctx.save(); ctx.globalAlpha = s.life * 0.7; ctx.shadowBlur = 8; ctx.shadowColor = s.color; ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        s.x += s.vx; s.y += s.vy; s.life -= s.decay;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="sparkle-canvas" aria-hidden />;
}

/* ── NAV CONFIG ─────────────────────────────────────────────────── */
const NAV = [
  { label: "Home" },
  { label: "Evaluate Idea", cta: true },
  { label: "My Evaluations" },
  { label: "Reports" },
  { label: "How It Works" },
];

/* ── AI ENGINE ──────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are Idea Evaluator AI.

Explain startup ideas in VERY SIMPLE English so that even a beginner can understand.

Always follow this format:

1. Start with a short friendly feedback:
"Your idea is good because..." or "This is an interesting idea because..."

2. Then give sections:

### Problem
Explain in simple words

### Objective
Simple goal

### Solution
Explain like you are talking to a beginner

### Execution
Simple steps (no complex words)

### Strengths
2-3 simple bullet points

### Risks
2-3 simple bullet points

### Recommendation
One clear suggestion

IMPORTANT:
- Use very simple English
- Avoid technical jargon
- Keep sentences short
- Make it easy to understand

At the end ALWAYS output:

SCORES:{"innovation":XX,"market":XX,"feasibility":XX}
`;

async function callAI(messages) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Idea Evaluator AI"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ]
    })
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("OpenRouter error:", data);
    throw new Error(data.error?.message || "API request failed");
  }

  return data.choices[0].message.content;
}
async function callStartupModelFromIdea(idea) {

  const features = new Array(34).fill(0);

  // 🔥 Simple rule-based feature extraction
  const text = idea.toLowerCase();

  if (text.includes("ai")) features[0] = 1;
  if (text.includes("health")) features[1] = 1;
  if (text.includes("app")) features[2] = 1;
  if (text.includes("marketplace")) features[3] = 1;
  if (text.includes("subscription")) features[4] = 1;

  // add more rules if needed

  const res = await fetch("http://127.0.0.1:5000/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      features: features
    })
  });

  return await res.json();
}
/* ── SCORE BAR ──────────────────────────────────────────────────── */
function ScoreBar({ label, value, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 150); return () => clearTimeout(t); }, [value]);
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-label"><span>{label}</span><span>{value}/100</span></div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── MESSAGE BUBBLE ─────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const isAI = msg.role === "assistant";
  let text = msg.content;
  let scores = null;
  const sm = text.match(/SCORES:(\{[^}]+\})/);

  if (sm) {
    try {
      scores = JSON.parse(sm[1]);
    } catch (_) { }
  }

  // 🚨 If AI fails to give scores → use defaults


  // Always call ML model


  // remove scores text from AI message
  text = text.replace(/SCORES:\{[^}]+\}/, "").trim();

  const fmt = (t) =>
    t.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} style={{ color: "#c4b5fd", fontWeight: 600 }}>{p.slice(2, -2)}</strong>
        : p
    );

  const renderLines = (t) =>
    t.split("\n").map((line, i) => {
      if (line.startsWith("- ") || line.startsWith("• "))
        return <div key={i} style={{ display: "flex", gap: 8, marginTop: 4 }}><span style={{ color: "#a855f7", flexShrink: 0, marginTop: 2 }}>▸</span><span>{fmt(line.slice(2))}</span></div>;
      if (!line.trim()) return <div key={i} style={{ height: 6 }} />;

      // 🎨 Section coloring
      let style = {};

      if (line.toLowerCase().includes("problem")) {
        style = { color: "#f87171", fontWeight: 600 };
      }
      else if (line.toLowerCase().includes("objective")) {
        style = { color: "#60a5fa", fontWeight: 600 };
      }
      else if (line.toLowerCase().includes("solution")) {
        style = { color: "#22d3ee", fontWeight: 600 };
      }
      else if (line.toLowerCase().includes("execution")) {
        style = { color: "#818cf8", fontWeight: 600 };
      }
      else if (line.toLowerCase().includes("strengths")) {
        style = { color: "#34d399", fontWeight: 600 };
      }
      else if (line.toLowerCase().includes("risks")) {
        style = { color: "#fb923c", fontWeight: 600 };
      }
      else if (line.toLowerCase().includes("recommendation")) {
        style = { color: "#facc15", fontWeight: 600 };
      }
      else if (line.toLowerCase().includes("feedback")) {
        style = { color: "#c084fc", fontWeight: 600 };
      }

      return <div key={i} style={style}>{fmt(line)}</div>;
    });

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`msg ${isAI ? "ai" : "user"}`}>
      {isAI
        ? <div className="msg-avatar ai"><div className="msg-avatar-inner"><AISparkIcon /></div></div>
        : <div className="msg-avatar user-av">AK</div>
      }
      <div className="msg-body">
        <div className="msg-bubble">
          <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>{renderLines(text)}</div>
          {scores && (
            <>
              <div className="score-grid">
                {[["innovation", "Innovation"], ["market", "Market"], ["feasibility", "Feasibility"]].map(([k, l]) => (
                  <div key={k} className="score-card">
                    <div className="score-val">{scores[k]}</div>
                    <div className="score-lbl">{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <ScoreBar label="Innovation" value={scores.innovation} color="linear-gradient(90deg,#a855f7,#6366f1)" />
                <ScoreBar label="Market Potential" value={scores.market} color="linear-gradient(90deg,#06b6d4,#6366f1)" />
                <ScoreBar label="Feasibility" value={scores.feasibility} color="linear-gradient(90deg,#f472b6,#a855f7)" />
              </div>
            </>
          )}
        </div>
        <div className="msg-time">{time}</div>
      </div>
    </div>
  );
}

/* ── CHAT PANEL ─────────────────────────────────────────────────── */
const WELCOME = {
  role: "assistant",
  content: `Welcome to **Idea Evaluator AI** — your personal startup intelligence engine.

I'll analyze your concept across **Innovation**, **Market Potential**, and **Feasibility** and generate a full report with scores.

Describe your startup idea — what problem does it solve, and who is it for?`,
};

const QUICK_PROMPTS = [
  "AI-powered mental health app",
  "Marketplace for freelance engineers",
  "Sustainable packaging startup",
  "B2B SaaS for restaurant ops",
];

function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 400); }, []);

  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim();

    // ❌ REMOVE loading block for prompts
    if (!trimmed) return;

    if (loading && !text) return; // allow prompt clicks

    setError(null);

    const userMsg = { role: "user", content: trimmed };

    // 👉 CALL ML MODEL HERE
    let mlResult;

    try {
      mlResult = await callStartupModelFromIdea(trimmed);
    } catch (e) {
      console.log("ML error:", e);

      mlResult = {
        success_probability: 0.6
      };
    }

    // 👉 SHOW ML RESULT
    const prob = mlResult.success_probability * 100;

    const scoresFromML = {
      innovation: Math.round(prob * 0.9),
      market: Math.round(prob),
      feasibility: Math.round(prob * 0.8)
    };

    const mlMessage = {
      role: "assistant",
      content: `
### Model Prediction
Startup success probability: ${(prob).toFixed(1)}%

SCORES:${JSON.stringify(scoresFromML)}
`
    };

    setMessages(prev => [...prev, userMsg, mlMessage]);

    setInput("");
    setLoading(true);

    const updatedMessages = [...messages, userMsg, mlMessage];

    // update UI first
    setMessages(updatedMessages);
    setInput("");

    try {
      const apiHistory = updatedMessages.slice(-14);

      const reply = await callAI(apiHistory);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: reply }
      ]);

    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ AI failed, but ML prediction still works."
        }
      ]);
    } finally {
      setLoading(false);
    }

  }, [input, loading, messages]);

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="chat-panel">
      {/* Topbar */}
      <div className="chat-topbar">
        <div className="chat-topbar-left">
          <div className="chat-ai-orb"><div className="chat-ai-orb-inner"><AISparkIcon /></div></div>
          <div>
            <div className="chat-title">Idea Evaluator AI</div>
            <div className="chat-subtitle">Neural Evaluation Engine v2.0</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="chat-status"><span className="chat-status-dot" />Online</div>
          <button className="chat-close" onClick={onClose}><CloseIcon /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}

        {messages.filter(m => m.role === "user").length === 0 && (
          <div style={{ paddingLeft: 44 }}>
            <div style={{ fontSize: 11, color: "rgba(148,163,184,0.5)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>Try an example:</div>
            <div className="prompt-chips">
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="prompt-chip" onClick={() => handleSend(p)}>{p}</button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="msg ai">
            <div className="msg-avatar ai"><div className="msg-avatar-inner"><AISparkIcon /></div></div>
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          <div className="chat-input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Describe your startup idea..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
          </div>
          <button className="chat-send" onClick={() => handleSend()} disabled={loading}>
            <SendIcon />
          </button>
        </div>
        <div className="chat-hint">Enter to send · Shift+Enter for new line · Esc to close</div>
      </div>
    </div>
  );
}


/* ── CHAT OVERLAY ───────────────────────────────────────────────── */
function ChatOverlay({ open, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className={`chat-overlay${open ? " visible" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {open && <ChatPanel onClose={onClose} />}
    </div>
  );
}


/* ── HERO ───────────────────────────────────────────────────────── */
function HeroPage({ onEvaluate }) {
  return (
    <div className="page-content">
      <div className="hero-chip"><span className="chip-dot" />AI-Powered Startup Intelligence</div>
      <h1 className="hero-title">Turn your ideas into<br /><span className="grad">AI-verified insights</span></h1>
      <p className="hero-sub">Submit any startup concept. Receive a deep evaluation covering innovation score, market potential, and technical feasibility — powered by next-gen AI.</p>
      <div className="hero-btns">
        <button className="btn-glow btn-primary-glow" onClick={onEvaluate}><PlusIcon /> Start Evaluating</button>
      </div>

    </div>
  );
}

/* ── ROOT ───────────────────────────────────────────────────────── */
export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const handleEvaluate = () => {
    setLoadingChat(true);

    setTimeout(() => {
      setLoadingChat(false);
      setChatOpen(true);
    }, 4000);
  };

  return (
    <>
      <style>{css}</style>

      <div className="aurora-bg" aria-hidden>
        <div className="aurora-mid" />
      </div>

      <div className="grid-overlay" aria-hidden />
      <Particles />
      <SparkleCanvas />

      <HeroPage onEvaluate={handleEvaluate} />
      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}