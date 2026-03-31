import * as React from 'react';

interface MulligansLogoProps {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
}

export function MulligansLogo({
  className,
  width = 200,
  height = 40,
  color = '#1DC690',
}: MulligansLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 50"
      width={width}
      height={height}
      className={className}
      aria-label="Mulligans"
    >
      <text
        x="0"
        y="38"
        fontFamily="'Montserrat', sans-serif"
        fontWeight="700"
        fontSize="36"
        fill={color}
        letterSpacing="3"
      >
        MULLIGANS
      </text>
    </svg>
  );
}
