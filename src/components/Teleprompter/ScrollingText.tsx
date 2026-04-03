import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

interface ScrollingTextProps {
  text: string;
  speed: number;       // 1-10
  isPlaying: boolean;
  fontSize: number;    // px
  opacity: number;     // fond semi-transparent 0.3-1.0
  onScrollEnd?: () => void;
}

export interface ScrollingTextHandle {
  reset: () => void;
}

// Convertit speed (1-10) en pixels par frame à 60fps
function speedToPxPerFrame(speed: number): number {
  // speed 1 = 0.3px/frame, speed 10 = 4px/frame (progression exponentielle)
  return 0.3 * Math.pow(10 / 3, (speed - 1) / 9);
}

const ScrollingText = forwardRef<ScrollingTextHandle, ScrollingTextProps>(
  ({ text, speed, isPlaying, fontSize, opacity, onScrollEnd }, ref) => {
    const [offset, setOffset] = useState(0);
    const rafRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const onScrollEndRef = useRef(onScrollEnd);
    onScrollEndRef.current = onScrollEnd;

    useImperativeHandle(ref, () => ({
      reset: () => {
        setOffset(0);
        lastTimeRef.current = undefined;
      },
    }));

    useEffect(() => {
      if (!isPlaying) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        lastTimeRef.current = undefined;
        return;
      }

      const pxPerFrame = speedToPxPerFrame(speed);

      const animate = (time: number) => {
        if (lastTimeRef.current !== undefined) {
          const delta = time - lastTimeRef.current;
          const frameFactor = delta / 16.667; // normalise à 60fps

          setOffset(prev => {
            const containerH = containerRef.current?.clientHeight ?? 0;
            const textH = textRef.current?.scrollHeight ?? 0;
            const maxOffset = Math.max(0, textH - containerH / 2);

            const next = prev + pxPerFrame * frameFactor;
            if (next >= maxOffset) {
              onScrollEndRef.current?.();
              return maxOffset;
            }
            return next;
          });
        }
        lastTimeRef.current = time;
        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        lastTimeRef.current = undefined;
      };
    }, [isPlaying, speed]);

    // Reset offset when text changes
    useEffect(() => {
      setOffset(0);
      lastTimeRef.current = undefined;
    }, [text]);

    const paragraphs = text.split('\n').filter((_, i, arr) => {
      // Garder les lignes vides sauf les doublons consécutifs
      return true;
    });

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        {/* Gradient haut (texte déjà lu) */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{ height: '30%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)' }}
        />

        {/* Ligne de lecture active */}
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none"
          style={{
            top: '35%',
            height: '22%',
            background: `rgba(0,0,0,${Math.max(0, opacity - 0.3)})`,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        />

        {/* Gradient bas (texte à venir) */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{ height: '25%', background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
        />

        {/* Texte qui défile */}
        <div
          ref={textRef}
          style={{
            transform: `translateY(-${offset}px)`,
            willChange: 'transform',
            padding: '0 24px',
          }}
        >
          {/* Padding initial : première ligne alignée sur la zone de lecture (≈37% du viewport) */}
          <div style={{ height: '38vh' }} />

          {paragraphs.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                color: 'white',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textAlign: 'center',
                margin: '0',
                padding: line === '' ? '0.4em 0' : '0.15em 0',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                minHeight: line === '' ? '0.8em' : undefined,
              }}
            >
              {line || '\u00A0'}
            </p>
          ))}

          {/* Padding final */}
          <div style={{ height: '60vh' }} />
        </div>
      </div>
    );
  }
);

ScrollingText.displayName = 'ScrollingText';
export default ScrollingText;
