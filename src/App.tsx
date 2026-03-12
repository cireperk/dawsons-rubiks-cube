import { useState, useEffect, useCallback } from "react";
import Fireworks from "./components/Fireworks";
import RubiksCube3D from "./components/RubiksCube3D";
import { tutorialSteps } from "./tutorialSteps";
import "./App.css";

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Show the message after 2s so the title has time to be read
    const msgTimer = setTimeout(() => setShowMessage(true), 2000);
    // Then fade out after 8s total
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 800);
    }, 8000);
    return () => {
      clearTimeout(msgTimer);
      clearTimeout(fadeTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fadeOut ? "fade-out" : ""}`}>
      <Fireworks />
      <div className="splash-title">
        Dawson's
        <br />
        How to Solve a Rubik's Cube
      </div>
      <div className="splash-cube-container">
        <RubiksCube3D speed={1.2} />
      </div>
      {showMessage && (
        <div className="splash-message">
          Hi, my name is Dawson and I love Rubik's cubes. My dad and I made this
          app to help solve Rubik's cubes!
        </div>
      )}
    </div>
  );
}

function ThanksScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="thanks-screen">
      <Fireworks />
      <Fireworks />
      <Fireworks />
      <div className="thanks-content">
        <div className="thanks-cube">
          <RubiksCube3D speed={0.8} />
        </div>
        <h1 className="thanks-title">You Did It!</h1>
        <p className="thanks-message">
          Thanks for using Dawson's Rubik's Cube app
        </p>
        <p className="thanks-credit">Built by Dawson and Dad</p>
        <button className="thanks-restart" onClick={onRestart}>
          Start Over
        </button>
      </div>
    </div>
  );
}

function TutorialView({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < tutorialSteps.length) {
        if (step > currentStep) {
          setCompletedSteps((prev) => new Set([...prev, currentStep]));
        }
        setCurrentStep(step);
      }
    },
    [currentStep]
  );

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Dawson's How to Solve a Rubik's Cube</h1>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          Step {currentStep + 1} of {tutorialSteps.length}
        </div>
      </div>

      <div className="tutorial-container">
        <div className="step-navigation">
          {tutorialSteps.map((_, i) => (
            <button
              key={i}
              className={`step-dot ${i === currentStep ? "active" : ""} ${
                completedSteps.has(i) ? "completed" : ""
              }`}
              onClick={() => goToStep(i)}
            >
              {completedSteps.has(i) ? "✓" : i + 1}
            </button>
          ))}
        </div>

        <div className="step-card" key={currentStep}>
          <h2>{step.title}</h2>
          <h3>{step.subtitle}</h3>

          <div className="cube-scene-container">
            <RubiksCube3D moves={step.demoMoves} interactive />
            <div className="cube-hint">
              Swipe a face to turn it · Drag background to orbit
            </div>
          </div>

          {step.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}

          {step.algorithm && (
            <div className="algorithm">
              {step.algorithm.split(" ").map((move, i) => (
                <span key={i}>
                  <span className="notation">{move}</span>{" "}
                </span>
              ))}
            </div>
          )}

          {step.tip && (
            <div className="tip">
              <strong>💡 Tip: </strong>
              {step.tip}
            </div>
          )}

          <div className="step-buttons">
            {currentStep > 0 && (
              <button
                className="step-btn prev"
                onClick={() => goToStep(currentStep - 1)}
              >
                ← Previous
              </button>
            )}
            {currentStep < tutorialSteps.length - 1 ? (
              <button
                className="step-btn next"
                onClick={() => goToStep(currentStep + 1)}
              >
                Next Step →
              </button>
            ) : (
              <button className="step-btn next" onClick={onComplete}>
                🎉 I Did It!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<"splash" | "tutorial" | "thanks">(
    "splash"
  );

  return screen === "splash" ? (
    <SplashScreen onFinish={() => setScreen("tutorial")} />
  ) : screen === "tutorial" ? (
    <TutorialView onComplete={() => setScreen("thanks")} />
  ) : (
    <ThanksScreen onRestart={() => setScreen("splash")} />
  );
}

export default App;
