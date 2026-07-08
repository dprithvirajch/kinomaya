import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import './AppTour.css';

const TOUR_STEPS = [
  {
    target: '.mood-scroll',
    title: 'Curate your Vibe',
    text: 'Tap any mood to instantly reshape your home feed based on exactly how you feel.',
    position: 'bottom'
  },
  {
    target: '#tour-trending',
    title: 'Global Sensations',
    text: 'See what the entire world is watching right now on major streaming platforms.',
    position: 'top'
  },
  {
    target: '#tour-indian',
    title: 'Local Hits',
    text: 'Discover the most popular regional and Indian streams available to watch instantly.',
    position: 'top'
  },
  {
    target: '#tour-tonight',
    title: 'Your Spotlight',
    text: 'A hand-picked masterpiece selected specifically for you tonight.',
    position: 'top'
  },
  {
    target: '#tour-gems',
    title: 'Hidden Gems',
    text: 'Highly rated, lesser-known titles that perfectly match your taste profile.',
    position: 'top'
  },
  {
    target: '#tour-laugh',
    title: 'Lighten the Mood',
    text: 'Because everyone needs a laugh. Here are some guaranteed hits.',
    position: 'top'
  },
  {
    target: '.fab-ai',
    title: 'Meet KinoMaya',
    text: 'Want something hyper-specific? Tap here to ask our AI for tailored recommendations.',
    position: 'top-left'
  }
];

const AppTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    const targetEl = document.querySelector(TOUR_STEPS[currentStep].target);
    
    // Only scroll once when the step changes
    if (targetEl) {
      const initialRect = targetEl.getBoundingClientRect();
      if (initialRect.top < 60 || initialRect.bottom > window.innerHeight - 60) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const measureTarget = () => {
      const el = document.querySelector(TOUR_STEPS[currentStep].target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right
        });
      }
    };
    
    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true); // Listen to all scroll events
    
    // Also re-measure a few times in case of smooth scrolling or layout shifts
    let animationFrameId;
    const continuousMeasure = () => {
      measureTarget();
      animationFrameId = requestAnimationFrame(continuousMeasure);
    };
    continuousMeasure();

    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      onComplete();
    }
  };

  if (!targetRect) return null;

  const step = TOUR_STEPS[currentStep];

  // Calculate popover position based on target and step.position
  let popoverStyle = { maxWidth: '400px' };
  if (step.position === 'bottom') {
    popoverStyle = { ...popoverStyle, top: targetRect.top + targetRect.height + 24, left: '50%', transform: 'translateX(-50%)', width: '90%' };
  } else if (step.position === 'top') {
    popoverStyle = { ...popoverStyle, top: targetRect.top - 24, left: '50%', transform: 'translate(-50%, -100%)', width: '90%' };
  } else if (step.position === 'top-left') {
    popoverStyle = { ...popoverStyle, top: targetRect.top - 24, right: window.innerWidth - targetRect.right, transform: 'translateY(-100%)', width: '280px' };
  }

  return (
    <div className="tour-overlay">
      <div 
        className="tour-highlight"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16
        }}
      />
      
      <div className="tour-popover fade-in" style={popoverStyle}>
        <button className="tour-close" onClick={onComplete}>
          <X size={16} />
        </button>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        
        <div className="tour-footer">
          <div className="tour-dots">
            {TOUR_STEPS.map((_, idx) => (
              <span key={idx} className={`tour-dot ${idx === currentStep ? 'active' : ''}`} />
            ))}
          </div>
          <button className="tour-next-btn" onClick={handleNext}>
            {currentStep === TOUR_STEPS.length - 1 ? (
              <>Got it <Check size={16} /></>
            ) : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
