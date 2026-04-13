import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveSettings } from '../../store/settings';
import type { AppSettings, CardShape, DataSource } from '../../store/settings';
import styles from './Settings.module.css';

type TestState = 'idle' | 'pending' | 'ok' | 'err';

// ── Reusable controls ─────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleInfo}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.toggleDesc}>{description}</span>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.segmented}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.segBtn} ${value === opt.value ? styles.segBtnActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ColorRow({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.colorRow}>
      <label className={styles.label}>{label}</label>
      <div className={styles.colorPickerRow}>
        <input
          type="color"
          className={styles.colorInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={styles.colorValue}>{value}</span>
        <button className={styles.testBtn} onClick={() => onChange(defaultValue)}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

function Settings() {
  const navigate = useNavigate();
  const [s, setS] = useState<AppSettings>(getSettings);
  const [urlTest, setUrlTest]       = useState<TestState>('idle');
  const [urlTestMsg, setUrlTestMsg] = useState('');
  const [slackTest, setSlackTest]       = useState<TestState>('idle');
  const [slackTestMsg, setSlackTestMsg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    saveSettings(s);
  }, [s]);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(s);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate('/');
      window.location.href = window.location.origin + import.meta.env.BASE_URL;
    }, 1200);
  };

  const testCustomUrl = async () => {
    if (!s.customUrl) return;
    setUrlTest('pending');
    setUrlTestMsg('');
    try {
      const res = await fetch(s.customUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const count = json?.users?.length ?? 0;
      if (!Array.isArray(json?.users)) throw new Error('Expected { users: [...] }');
      setUrlTest('ok');
      setUrlTestMsg(`✓ Connected — ${count} user${count !== 1 ? 's' : ''} found`);
    } catch (e) {
      setUrlTest('err');
      setUrlTestMsg(`✗ ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const testSlack = async () => {
    setSlackTest('pending');
    setSlackTestMsg('');
    try {
      const res = await fetch('/api/slack/api.test');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Slack returned ok: false');
      setSlackTest('ok');
      setSlackTestMsg('✓ Connected to Slack workspace');
    } catch (e) {
      setSlackTest('err');
      setSlackTestMsg(`✗ ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const sourceOption = (value: DataSource, name: string, desc: string) => (
    <label className={`${styles.sourceOption} ${s.dataSource === value ? styles.selected : ''}`}>
      <input
        type="radio"
        name="dataSource"
        value={value}
        checked={s.dataSource === value}
        onChange={() => set('dataSource', value)}
      />
      <div className={styles.sourceLabel}>
        <span className={styles.sourceName}>{name}</span>
        <span className={styles.sourceDesc}>{desc}</span>
      </div>
    </label>
  );

  const msToSec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div>
          <h1 className={styles.heading}>Settings</h1>
          <p className={styles.subheading}>Saved automatically to this browser.</p>
        </div>

        {/* ── Data source ───────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Profile Data Source</p>

          <div className={styles.sourceOptions}>
            {sourceOption('demo', 'Demo (randomuser.me)', 'Fetch random public profiles with real photos. Good for testing.')}
            {sourceOption('url', 'Custom JSON URL', 'Point to your own endpoint returning { users: [...] }.')}
            {sourceOption('slack', 'Slack Workspace', 'Pull profiles from your Slack workspace via a local proxy.')}
          </div>

          {s.dataSource === 'demo' && (
            <div className={styles.subField}>
              <label className={styles.label}>Number of users</label>
              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span />
                  <span className={styles.sliderValue}>{s.demoUserCount}</span>
                </div>
                <input type="range" className={styles.slider} min={10} max={100} step={10}
                  value={s.demoUserCount}
                  onChange={(e) => set('demoUserCount', Number(e.target.value))}
                />
                <div className={styles.sliderTicks}><span>10</span><span>50</span><span>100</span></div>
              </div>
            </div>
          )}

          {s.dataSource === 'url' && (
            <div className={styles.subField}>
              <label className={styles.label}>Endpoint URL</label>
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://your-org.example.com/api/employees"
                  value={s.customUrl}
                  onChange={(e) => { set('customUrl', e.target.value); setUrlTest('idle'); }}
                />
                <button className={styles.testBtn} onClick={testCustomUrl}
                  disabled={!s.customUrl || urlTest === 'pending'}>
                  {urlTest === 'pending' ? 'Testing…' : 'Test'}
                </button>
              </div>
              {urlTest !== 'idle' && (
                <div className={`${styles.status} ${urlTest === 'ok' ? styles.ok : urlTest === 'err' ? styles.err : styles.pending}`}>
                  {urlTestMsg}
                </div>
              )}
              <div className={styles.info}>
                The endpoint must return JSON in this shape and support CORS:<br />
                <code>{'{ "users": [{ "email", "firstName", "lastName", "role" }] }'}</code>
              </div>
            </div>
          )}

          {s.dataSource === 'slack' && (
            <div className={styles.subField}>
              <div className={styles.inputRow}>
                <button className={styles.testBtn} style={{ flex: 1 }} onClick={testSlack}
                  disabled={slackTest === 'pending'}>
                  {slackTest === 'pending' ? 'Testing…' : 'Test Slack connection'}
                </button>
              </div>
              {slackTest !== 'idle' && (
                <div className={`${styles.status} ${slackTest === 'ok' ? styles.ok : slackTest === 'err' ? styles.err : styles.pending}`}>
                  {slackTestMsg}
                </div>
              )}
              <div className={styles.info}>
                Slack requires a server-side proxy so your token stays private.<br /><br />
                <strong>Setup:</strong><br />
                1. Create a Slack app at <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer">api.slack.com/apps</a><br />
                2. Add OAuth scope: <code>users:read</code><br />
                3. Install to your workspace, copy the <code>xoxb-…</code> Bot Token<br />
                4. Add to <code>.env</code> in this project:<br />
                &nbsp;&nbsp;<code>SLACK_TOKEN=xoxb-your-token-here</code><br />
                5. Restart <code>npm run dev</code> — the proxy handles the rest.
              </div>
            </div>
          )}
        </div>

        {/* ── Display ───────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Display</p>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Featured card duration</label>
              <span className={styles.sliderValue}>{s.featuredDurationSec}s</span>
            </div>
            <input type="range" className={styles.slider} min={3} max={15} step={1}
              value={s.featuredDurationSec}
              onChange={(e) => set('featuredDurationSec', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>3s</span><span>9s</span><span>15s</span></div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Scroll speed</label>
              <span className={styles.sliderValue}>
                {s.scrollSpeed <= 5 ? 'Very slow' : s.scrollSpeed <= 12 ? 'Slow' : s.scrollSpeed <= 20 ? 'Medium' : 'Fast'}
              </span>
            </div>
            <input type="range" className={styles.slider} min={2} max={40} step={2}
              value={s.scrollSpeed}
              onChange={(e) => set('scrollSpeed', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>Very slow</span><span>Medium</span><span>Fast</span></div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Number of rows</label>
              <span className={styles.sliderValue}>{s.numRowsOverride === 0 ? 'Auto' : s.numRowsOverride}</span>
            </div>
            <input type="range" className={styles.slider} min={0} max={7} step={1}
              value={s.numRowsOverride}
              onChange={(e) => set('numRowsOverride', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>Auto</span><span>3–4</span><span>7</span></div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Tile gap</label>
              <span className={styles.sliderValue}>{s.tileGap}px</span>
            </div>
            <input type="range" className={styles.slider} min={0} max={20} step={1}
              value={s.tileGap}
              onChange={(e) => set('tileGap', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>0px</span><span>10px</span><span>20px</span></div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Pause between features</label>
              <span className={styles.sliderValue}>{msToSec(s.pauseMs)}</span>
            </div>
            <input type="range" className={styles.slider} min={0} max={3000} step={100}
              value={s.pauseMs}
              onChange={(e) => set('pauseMs', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>0s</span><span>1.5s</span><span>3s</span></div>
          </div>
        </div>

        {/* ── Card style ────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Card Style</p>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Card size</label>
              <span className={styles.sliderValue}>{s.cardSize}px</span>
            </div>
            <input type="range" className={styles.slider} min={150} max={500} step={25}
              value={s.cardSize}
              onChange={(e) => set('cardSize', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>150px</span><span>325px</span><span>500px</span></div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.settingRow}>
            <label className={styles.label}>Photo shape</label>
            <SegmentedControl<CardShape>
              options={[
                { value: 'rounded', label: 'Rounded' },
                { value: 'circle',  label: 'Circle'  },
              ]}
              value={s.cardShape}
              onChange={(v) => set('cardShape', v)}
            />
          </div>

          <hr className={styles.divider} />

          <ToggleRow
            label="Show role/title"
            description="Display the person's role beneath their name"
            checked={s.showRole}
            onChange={(v) => set('showRole', v)}
          />
        </div>

        {/* ── Animation ─────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Animation</p>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Lift speed</label>
              <span className={styles.sliderValue}>{msToSec(s.liftMs)}</span>
            </div>
            <input type="range" className={styles.slider} min={300} max={2000} step={100}
              value={s.liftMs}
              onChange={(e) => set('liftMs', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>0.3s</span><span>1.2s</span><span>2s</span></div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <label className={styles.label}>Dismiss speed</label>
              <span className={styles.sliderValue}>{msToSec(s.dismissMs)}</span>
            </div>
            <input type="range" className={styles.slider} min={300} max={2000} step={100}
              value={s.dismissMs}
              onChange={(e) => set('dismissMs', Number(e.target.value))}
            />
            <div className={styles.sliderTicks}><span>0.3s</span><span>1.2s</span><span>2s</span></div>
          </div>
        </div>

        {/* ── Appearance ────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Appearance</p>

          <ToggleRow
            label="Show clock"
            description="Display the current time and date at the bottom of the wall"
            checked={s.showClock}
            onChange={(v) => set('showClock', v)}
          />

          <hr className={styles.divider} />

          <ToggleRow
            label="Kiosk mode"
            description="Hide the navigation bar without requiring full screen"
            checked={s.kioskMode}
            onChange={(v) => set('kioskMode', v)}
          />
        </div>

        {/* ── Theme ─────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Theme</p>

          <ColorRow
            label="Highlight color"
            value={s.highlightColor}
            defaultValue="#a855f7"
            onChange={(v) => set('highlightColor', v)}
          />

          <hr className={styles.divider} />

          <ColorRow
            label="Nav bar color"
            value={s.navColor}
            defaultValue="#0f172a"
            onChange={(v) => set('navColor', v)}
          />

          <hr className={styles.divider} />

          <ColorRow
            label="Background color"
            value={s.bgColor}
            defaultValue="#1a2535"
            onChange={(v) => set('bgColor', v)}
          />
        </div>

        {/* ── Filtering ─────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Filtering</p>

          <div className={styles.subField}>
            <label className={styles.label}>Exclude by role</label>
            <p className={styles.filterDesc}>
              Employees with these roles won't be featured. One role per line, case-insensitive.
            </p>
            <textarea
              className={styles.textarea}
              value={s.excludedRoles}
              onChange={(e) => set('excludedRoles', e.target.value)}
              placeholder={'Engineering\nDesign\nMarketing'}
              rows={5}
              spellCheck={false}
            />
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────── */}
        {saved ? (
          <div className={styles.savedBanner}>✓ Saved — reloading…</div>
        ) : (
          <button
            onClick={handleSave}
            style={{
              padding: '14px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1em',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={(e)  => (e.currentTarget.style.background = '#3b82f6')}
          >
            Save &amp; Reload
          </button>
        )}
      </div>
    </div>
  );
}

export default Settings;
