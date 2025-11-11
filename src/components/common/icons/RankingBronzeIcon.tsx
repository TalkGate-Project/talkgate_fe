interface RankingBronzeIconProps {
  className?: string;
}

export default function RankingBronzeIcon({ className = "" }: RankingBronzeIconProps) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path opacity="0.1" d="M48 0C54.6273 0.000125631 60 5.37266 60 12V48C59.9999 54.6272 54.6272 59.9999 48 60H12C5.37268 60 0.000147504 54.6273 0 48V12C0 5.37258 5.37258 4.83108e-07 12 0H48Z" fill="#00E272"/>
      <path d="M27.9929 11.1643C29.2341 10.4443 30.7659 10.4443 32.0071 11.1643L38.65 15.0178L45.3087 18.8439C46.5528 19.5589 47.3187 20.8854 47.3158 22.3203L47.3 30L47.3158 37.6797C47.3187 39.1146 46.5528 40.4411 45.3087 41.1561L38.65 44.9822L32.0071 48.8357C30.7659 49.5557 29.2341 49.5557 27.9929 48.8357L21.35 44.9822L14.6913 41.1561C13.4472 40.4411 12.6813 39.1146 12.6843 37.6797L12.7 30L12.6843 22.3203C12.6813 20.8854 13.4472 19.5589 14.6913 18.8439L21.35 15.0178L27.9929 11.1643Z" fill="#ADF6D2"/>
      <g clipPath="url(#clip0_rank_bronze)">
        <path d="M30 25L33.3333 30L37.5 26.6667L35.8333 35H24.1667L22.5 26.6667L26.6667 30L30 25Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="clip0_rank_bronze">
          <rect width="20" height="20" fill="white" transform="translate(20 20)"/>
        </clipPath>
      </defs>
    </svg>
  );
}


