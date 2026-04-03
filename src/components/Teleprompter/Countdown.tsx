import { useEffect, useState } from 'react';

interface CountdownProps {
  onComplete: () => void;
}

const Countdown = ({ onComplete }: CountdownProps) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40">
      <div
        key={count}
        className="text-white font-bold text-center"
        style={{
          fontSize: 'clamp(6rem, 30vw, 12rem)',
          animation: 'countdown-pop 0.9s ease-out forwards',
          textShadow: '0 4px 30px rgba(0,0,0,0.8)',
        }}
      >
        {count}
      </div>
      <style>{`
        @keyframes countdown-pop {
          0% { transform: scale(1.4); opacity: 0; }
          15% { opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Countdown;
