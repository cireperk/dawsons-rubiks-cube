import { useState, useEffect, useCallback } from "react";
import Fireworks from "./components/Fireworks";
import RubiksCube3D from "./components/RubiksCube3D";
import { tutorialSteps } from "./tutorialSteps";
import "./App.css";

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 800);
    }, 4000);
    return () => clearTimeout(timer);
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
      <div className="splash-subtitle">Loading awesomeness...</div>
    </div>
  );
}

function TutorialView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < tutorialSteps.length) {
        // Mark current step as completed when moving forward
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
      <Fireworks />

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
              <button
                className="step-btn next"
                onClick={() => {
                  setCompletedSteps(
                    new Set(tutorialSteps.map((_, i) => i))
                  );
                }}
              >
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
  const [showSplash, setShowSplash] = useState(true);

  return showSplash ? (
    <SplashScreen onFinish={() => setShowSplash(false)} />
  ) : (
    <TutorialView />
  );
}

export default App;
