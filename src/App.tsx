import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clapperboard,
  Clock3,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Menu,
  Mic2,
  MoreHorizontal,
  Play,
  Sparkles,
  UserRound,
  WandSparkles,
  X,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
} from 'lucide-react';
import { supabase, withTimeout } from '@/lib/supabase';
import { generateAi, getVideoStatus, type AiResult } from '@/lib/ai';

type AuthMode = 'login' | 'signup' | 'recovery';
type Duration = '30 sec' | '2 min' | '10 min';
type SessionUser = { email?: string } | null;

const featureImages = [
  {
    title: 'Video Banao',
    label: 'Create scroll-stopping stories',
    image: 'https://images.pexels.com/photos/11063292/pexels-photo-11063292.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: Clapperboard,
  },
  {
    title: 'Voice Banao',
    label: 'Apni awaaz, every language',
    image: 'https://images.pexels.com/photos/17532958/pexels-photo-17532958.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: Mic2,
  },
  {
    title: 'Tahrir Likho',
    label: 'Ideas ko words mein badlo',
    image: 'https://images.pexels.com/photos/7243103/pexels-photo-7243103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: FileText,
  },
];

const navItems = [
  { label: 'Video Banao', icon: Clapperboard },
  { label: 'Image Banao', icon: ImageIcon },
  { label: 'Tahrir Likho', icon: FileText },
  { label: 'Voice Banao', icon: Mic2 },
  { label: 'Chat Karo', icon: Sparkles },
];

function App() {
  const [user, setUser] = useState<SessionUser>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeTool, setActiveTool] = useState('Video Banao');
  const [duration, setDuration] = useState<Duration>('30 sec');
  const [prompt, setPrompt] = useState('Ek cinematic travel reel banao, Hunza valley ki beauty par...');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [result, setResult] = useState<AiResult | null>(null);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
      setAuthMode('recovery');
      setAuthOpen(true);
    }
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { email: data.session.user.email } : null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email } : null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
  };

  const runGeneration = async () => {
    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    if (prompt.trim().length < 3) {
      setGenerationError('Pehle apni idea ya prompt likhein.');
      return;
    }
    setIsGenerating(true);
    setGenerationError('');
    setResult(null);
    try {
      const generated = await generateAi(activeTool, prompt.trim(), duration);
      if (generated.kind === 'video' && generated.predictionId) {
        let latest: AiResult = generated;
        for (let attempt = 0; attempt < 30 && latest.kind === 'video' && !latest.videoUrl; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 4000));
          latest = await getVideoStatus(generated.predictionId);
          if (latest.kind === 'video' && latest.error) throw new Error(latest.error);
        }
        setResult(latest);
      } else {
        setResult(generated);
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Banao AI home">
          <img src="/logo.jpg" alt="Banao AI" />
          <span>Banao <strong>AI</strong></span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#create">Create</a>
          <a href="#how-it-works">How it works</a>
          <a href="#showcase">Showcase</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <button className="profile-pill" onClick={handleSignOut} title="Sign out">
              <UserRound size={16} />
              <span>{user.email?.split('@')[0] ?? 'Creator'}</span>
            </button>
          ) : (
            <button className="text-button" onClick={() => setAuthOpen(true)}>Log in</button>
          )}
          <button className="header-cta" onClick={() => setAuthOpen(true)}>
            Start creating <ArrowRight size={16} />
          </button>
          <button className="mobile-menu" aria-label="Open menu"><Menu size={21} /></button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> AI tools for the next generation of creators</div>
            <h1>Ideas se <em>impact</em> tak.<br />Sab kuch Banao.</h1>
            <p className="hero-description">Video, images, voice, writing aur chat — ek hi creative studio mein. Apni next big idea ko minutes mein reality banao.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setAuthOpen(true)}>Start creating free <ArrowRight size={18} /></button>
              <button className="play-button" onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}><span><Play size={13} fill="currentColor" /></span> See what&apos;s possible</button>
            </div>
            <div className="trust-row"><div className="avatar-stack"><span>AS</span><span>MK</span><span>ZA</span><span>+</span></div><span>Join 12,000+ creators building boldly</span></div>
          </div>
          <div className="hero-stage" aria-label="Banao AI creative preview">
            <div className="stage-glow" />
            <div className="preview-window">
              <div className="preview-topbar"><span className="window-dots"><i /><i /><i /></span><span>Untitled project</span><MoreHorizontal size={17} /></div>
              <div className="preview-content">
                <div className="preview-video">
                  <div className="reel-pill"><span className="live-dot" /> AI REEL / 01</div>
                  <div className="reel-copy"><span>YOUR STORY</span><strong>BEGINS<br />HERE<span>.</span></strong></div>
                  <div className="reel-footer"><span>Made with Banao AI</span><span>00:12 / 00:30</span></div>
                  <div className="progress"><i /></div>
                </div>
                <div className="preview-sidebar"><div className="side-label">SCENE 01</div><div className="mini-lines"><i /><i /><i /><i /></div><div className="side-label">STYLE</div><div className="style-chip">Cinematic <ChevronDown size={13} /></div><button className="generate-mini"><WandSparkles size={15} /> Generate</button></div>
              </div>
            </div>
            <div className="float-card float-card-one"><span className="float-icon orange"><Sparkles size={15} /></span><div><small>AI MAGIC</small><strong>Idea → ready reel</strong></div></div>
            <div className="float-card float-card-two"><span className="float-icon green"><Check size={15} /></span><div><small>JUST NOW</small><strong>Voiceover generated</strong></div></div>
          </div>
        </section>

        <section className="tool-strip" id="create">
          <div className="section-kicker">ONE STUDIO. ENDLESS POSSIBILITIES.</div>
          <div className="tool-nav">
            {navItems.map(({ label, icon: Icon }) => <button key={label} className={activeTool === label ? 'tool-tab active' : 'tool-tab'} onClick={() => setActiveTool(label)}><Icon size={17} /> {label}</button>)}
          </div>
          <div className="creation-card">
            <div className="creation-intro"><span className="blue-orb"><WandSparkles size={20} /></span><div><h2>{activeTool}</h2><p>{activeTool === 'Video Banao' ? 'Apni story batao. Banao usse scroll-stopping.' : 'Apni creativity ko next level par le jao.'}</p></div></div>
            <div className="prompt-box"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label={`${activeTool} prompt`} placeholder="Apni idea yahan likhein..." /><button onClick={runGeneration} disabled={isGenerating || prompt.trim().length < 3} aria-label="Submit prompt">{isGenerating ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}</button></div>
            <div className="creation-footer"><div className="duration-picker"><Clock3 size={15} /><span>Duration</span>{(['30 sec', '2 min', '10 min'] as Duration[]).map((item) => <button key={item} className={item === duration ? 'duration active' : 'duration'} onClick={() => setDuration(item)}>{item}</button>)}</div><button className="small-create" onClick={runGeneration} disabled={isGenerating}>{isGenerating ? <><LoaderCircle className="spin" size={15} /> Creating...</> : <>Create <Sparkles size={15} /></>}</button></div>
            {generationError && <p className="generation-error">{generationError}</p>}
            {result && <AiResultCard result={result} />}
          </div>
        </section>

        <section className="showcase-section" id="showcase">
          <div className="section-heading"><div><div className="section-kicker">BUILT FOR THE BOLD</div><h2>Har idea ka apna <em>moment.</em></h2></div><a href="#create">Explore all tools <ArrowRight size={16} /></a></div>
          <div className="feature-grid">{featureImages.map(({ title, label, image, icon: Icon }) => <article className="feature-card" key={title}><img src={image} alt={label} loading="lazy" /><div className="feature-overlay" /><div className="feature-card-content"><span className="feature-icon"><Icon size={17} /></span><div><h3>{title}</h3><p>{label}</p></div><ArrowRight className="feature-arrow" size={18} /></div></article>)}</div>
        </section>

        <section className="speed-section" id="how-it-works"><div className="speed-copy"><div className="section-kicker">YOUR UNFAIR ADVANTAGE</div><h2>Less time tweaking.<br /><em>More time creating.</em></h2><p>Banao AI takes the busywork off your plate so your best ideas can get out into the world faster. Smart tools, simple controls, zero creative blocks.</p><button className="outline-button" onClick={() => setAuthOpen(true)}>Try it yourself <ArrowRight size={16} /></button></div><div className="speed-stats"><div><strong>10×</strong><span>faster from idea<br />to publish</span></div><div><strong>∞</strong><span>ways to make<br />it yours</span></div><div><strong>1</strong><span>studio for your<br />whole workflow</span></div></div></section>
      </main>

      <footer className="site-footer"><div className="footer-main"><a className="brand footer-brand" href="#top"><img src="/logo.jpg" alt="Banao AI" /><span>Banao <strong>AI</strong></span></a><p>Make more. Make it yours.<br />Apni creativity ko fly karne do.</p><div className="footer-links"><a href="#create">Create</a><a href="#showcase">Showcase</a><a href="#pricing">Pricing</a><a href="#top">Privacy</a></div></div><div className="footer-bottom"><span>© 2026 Banao AI. Made for creators, everywhere.</span><span>Made with intention in Pakistan <span className="footer-dot" /></span></div></footer>

      {authOpen && <AuthModal initialMode={authMode} onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}
    </div>
  );
}

function AiResultCard({ result }: { result: AiResult }) {
  if (result.kind === 'text') {
    return <div className="ai-result"><div className="result-heading"><span>AI result</span><button onClick={() => navigator.clipboard.writeText(result.content)}><Download size={14} /> Copy</button></div><p className="result-text">{result.content}</p></div>;
  }
  if (result.kind === 'image') {
    const source = result.imageDataUrl ?? result.imageUrl;
    return <div className="ai-result"><div className="result-heading"><span>Image ready</span>{source && <a href={source} download="banao-ai-image.png"><Download size={14} /> Download</a>}</div>{source && <img className="result-image" src={source} alt="AI generated result" />}</div>;
  }
  if (result.kind === 'audio') {
    return <div className="ai-result"><div className="result-heading"><span>Voice ready</span><a href={result.audioDataUrl} download="banao-ai-voice.mp3"><Download size={14} /> Download</a></div><audio className="result-audio" controls src={result.audioDataUrl}>Your browser does not support audio playback.</audio></div>;
  }
  if (result.videoUrl) {
    return <div className="ai-result"><div className="result-heading"><span>Video ready</span><a href={result.videoUrl} download="banao-ai-video.mp4"><Download size={14} /> Download</a></div><video className="result-video" controls src={result.videoUrl}>Your browser does not support video playback.</video></div>;
  }
  return <div className="ai-result result-pending"><RefreshCw className="spin" size={16} /> Video is still rendering. Please keep this tab open.</div>;
}

function AuthModal({ initialMode, onClose, onSuccess }: { initialMode: AuthMode; onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError('Password must be 6+ characters');
      return;
    }
    if (!supabase) {
      setError('Sign in is temporarily unavailable. Please try again shortly.');
      return;
    }
    setIsLoading(true);
    try {
      if (mode === 'recovery') {
        const { error: updateError } = await withTimeout(supabase.auth.updateUser({ password }));
        if (updateError) throw updateError;
        setMessage('Password updated. You can now log in with your new password.');
        setPassword('');
        setMode('login');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      const result = mode === 'login'
        ? await withTimeout(supabase.auth.signInWithPassword({ email, password }))
        : await withTimeout(supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }));
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) setMessage('Account created. Check your email to confirm, then log in.');
      else onSuccess();
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Something went wrong. Please try again.';
      const normalizedError = errorMessage.toLowerCase();
      if (errorMessage === 'AUTH_TIMEOUT' || normalizedError.includes('failed to fetch')) {
        setError('Banao AI could not reach the sign-in service. Please check your connection and try again.');
      } else if (normalizedError.includes('invalid login')) {
        setError('Email ya password ghalat hai.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!supabase || !email) {
      setError('Pehle apna email likhein.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const { error: resetError } = await withTimeout(supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }));
      if (resetError) throw resetError;
      setMessage('Password reset link email kar diya gaya hai.');
    } catch (resetError) {
      const errorMessage = resetError instanceof Error ? resetError.message : 'Password reset could not start.';
      setError(errorMessage === 'AUTH_TIMEOUT' || errorMessage.toLowerCase().includes('failed to fetch') ? 'Banao AI could not reach the sign-in service. Please try again.' : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    if (!supabase) { setError('Google login is temporarily unavailable.'); return; }
    setIsLoading(true);
    try {
      const { error: googleError } = await withTimeout(supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }));
      if (googleError) throw googleError;
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Google login could not start.';
      setError(errorMessage === 'AUTH_TIMEOUT' || errorMessage.toLowerCase().includes('failed to fetch') ? 'Banao AI could not reach Google login. Please try again.' : errorMessage);
      setIsLoading(false);
    }
  };

  return <div className="auth-backdrop" role="dialog" aria-modal="true" aria-label="Banao AI login"><div className="auth-modal"><button className="close-auth" onClick={onClose} aria-label="Close login"><X size={20} /></button><div className="auth-brand"><img src="/logo.jpg" alt="" /><span>Banao <strong>AI</strong></span></div><div className="auth-heading"><div className="section-kicker">WELCOME TO YOUR CREATIVE ERA</div><h2>{mode === 'login' ? 'Let&apos;s make something.' : mode === 'recovery' ? 'Set a new password.' : 'Your ideas start here.'}</h2><p>{mode === 'login' ? 'Log in aur create karna shuru karo.' : mode === 'recovery' ? 'Apna new password set karo.' : 'Free account banao. No creative limits.'}</p></div>{mode !== 'recovery' && <button className="google-button" onClick={signInWithGoogle} disabled={isLoading}><span className="google-mark">G</span>{isLoading ? 'Connecting...' : 'Continue with Google'}</button>}<div className="auth-divider"><span>{mode === 'recovery' ? 'choose a new password' : 'or use email'}</span></div><form onSubmit={submit}>{mode !== 'recovery' && <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" /></label>}<label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{mode === 'login' && <button type="button" className="forgot-password" onClick={requestPasswordReset}>Forgot password?</button>}{error && <p className="auth-error">{error}</p>}{message && <p className="auth-message">{message}</p>}<button className="auth-submit" disabled={isLoading}>{isLoading ? <><LoaderCircle className="spin" size={18} /> Please wait...</> : <>{mode === 'login' ? 'Log in' : mode === 'recovery' ? 'Update password' : 'Create free account'} <ArrowRight size={17} /></>}</button></form><p className="auth-switch">{mode === 'recovery' ? 'Remembered your password?' : mode === 'login' ? 'New to Banao AI?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}>{mode === 'recovery' || mode === 'login' ? 'Log in' : 'Log in'}</button></p></div></div>;
}

export default App;
