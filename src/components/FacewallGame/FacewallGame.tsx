import { useCallback, useEffect, useRef, useState } from 'react';
import type { Employee, HighScore } from '../../types';
import { gravatarUrlSized } from '../../utils/gravatar';
import { saveHighScore, getHighScores } from '../../services/highScores';
import styles from './FacewallGame.module.css';

interface Props {
  employees: Employee[];
}

interface Guess {
  employee: Employee;
  state: 'idle' | 'wrong' | 'correct';
}

interface ScoreState {
  correct: number;
  total: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PHOTO_SIZE = 400;
const THUMB_SIZE = 40;
const SIDEBAR_SIZE = 160;
const NEEDED = 20;

function FacewallGame({ employees }: Props) {
  const [goodEmployees, setGoodEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentSrc, setCurrentSrc] = useState('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [score, setScore] = useState<ScoreState>({ correct: 0, total: 0 });
  const [currentCorrect, setCurrentCorrect] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');

  const scoreRef = useRef(score);
  scoreRef.current = score;

  // Load good employees (those with gravatar images that actually load)
  useEffect(() => {
    if (!employees.length) return;

    const results: Employee[] = [];
    let loaded = 0;

    const check = () => {
      loaded++;
      if (results.length >= NEEDED || loaded === employees.length) {
        setGoodEmployees(results.slice(0, Math.max(results.length, NEEDED)));
        setLoading(false);
      }
    };

    for (const emp of employees) {
      if (!emp.gravatar) { check(); continue; }
      const img = new Image();
      img.onload = () => { results.push(emp); check(); };
      img.onerror = () => { check(); };
      img.src = gravatarUrlSized(emp.gravatar, SIDEBAR_SIZE);
    }
  }, [employees]);

  const nextQuestion = useCallback(
    (pool: Employee[]) => {
      if (!pool.length) return;
      setCurrentCorrect(false);

      const picked = shuffle(pool).slice(0, 10);
      const answer = shuffle(picked)[0];

      const img = new Image();
      img.onload = () => {
        setCurrentEmployee(answer);
        setCurrentSrc(gravatarUrlSized(answer.gravatar!, PHOTO_SIZE));
        setGuesses(picked.map((emp) => ({ employee: emp, state: 'idle' })));
      };
      img.onerror = () => nextQuestion(pool.filter((e) => e.email !== answer.email));
      img.src = gravatarUrlSized(answer.gravatar!, PHOTO_SIZE);
    },
    []
  );

  useEffect(() => {
    if (goodEmployees.length >= 10) {
      nextQuestion(goodEmployees);
    }
  }, [goodEmployees, nextQuestion]);

  const handleGuess = (emp: Employee) => {
    if (currentCorrect) return;
    if (!currentEmployee) return;

    if (emp.email === currentEmployee.email) {
      setGuesses((g) => g.map((gs) => ({ ...gs, state: gs.employee.email === emp.email ? 'correct' : gs.state })));
      setCurrentCorrect(true);
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      setTimeout(() => nextQuestion(goodEmployees), 600);
    } else {
      setGuesses((g) => g.map((gs) => ({ ...gs, state: gs.employee.email === emp.email ? 'wrong' : gs.state })));
      setScore((s) => ({ ...s, total: s.total + 1 }));
    }
  };

  const openScoreModal = () => {
    setHighScores(getHighScores());
    setSubmitted(false);
    setShowScoreModal(true);
  };

  const submitScore = () => {
    const s = scoreRef.current;
    saveHighScore({ email: playerEmail, name: playerName || 'Anonymous', correct: s.correct, total: s.total });
    setHighScores(getHighScores());
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
        Loading employee photos…
      </div>
    );
  }

  if (goodEmployees.length < 10) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
        Not enough employees with photos to play (need at least 10).
      </div>
    );
  }

  const sidebarEmployees = shuffle(goodEmployees).slice(0, 10);

  return (
    <div className={styles.root}>
      {/* Left sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          {sidebarEmployees.map((emp) => (
            <div key={emp.email} className={styles.sidebarTile}>
              <img src={gravatarUrlSized(emp.gravatar!, SIDEBAR_SIZE)} alt="" />
            </div>
          ))}
        </div>
      </div>

      {/* Center */}
      <div className={styles.center}>
        <div className={styles.title}>Who is this?</div>

        <div className={`${styles.currentEmployee} ${currentCorrect ? styles.correct : ''}`}>
          {currentSrc && <img src={currentSrc} alt="Who is this?" />}
        </div>

        <div className={styles.guesses}>
          {guesses.map(({ employee: emp, state }) => (
            <div
              key={emp.email}
              className={`${styles.guessOption} ${state === 'wrong' ? styles.guessed : ''} ${state === 'correct' ? styles.correct : ''}`}
              onClick={() => handleGuess(emp)}
            >
              <img src={gravatarUrlSized(emp.gravatar!, THUMB_SIZE)} alt="" />
              <span className={styles.guessName}>
                <strong>{emp.firstName}</strong> {emp.lastName}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.scoreBoard} onClick={openScoreModal}>
          Score: <strong>{score.correct}</strong> / {score.total} — click to submit & view high scores
        </div>
      </div>

      {/* Right sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          {shuffle(goodEmployees).slice(0, 10).map((emp) => (
            <div key={emp.email} className={styles.sidebarTile}>
              <img src={gravatarUrlSized(emp.gravatar!, SIDEBAR_SIZE)} alt="" />
            </div>
          ))}
        </div>
      </div>

      {/* Score modal */}
      {showScoreModal && (
        <div className={styles.modalOverlay} onClick={() => setShowScoreModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>High Scores</h2>

            {!submitted ? (
              <>
                <p>
                  Submit your score of <strong>{score.correct}</strong> out of <strong>{score.total}</strong>?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <input
                    placeholder="Your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1em' }}
                  />
                  <input
                    placeholder="Your email (optional)"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1em' }}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowScoreModal(false)}>Cancel</button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submitScore}>Submit</button>
                </div>
              </>
            ) : (
              <p style={{ color: '#4caf50' }}>Score submitted!</p>
            )}

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <thead>
                <tr style={{ color: '#888' }}>
                  <th style={{ textAlign: 'left', paddingBottom: 8 }}>Name</th>
                  <th style={{ textAlign: 'right', paddingBottom: 8 }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {highScores.length === 0 && (
                  <tr><td colSpan={2} style={{ color: '#aaa', textAlign: 'center', padding: '12px 0' }}>No scores yet</td></tr>
                )}
                {highScores.slice(0, 10).map((hs) => (
                  <tr key={hs.id}>
                    <td style={{ padding: '4px 0' }}>{hs.name}</td>
                    <td style={{ textAlign: 'right' }}>{hs.correct}/{hs.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.modalActions} style={{ marginTop: 16 }}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowScoreModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacewallGame;
