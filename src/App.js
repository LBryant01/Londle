import React, { useState, useEffect, useCallback } from "react";
import "./Wordles.css";
import thumbnail from "./319th_Combat_Training_Squadron_emblem.png";

const TITLE = "LONDLE";

// ─── Tile color logic ───────────────────────────────────────────────────────
function getTileClass(letter, index, guess, targetWord) {
  const target = targetWord.split("");
  const guessLetters = guess.split("");
  const count = target.reduce((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const classes = Array(targetWord.length).fill("absent");

  for (let i = 0; i < targetWord.length; i++) {
    if (guessLetters[i] === target[i]) {
      classes[i] = "correct";
      count[guessLetters[i]]--;
    }
  }
  for (let i = 0; i < targetWord.length; i++) {
    if (
      classes[i] === "absent" &&
      target.includes(guessLetters[i]) &&
      count[guessLetters[i]] > 0
    ) {
      classes[i] = "present";
      count[guessLetters[i]]--;
    }
  }
  return classes[index];
}

// ─── Instructor Setup Screen ─────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [wordInput, setWordInput] = useState("");
  const [hintInput, setHintInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    const word = wordInput.trim().toUpperCase();
    const hint = hintInput.trim();

    if (word.length < 2) {
      setError("Word must be at least 2 letters.");
      return;
    }
    if (!hint) {
      setError("Please enter a hint for students.");
      return;
    }

    setError("Checking word…");
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      if (!res.ok) {
        setError("Word not found in dictionary. Try another.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not verify word. Check your connection.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onStart(word, hint);
  };

  return (
    <div className="wordle-container">
      <img src={thumbnail} alt="App Icon" className="app-icon" />

      <div className="Title">
        {TITLE.split("").map((letter, i) => (
          <span key={i} style={{ "--index": i }}>
            {letter}
          </span>
        ))}
      </div>

      <div className="setup-badge">Instructor Setup</div>

      <div className="setup-card">
        <label className="setup-label">Secret Word</label>
        <input
          className="setup-input setup-input--word"
          type="text"
          placeholder="e.g. CRANE"
          value={wordInput}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) =>
            setWordInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
          }
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
        />

        <label className="setup-label">Hint for Students</label>
        <input
          className="setup-input"
          type="text"
          placeholder="e.g. A type of machine"
          value={hintInput}
          autoComplete="off"
          onChange={(e) => setHintInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
        />

        {error && <p className="setup-error">{error}</p>}

        <button
          className="setup-btn"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? "Checking…" : "Start Game →"}
        </button>
      </div>
    </div>
  );
}

// ─── Game Screen ─────────────────────────────────────────────────────────────
function GameScreen({ targetWord, hint, onReset }) {
  const maxAttempts = 6;
  const wordLength = targetWord.length;

  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState("playing");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [flippingIndices, setFlippingIndices] = useState([]);
  const [revealedTiles, setRevealedTiles] = useState([]);

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const handleSubmit = useCallback(async () => {
    if (currentGuess.length !== wordLength) {
      setError(`Word must be ${wordLength} letters.`);
      return;
    }
    setError("Checking…");
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${currentGuess}`
      );
      if (!res.ok) {
        setError("Not a valid word. Try again.");
        return;
      }
    } catch {
      setError("Dictionary lookup failed. Try again.");
      return;
    }
    setError("");

    // Animate tiles
    for (let i = 0; i < wordLength; i++) {
      setTimeout(() => {
        setFlippingIndices((prev) => [...prev, i]);
        setTimeout(() => setRevealedTiles((prev) => [...prev, i]), 250);
      }, i * 300);
    }

    setTimeout(() => {
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setFlippingIndices([]);
      setRevealedTiles([]);

      if (currentGuess === targetWord) {
        setGameStatus("won");
      } else if (newGuesses.length >= maxAttempts) {
        setGameStatus("lost");
      }

      setCurrentGuess("");
      setAttempt((a) => a + 1);
    }, wordLength * 300 + 500);
  }, [currentGuess, guesses, targetWord, wordLength]);

  const handleInput = useCallback(
    (key) => {
      if (gameStatus !== "playing") return;
      if (key === "ENTER") {
        handleSubmit();
      } else if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        setError("");
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
        setCurrentGuess((prev) => prev + key);
        setError("");
      }
    },
    [gameStatus, currentGuess, wordLength, handleSubmit]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        handleInput(key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleInput]);

  const getKeyClass = (key) => {
    let best = "";
    for (const g of guesses) {
      const idx = g.indexOf(key);
      if (idx === -1) continue;
      const cls = getTileClass(key, idx, g, targetWord);
      if (cls === "correct") return "correct";
      if (cls === "present") best = "present";
      else if (!best) best = "absent";
    }
    return best;
  };

  const handleAcronymClick = () => {
    window.location.href = "https://aa-finder.vercel.app/";
  };

  return (
    <div className="wordle-container">
      <img src={thumbnail} alt="App Icon" className="app-icon" />

      <div className="Title">
        {TITLE.split("").map((letter, i) => (
          <span key={i} style={{ "--index": i }}>
            {letter}
          </span>
        ))}
      </div>

      {/* Hint display */}
      <div className="hint-box">
        <span className="hint-label">Hint:</span> {hint}
        <span className="hint-length"> · {wordLength} letters</span>
      </div>

      {error && <p className="game-error">{error}</p>}

      {/* Grid */}
      <div className="grid">
        {Array.from({ length: maxAttempts }).map((_, rowIndex) => (
          <div key={rowIndex} className="row">
            {Array.from({ length: wordLength }).map((_, colIndex) => {
              const guess = guesses[rowIndex] || "";
              const isActive = rowIndex === guesses.length;
              const letter = isActive
                ? currentGuess[colIndex] || ""
                : guess[colIndex] || "";

              const isFlipping =
                isActive && flippingIndices.includes(colIndex);
              const isRevealed =
                isActive && revealedTiles.includes(colIndex);

              const tileClass =
                rowIndex < guesses.length
                  ? getTileClass(letter, colIndex, guess, targetWord)
                  : isRevealed
                  ? getTileClass(letter, colIndex, currentGuess, targetWord)
                  : "empty";

              return (
                <div
                  key={colIndex}
                  className={`tile ${tileClass} ${isFlipping ? "flipping" : ""}`}
                  style={{ transitionDelay: `${0.1 * colIndex}s` }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      {gameStatus === "playing" && (
        <div className="keyboard">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
              {row.map((key) => (
                <button
                  key={key}
                  className={`key ${getKeyClass(key)}`}
                  onClick={() => handleInput(key)}
                >
                  {key}
                </button>
              ))}
              {rowIndex === 2 && (
                <>
                  <button
                    className="key special"
                    onClick={() => handleInput("BACKSPACE")}
                  >
                    ⌫
                  </button>
                  <button
                    className="key special"
                    onClick={() => handleInput("ENTER")}
                  >
                    ⏎
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Win state */}
      {gameStatus === "won" && (
        <>
          <h2>
            Correct! Guessed in {attempt} attempt{attempt !== 1 ? "s" : ""}! 🎉
          </h2>
          <p>Need help on bullet writing? Click below!</p>
          <br />
          <button onClick={handleAcronymClick} className="Acronym">
            Acronym Finder
          </button>
        </>
      )}

      {/* Loss state */}
      {gameStatus === "lost" && (
        <>
          <h2>The correct word was "{targetWord}".</h2>
          <p>Need help on bullet writing? Click below!</p>
          <br />
          <button onClick={handleAcronymClick} className="Acronym">
            Acronym Finder
          </button>
        </>
      )}

      {/* Reset for instructor */}
      <button className="reset-btn" onClick={onReset}>
        ↩ New Word (Instructor)
      </button>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
const App = () => {
  const [targetWord, setTargetWord] = useState("");
  const [hint, setHint] = useState("");
  const [mode, setMode] = useState("setup"); // "setup" | "game"

  const handleStart = (word, hintText) => {
    setTargetWord(word);
    setHint(hintText);
    setMode("game");
  };

  const handleReset = () => {
    setTargetWord("");
    setHint("");
    setMode("setup");
  };

  if (mode === "setup") {
    return <SetupScreen onStart={handleStart} />;
  }

  return (
    <GameScreen
      targetWord={targetWord}
      hint={hint}
      onReset={handleReset}
    />
  );
};

export default App;

