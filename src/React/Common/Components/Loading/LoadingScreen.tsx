import React, { useEffect, useState } from 'react';
import FinchMark from '@/React/Common/Components/Loading/FinchMark.tsx';
import { cipherOf, scrambleFrame } from '@/React/Common/Components/Loading/Scramble.ts';

const logoMs = 600;
const typeMs = 30;
const holdMs = 600;
const shuffleMs = 70;
const transitionMs = 700;
const frameMs = 35;

interface LoadingScreenProps {
    label?: string;
    children?: React.ReactNode;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ label = 'Loading', children }) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [logoVisible, setLogoVisible] = useState(reducedMotion);
    const [display, setDisplay] = useState(reducedMotion ? label : '');
    const [settled, setSettled] = useState(reducedMotion);

    useEffect(() => {
        if (reducedMotion) {
            setDisplay(label);
            return;
        }

        let cancelled = false;
        const timers = new Set<number>();
        const wait = (ms: number) =>
            new Promise<void>((resolve, reject) => {
                const timer = window.setTimeout(() => {
                    timers.delete(timer);
                    if (cancelled) reject(new Error('cancelled'));
                    else resolve();
                }, ms);
                timers.add(timer);
            });

        const run = async () => {
            requestAnimationFrame(() => setLogoVisible(true));
            await wait(logoMs);

            let cipher = cipherOf(label);
            for (let n = 1; n <= cipher.length; n++) {
                setDisplay(cipher.slice(0, n));
                await wait(typeMs);
            }

            for (let elapsed = 0; elapsed < holdMs; elapsed += shuffleMs) {
                cipher = cipherOf(label);
                setDisplay(cipher);
                await wait(shuffleMs);
            }

            const start = performance.now();
            for (;;) {
                const progress = (performance.now() - start) / transitionMs;
                setDisplay(scrambleFrame(cipher, label, progress));
                if (progress >= 1) break;
                await wait(frameMs);
            }
            setSettled(true);
        };

        run().catch(() => {});
        return () => {
            cancelled = true;
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [label, reducedMotion]);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-canvas" role="status" aria-label={label}>
            <FinchMark
                className={`h-20 w-auto transition-all duration-500 ease-out ${
                    logoVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
            />
            <p
                className={`mt-8 h-[1.5em] font-mono text-lg leading-[1.5] tracking-wide whitespace-pre select-none transition-colors duration-500 ${
                    settled ? 'text-fg' : 'text-fg-subtle'
                }`}
                aria-hidden="true"
            >
                {display}
            </p>
            {children && (
                <div
                    className={`mt-3 text-center text-sm text-fg-subtle transition-opacity duration-500 ${
                        settled ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default LoadingScreen;
