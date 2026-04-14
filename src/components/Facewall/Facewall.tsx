import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Employee } from '../../types';
import type { CardShape } from '../../store/settings';
import { gravatarUrlSized } from '../../utils/gravatar';
import styles from './Facewall.module.css';

interface Props {
  employees: Employee[];
  featuredDurationSec?: number;
  scrollSpeed?: number;
  highlightColor?: string;
  bgColor?: string;
  numRowsOverride?: number;
  cardSize?: number;
  liftMs?: number;
  dismissMs?: number;
  pauseMs?: number;
  showRole?: boolean;
  tileGap?: number;
  cardShape?: CardShape;
  showClock?: boolean;
  excludedRoles?: string;
  navHidden?: boolean;
}

type Phase = 'highlight' | 'lifting' | 'show' | 'dismiss' | 'pause';

interface Selection {
  employee: Employee;
  src: string;
  tileLeft: number;
  tileTop: number;
}

const NAV_H         = 44;
const DEFAULT_COLOR = '#a855f7';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calcNumRows(n: number): number {
  if (n <= 12)   return 2;
  if (n <= 24)   return 3;
  if (n <= 40)   return 4;
  if (n <= 60)   return 5;
  if (n <= 84)   return 6;
  if (n <= 200)  return 7;
  if (n <= 600)  return 8;
  if (n <= 2000) return 9;
  return 10;
}

function queryTilePos(email: string): { left: number; top: number } | null {
  const all = Array.from(document.querySelectorAll(`[data-facewall-email="${email}"]`));
  const cx = window.innerWidth / 2;
  let bestDist = Infinity;
  let result: { left: number; top: number } | null = null;
  for (const el of all) {
    const r = (el as HTMLElement).getBoundingClientRect();
    if (r.right < 0 || r.left > window.innerWidth) continue;
    const dist = Math.abs(r.left + r.width / 2 - cx);
    if (dist < bestDist) { bestDist = dist; result = { left: r.left, top: r.top }; }
  }
  return result;
}

// ── Clock overlay ─────────────────────────────────────────────────
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={styles.clock}>
      <div className={styles.clockTime}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className={styles.clockDate}>
        {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

// ── Tile ──────────────────────────────────────────────────────────
function Tile({
  emp,
  size,
  faded,
  onClick,
}: {
  emp: Employee;
  size: number;
  faded: boolean;
  onClick?: (emp: Employee) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const src = emp.gravatar ? gravatarUrlSized(emp.gravatar, size) : null;

  return (
    <div
      data-facewall-email={emp.email}
      className={styles.tile}
      style={{
        width: size,
        height: size,
        opacity: faded ? 0 : 1,
        transition: 'opacity 0.4s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={() => onClick?.(emp)}
    >
      {src && !imgError && (
        <img
          src={src}
          alt=""
          loading="lazy"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}

// ── Highlight ring ────────────────────────────────────────────────
function HighlightRing({
  email,
  tileSize,
  color,
}: {
  email: string;
  tileSize: number;
  color: string;
}) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const p = queryTilePos(email);
      if (p) setPos(p);
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [email]);

  if (!pos) return null;

  return (
    <div
      className={styles.highlightRing}
      style={{
        left: pos.left,
        top:  pos.top,
        width:  tileSize,
        height: tileSize,
        '--ring-color': color,
        '--ring-glow':  hexToRgba(color, 0.35),
      } as React.CSSProperties}
    />
  );
}

// ── Featured card ─────────────────────────────────────────────────
function FeaturedCard({
  sel,
  phase,
  tileSize,
  dismissPos,
  highlightColor,
  cardSize,
  showRole,
  cardShape,
  liftMs,
  dismissMs,
}: {
  sel: Selection;
  phase: 'lifting' | 'show' | 'dismiss';
  tileSize: number;
  dismissPos: { left: number; top: number } | null;
  highlightColor: string;
  cardSize: number;
  showRole: boolean;
  cardShape: CardShape;
  liftMs: number;
  dismissMs: number;
}) {
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    setArrived(false);
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setArrived(true));
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, [sel.employee.email]);

  const isLifting = phase === 'lifting';
  const isDismiss = phase === 'dismiss';
  const atStart   = isLifting && !arrived;

  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;

  const fromX     = (sel.tileLeft + tileSize / 2) - cx;
  const fromY     = (sel.tileTop  + tileSize / 2) - cy;
  const fromScale = tileSize / cardSize;

  const dPos    = dismissPos ?? { left: sel.tileLeft, top: sel.tileTop };
  const toX     = (dPos.left + tileSize / 2) - cx;
  const toY     = (dPos.top  + tileSize / 2) - cy;
  const toScale = tileSize / cardSize;

  let flyTransform: string;
  let opacity: number;
  let flyTransition: string;

  if (atStart) {
    flyTransform  = `translate(${fromX}px, ${fromY}px) scale(${fromScale}) rotateY(-90deg)`;
    opacity       = 0;
    flyTransition = 'none';
  } else if (isDismiss) {
    flyTransform  = `translate(${toX}px, ${toY}px) scale(${toScale}) rotateY(-90deg)`;
    opacity       = 0;
    flyTransition = `transform ${dismissMs}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease`;
  } else {
    flyTransform  = 'translate(0,0) scale(1) rotateY(0deg)';
    opacity       = 1;
    flyTransition = `transform ${liftMs}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease`;
  }

  const showMeta   = !atStart && !isDismiss;
  const showWobble = arrived && !isDismiss;
  const backdropBg = `radial-gradient(ellipse at center, ${hexToRgba(highlightColor, 0.28)} 0%, rgba(0,0,0,0.62) 68%)`;
  const isCircle   = cardShape === 'circle';

  return (
    <>
      <div
        className={styles.backdrop}
        style={{ opacity: atStart || isDismiss ? 0 : 1, background: backdropBg }}
      />
      <div className={styles.cardWrapper}>
        <div style={{ transform: flyTransform, opacity, transition: flyTransition }}>
          <div
            className={showWobble ? styles.cardWobble : undefined}
            style={{
              '--card-glow':      highlightColor,
              '--card-glow-soft': hexToRgba(highlightColor, 0.45),
              '--card-size':      `${cardSize}px`,
            } as React.CSSProperties}
          >
            <div className={`${styles.card} ${isCircle ? styles.cardCircle : ''}`}>
              {/* Photo / initials — wrapped for circle glow */}
              <div className={isCircle ? styles.circlePhotoWrapper : undefined}>
                {sel.src ? (
                  <img
                    className={`${styles.cardPhoto} ${isCircle ? styles.cardPhotoCircle : ''}`}
                    src={sel.src}
                    alt=""
                  />
                ) : (
                  <div className={`${styles.cardInitials} ${isCircle ? styles.cardInitialsCircle : ''}`}>
                    {sel.employee.firstName[0]}{sel.employee.lastName[0]}
                  </div>
                )}
              </div>

              {/* Name / role */}
              <div
                className={styles.cardBody}
                style={{
                  opacity:    showMeta ? 1 : 0,
                  transform:  showMeta ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s',
                }}
              >
                <div className={styles.cardName}>
                  {sel.employee.firstName} {sel.employee.lastName}
                </div>
                {showRole && sel.employee.role && (
                  <div className={styles.cardRole}>{sel.employee.role}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────
function Facewall({
  employees,
  featuredDurationSec = 5,
  scrollSpeed = 8,
  highlightColor = DEFAULT_COLOR,
  bgColor = '#1a2535',
  numRowsOverride = 0,
  cardSize = 300,
  liftMs = 800,
  dismissMs = 1200,
  pauseMs = 700,
  showRole = true,
  tileGap = 0,
  cardShape = 'rounded',
  showClock = false,
  excludedRoles = '',
  navHidden = false,
}: Props) {
  const [vh, setVh] = useState(window.innerHeight);
  const [photoEmployees, setPhotoEmployees] = useState<Employee[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [phase, setPhase]         = useState<Phase>('pause');
  const [fadedEmail, setFadedEmail]  = useState<string | null>(null);
  const [dismissPos, setDismissPos]  = useState<{ left: number; top: number } | null>(null);
  const [isPaused, setIsPaused]      = useState(false);

  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef      = useRef<Employee[]>([]);
  const mountedRef    = useRef(true);
  const durationRef   = useRef(featuredDurationSec * 1000);
  const tileSizeRef   = useRef(150);
  const numRowsRef    = useRef(0);
  const rowIndexRef   = useRef<Map<string, number>>(new Map());
  const isPausedRef   = useRef(false);
  const resumeFnRef   = useRef<(() => void) | null>(null);
  const photoPoolRef  = useRef<Employee[]>([]);

  durationRef.current   = featuredDurationSec * 1000;
  isPausedRef.current   = isPaused;
  photoPoolRef.current  = photoEmployees;

  // Timing refs so callbacks always see latest values without re-creating them
  const liftMsRef    = useRef(liftMs);    liftMsRef.current    = liftMs;
  const dismissMsRef = useRef(dismissMs); dismissMsRef.current = dismissMs;
  const pauseMsRef   = useRef(pauseMs);   pauseMsRef.current   = pauseMs;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const h = () => setVh(window.innerHeight);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Spacebar → pause / resume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // When unpausing, fire any stored resume callback
  useEffect(() => {
    if (!isPaused && resumeFnRef.current) {
      const fn = resumeFnRef.current;
      resumeFnRef.current = null;
      fn();
    }
  }, [isPaused]);

  const { numRows, rowData } = useMemo(() => {
    if (!employees.length) return { numRows: 0, rowData: [] as Employee[][] };
    const n  = employees.length;
    const nr = numRowsOverride > 0
      ? Math.min(numRowsOverride, n)
      : Math.min(calcNumRows(n), n);
    const perRow   = Math.ceil(n / nr);
    const shuffled = shuffle([...employees]);
    const rows: Employee[][] = Array.from({ length: nr }, (_, r) =>
      shuffled.slice(r * perRow, Math.min((r + 1) * perRow, n))
    );
    return { numRows: nr, rowData: rows };
  }, [employees, numRowsOverride]);

  const tileSize      = numRows > 0 ? Math.floor((vh - (navHidden ? 0 : NAV_H)) / numRows) : 150;
  tileSizeRef.current = tileSize;
  numRowsRef.current  = numRows;

  useEffect(() => {
    const map = new Map<string, number>();
    rowData.forEach((row, ri) => row.forEach(emp => map.set(emp.email, ri)));
    rowIndexRef.current = map;
  }, [rowData]);

  // Excluded roles set (lowercased for case-insensitive matching)
  const excludedRoleSet = useMemo(() => {
    return new Set(
      excludedRoles
        .split('\n')
        .map(r => r.trim().toLowerCase())
        .filter(Boolean)
    );
  }, [excludedRoles]);

  // ── Photo filtering ───────────────────────────────────────────────
  // Skip the startup probe — at 10K employees it would fire 10K simultaneous
  // HTTP requests. Instead, include anyone with a gravatar URL and let the
  // browser's lazy-loading + per-tile onerror handler deal with broken images.
  useEffect(() => {
    if (!employees.length) return;
    setPhotoEmployees(employees.filter((e) => !!e.gravatar));
  }, [employees]);

  // ── Sequence controller ──────────────────────────────────────────
  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const showNext = useCallback((pool: Employee[], forceEmp?: Employee) => {
    if (!mountedRef.current || !pool.length) return;

    const nr = numRowsRef.current;
    const ts = tileSizeRef.current;

    const fallback = () => ({
      left: window.innerWidth  / 2 - ts / 2,
      top:  window.innerHeight / 2 - ts / 2,
    });

    // Shared dismiss → pause → next logic (extracted so pause can resume here)
    const doDismiss = (emp: Employee, nextPool: Employee[]) => {
      if (!mountedRef.current) return;
      const dPos = queryTilePos(emp.email) ?? fallback();
      setDismissPos(dPos);
      setFadedEmail(null);
      setPhase('dismiss');

      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setSelection(null);
        setDismissPos(null);
        setPhase('pause');

        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          showNext(nextPool);
        }, pauseMsRef.current);
      }, dismissMsRef.current);
    };

    // Filter by excluded roles
    const roleFiltered = excludedRoleSet.size > 0
      ? pool.filter(emp => !excludedRoleSet.has((emp.role ?? '').toLowerCase()))
      : pool;

    // Exclude top/bottom rows
    const middlePool = nr > 2
      ? roleFiltered.filter(emp => {
          const ri = rowIndexRef.current.get(emp.email) ?? 1;
          return ri > 0 && ri < nr - 1;
        })
      : roleFiltered;
    const activePool = middlePool.length ? middlePool : (roleFiltered.length ? roleFiltered : pool);

    // Pick employee
    let emp: Employee;
    if (forceEmp) {
      emp = forceEmp;
    } else {
      const activePoolEmails = new Set(activePool.map(e => e.email));
      let q = queueRef.current.filter(e => activePoolEmails.has(e.email));
      if (!q.length) q = shuffle([...activePool]);
      emp = q.shift()!;
      queueRef.current = q;
    }

    const src    = gravatarUrlSized(emp.gravatar!, cardSize);
    const probe  = new Image();

    probe.onload = () => {
      if (!mountedRef.current) return;

      const initialPos = queryTilePos(emp.email) ?? fallback();

      // Skip tiles in the outermost 15% of viewport width
      const tileCenter = initialPos.left + ts / 2;
      const edgeMargin = window.innerWidth * 0.15;
      if (!forceEmp && (tileCenter < edgeMargin || tileCenter > window.innerWidth - edgeMargin)) {
        showNext(pool);
        return;
      }

      // Phase 1: highlight
      setFadedEmail(null);
      setDismissPos(null);
      setSelection({ employee: emp, src, tileLeft: initialPos.left, tileTop: initialPos.top });
      setPhase('highlight');

      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        // Phase 2: lifting
        const liftPos = queryTilePos(emp.email) ?? fallback();
        setFadedEmail(emp.email);
        setSelection({ employee: emp, src, tileLeft: liftPos.left, tileTop: liftPos.top });
        setPhase('lifting');

        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;

          // Phase 3: show
          setPhase('show');

          timerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;

            // Phase 4: dismiss (or store for resume if paused)
            if (isPausedRef.current) {
              resumeFnRef.current = () => doDismiss(emp, pool);
              return;
            }
            doDismiss(emp, pool);
          }, durationRef.current);
        }, liftMsRef.current);
      }, 1000); // HIGHLIGHT_MS
    };

    probe.onerror = () => {
      if (!mountedRef.current) return;
      showNext(pool.filter((e) => e.email !== emp.email));
    };

    probe.src = src;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludedRoleSet, cardSize]);

  // Click a tile to feature it immediately
  const handleTileClick = useCallback((emp: Employee) => {
    if (!photoPoolRef.current.some(e => e.email === emp.email)) return;
    isPausedRef.current = false;
    resumeFnRef.current = null;
    setIsPaused(false);
    clear();
    setSelection(null);
    setFadedEmail(null);
    setDismissPos(null);
    setPhase('pause');
    timerRef.current = setTimeout(() => {
      showNext(photoPoolRef.current, emp);
    }, 50);
  }, [clear, showNext]);

  useEffect(() => {
    if (!photoEmployees.length) return;
    const t = setTimeout(() => showNext(photoEmployees), 800);
    return () => { clearTimeout(t); clear(); };
  }, [photoEmployees, showNext, clear]);

  if (!rowData.length) {
    return (
      <div className={styles.root} style={{ background: bgColor }}>
        <div style={{ color: '#aaa', padding: 60, textAlign: 'center' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={styles.root} style={{ background: bgColor }}>
      {/* ── Scrolling rows ───────────────────────────────── */}
      <div
        className={styles.rowsContainer}
        style={{ top: navHidden ? 0 : NAV_H }}
      >
        {rowData.map((row, ri) => {
          const goLeft = ri % 2 === 0;
          // One loop width includes trailing gap so -50% lands exactly at second copy
          const oneLoop  = row.length * (tileSize + tileGap);
          const duration = oneLoop / scrollSpeed;

          return (
            <div key={ri} className={styles.row} style={{ height: tileSize }}>
              <div
                className={styles.rowStrip}
                style={{
                  width:     oneLoop * 2,
                  height:    tileSize,
                  gap:       tileGap,
                  animation: `${goLeft ? 'facewallScrollLeft' : 'facewallScrollRight'} ${duration}s linear infinite`,
                }}
              >
                {[...row, ...row].map((emp, i) => (
                  <Tile
                    key={`${ri}-${i}`}
                    emp={emp}
                    size={tileSize}
                    faded={emp.email === fadedEmail}
                    onClick={handleTileClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Highlight ring ────────────────────────────────── */}
      {selection && phase === 'highlight' && (
        <HighlightRing
          email={selection.employee.email}
          tileSize={tileSize}
          color={highlightColor}
        />
      )}

      {/* ── Featured card ────────────────────────────────── */}
      {selection && (phase === 'lifting' || phase === 'show' || phase === 'dismiss') && (
        <FeaturedCard
          sel={selection}
          phase={phase as 'lifting' | 'show' | 'dismiss'}
          tileSize={tileSize}
          dismissPos={dismissPos}
          highlightColor={highlightColor}
          cardSize={cardSize}
          showRole={showRole}
          cardShape={cardShape}
          liftMs={liftMs}
          dismissMs={dismissMs}
        />
      )}

      {/* ── Clock ────────────────────────────────────────── */}
      {showClock && <Clock />}

      {/* ── Pause indicator ──────────────────────────────── */}
      {isPaused && (
        <div className={styles.pauseBadge}>
          ⏸ Paused — press Space to resume
        </div>
      )}
    </div>
  );
}

export default Facewall;
