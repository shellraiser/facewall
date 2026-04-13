import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { Employee } from './types';
import { loadEmployees } from './services/employees';
import { getSettings } from './store/settings';
import Navigation from './components/Navigation/Navigation';
import Facewall from './components/Facewall/Facewall';
import Settings from './components/Settings/Settings';
import config from './config';

function AppShell() {
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const settings = getSettings();

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadEmployees(settings)
      .then(setEmployees)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once on mount; settings changes trigger a full page reload via Settings.tsx

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const isWallRoute = location.pathname === '/';
  const navHidden = (isFullscreen || settings.kioskMode) && isWallRoute;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: config.styles.background,
          color: `rgb(${config.styles.colorRgb})`,
          fontSize: '1.2em',
        }}
      >
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#1a1a1a',
          color: '#ef5350',
          flexDirection: 'column',
          gap: 12,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <strong style={{ fontSize: '1.1em' }}>Failed to load employees</strong>
        <code style={{ fontSize: '0.85em', color: '#aaa', maxWidth: 480 }}>{error}</code>
        <a href="/facewall/settings" style={{ color: '#3b82f6', marginTop: 8 }}>
          Go to Settings →
        </a>
      </div>
    );
  }

  return (
    <>
      <Navigation hidden={navHidden} navColor={settings.navColor} />
      <Routes>
        <Route
          path="/"
          element={
            <Facewall
              employees={employees}
              featuredDurationSec={settings.featuredDurationSec}
              scrollSpeed={settings.scrollSpeed}
              highlightColor={settings.highlightColor}
              bgColor={settings.bgColor}
              numRowsOverride={settings.numRowsOverride}
              cardSize={settings.cardSize}
              liftMs={settings.liftMs}
              dismissMs={settings.dismissMs}
              pauseMs={settings.pauseMs}
              showRole={settings.showRole}
              tileGap={settings.tileGap}
              cardShape={settings.cardShape}
              showClock={settings.showClock}
              excludedRoles={settings.excludedRoles}
              navHidden={navHidden}
            />
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename="/facewall">
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
