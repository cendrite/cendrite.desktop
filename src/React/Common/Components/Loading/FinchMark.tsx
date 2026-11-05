import React from 'react';

const folds = [
    '183.79,328.21 150.97,367.59 0.00,406.97',
    '288.82,170.67 183.79,328.21 0.00,406.97',
    '288.82,170.67 361.03,256.00 183.79,328.21',
    '380.72,144.41 361.03,256.00 288.82,170.67',
    '380.72,144.41 420.10,170.67 361.03,256.00',
    '433.23,85.33 512.00,144.41 420.10,170.67',
    '433.23,85.33 420.10,170.67 380.72,144.41',
    '105.03,0.00 288.82,170.67 252.72,224.82',
    '105.03,0.00 252.72,224.82 216.62,278.97',
];
const ink = ['#0E1215', '#20282E', '#46525A', '#323C43', '#20282E', '#46525A', '#323C43', '#46525A', '#20282E'];
const white = ['#BCC5C1', '#D9DFDC', '#FFFFFF', '#EEF1F0', '#D9DFDC', '#FFFFFF', '#EEF1F0', '#FFFFFF', '#D9DFDC'];

const Mark: React.FC<{ fills: string[]; className: string }> = ({ fills, className }) => (
    <svg viewBox="0 0 512 406.97" className={className} aria-hidden="true">
        {folds.map((points, i) => (
            <polygon key={i} points={points} fill={fills[i]} />
        ))}
    </svg>
);

const FinchMark: React.FC<{ className?: string }> = ({ className = '' }) => (
    <>
        <Mark fills={ink} className={`${className} [[data-theme=dark]_&]:hidden`} />
        <Mark fills={white} className={`${className} hidden [[data-theme=dark]_&]:block`} />
    </>
);

export default FinchMark;
