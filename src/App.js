// Full App with tile-by-tile flip animation
// Full App with flip and delayed color reveal
import React, { useState, useEffect } from "react";
import "./Wordles.css";
import thumbnail from "./thumbnail_7_SWS_patch.png";

const App = () => {
  const targetWord = "under".toUpperCase();
  const maxAttempts = 6;
  const wordLength = targetWord.length;

  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState("playing");
  const [attempt, setAttempt] = useState(0);
  const [flippingIndices, setFlippingIndices] = useState([]);
  const [revealedTiles, setRevealedTiles] = useState([]);

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const handleInput = (key) => {
    if (gameStatus !== "playing") return;

    if (key === "ENTER") {
      handleSubmit();
    } else if (key === "BACKSPACE") {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (key.length === 1 && currentGuess.length < wordLength) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  const handleClick = () => {
    window.location.href = "https://aa-finder.vercel.app/";
  };

  const handleSubmit = async () => {
    if (currentGuess.length !== wordLength) return;

    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${currentGuess}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        alert("Not a word");
        return;
      }
    } catch (error) {
      console.error("Error fetching dictionary API:", error);
      alert("Dictionary lookup failed. Please try again.");
      return;
    }

    for (let i = 0; i < wordLength; i++) {
      setTimeout(() => {
        setFlippingIndices((prev) => [...prev, i]);
        setTimeout(() => {
          setRevealedTiles((prev) => [...prev, i]);
        }, 250);
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
      setAttempt(attempt + 1);
    }, wordLength * 300 + 500);
  };

  const getTileClass = (letter, index, guess) => {
    const targetLetters = targetWord.split("");
    const guessLetters = guess.split("");
    const targetLetterCount = targetLetters.reduce((acc, char) => {
      acc[char] = (acc[char] || 0) + 1;
      return acc;
    }, {});

    const tileClasses = Array(wordLength).fill("absent");
    const usedIndices = [];

    for (let i = 0; i < wordLength; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        tileClasses[i] = "correct";
        targetLetterCount[guessLetters[i]]--;
        usedIndices.push(i);
      }
    }

    for (let i = 0; i < wordLength; i++) {
      if (
        tileClasses[i] === "absent" &&
        targetLetters.includes(guessLetters[i]) &&
        targetLetterCount[guessLetters[i]] > 0 &&
        !usedIndices.includes(i)
      ) {
        tileClasses[i] = "present";
        targetLetterCount[guessLetters[i]]--;
      }
    }

    return tileClasses[index];
  };

  const getKeyClass = (key) => {
    if (guesses.some((guess) => guess.includes(key))) {
      if (targetWord.includes(key)) {
        return guesses.some(
          (guess) => guess.split("")[targetWord.indexOf(key)] === key
        )
          ? "correct"
          : "present";
      } else {
        return "absent";
      }
    }
    return "";
  };

  const handleKeyDown = (event) => {
    const key = event.key.toUpperCase();
    if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
      handleInput(key);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentGuess, guesses, gameStatus]);

  const text = "LONDLE";

  return (
    <div className="wordle-container">
      <img src={thumbnail} alt="App Icon" className="app-icon" />
      <div className="Title">
        {text.split("").map((letter, index) => (
          <span key={index} style={{ "--index": index }}>
            {letter}
          </span>
        ))}
      </div>

      <div className="grid">
        {Array.from({ length: maxAttempts }).map((_, rowIndex) => (
          <div key={rowIndex} className="row">
            {Array.from({ length: wordLength }).map((_, colIndex) => {
              const guess = guesses[rowIndex] || "";
              const letter =
                rowIndex === guesses.length
                  ? currentGuess[colIndex] || ""
                  : guess[colIndex] || "";

              const isFlipping =
                rowIndex === guesses.length &&
                flippingIndices.includes(colIndex);
              const isRevealed =
                rowIndex === guesses.length && revealedTiles.includes(colIndex);

              const tileClass =
                rowIndex < guesses.length
                  ? getTileClass(letter, colIndex, guess)
                  : isRevealed
                  ? getTileClass(letter, colIndex, currentGuess)
                  : "empty";

              const classList = `tile ${tileClass} ${
                isFlipping ? "flipping" : ""
              }`;

              return (
                <div
                  key={colIndex}
                  className={classList}
                  style={{ transitionDelay: `${0.1 * colIndex}s` }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

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

      {gameStatus === "won" && (
        <>
          <h2>
            You've guessed the word in {attempt} attempt{attempt > 1 ? "s" : ""}
            ! 🎉
          </h2>
          <p>Need help on bullet writing? Click below!</p>
          <br />
          <button onClick={handleClick} className="Acronym">
            Acronym Finder
          </button>
        </>
      )}

      {gameStatus === "lost" && (
        <>
          <h2>The correct word was "{targetWord}".</h2>
          <p>Need help on bullet writing? Click below!</p>
          <br />
          <button onClick={handleClick} className="Acronym">
            Acronym Finder
          </button>
        </>
      )}
    </div>
  );
};

export default App;
