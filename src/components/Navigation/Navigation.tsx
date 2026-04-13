import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navigation.module.css';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Props {
  hidden?: boolean;
  navColor?: string;
}

// SVG icons inline so there's no asset dependency
function ExpandIcon() {
  return (
    <svg className={styles.fsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg className={styles.fsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  );
}

function Navigation({ hidden = false, navColor }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser denied fullscreen (e.g. iframe) — nav hide still applies via hidden prop
    }
  };

  return (
    <nav
      className={`${styles.nav} ${hidden ? styles.hidden : ''}`}
      style={navColor ? { background: hexToRgba(navColor, 0.92) } : undefined}
    >
      <NavLink to="/" className={styles.brand}>
        Facewall
      </NavLink>

      <div className={styles.spacer} />

      <NavLink
        to="/settings"
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
      >
        Settings
      </NavLink>

      <button className={styles.fsBtn} onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen' : 'Full screen'}>
        {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
        {isFullscreen ? 'Exit' : 'Full Screen'}
      </button>
    </nav>
  );
}

export default Navigation;
