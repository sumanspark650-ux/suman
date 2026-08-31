import React from 'react';

interface SmartStudentLogoProps {
  className?: string;
  size?: number;
}

export const SmartStudentLogo: React.FC<SmartStudentLogoProps> = ({
  className = "w-11 h-11"
}) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs overflow-hidden p-1 select-none ${className}`}
      title="Examination Seating Allotment System"
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Exam Blackboard */}
        <g className="text-slate-900">
          <rect x="18" y="10" width="58" height="40" rx="1.5" fill="currentColor" />
          <text
            x="47"
            y="26"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10.5"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            letterSpacing="0.18em"
          >
            EXAM
          </text>
          {/* Blackboard chalk lines */}
          <rect x="28" y="32" width="38" height="2" rx="1" fill="#ffffff" />
          <rect x="28" y="38" width="22" height="2" rx="1" fill="#ffffff" />
        </g>

        {/* Student Silhouette Sitting & Writing */}
        <g className="text-slate-950" fill="currentColor">
          {/* Head */}
          <circle cx="68" cy="38" r="11" />
          {/* Hair back profile detail */}
          <path d="M58,38 C58,30 65,26 74,27 C78,32 79,37 77,44 C74,48 68,49 61,45 Z" />

          {/* Torso & Neck */}
          <path d="M66,48 C72,50 82,54 84,68 C84,74 81,80 73,81 C67,81 61,78 61,70 C61,65 60,60 54,58 C51,55 58,49 66,48 Z" />

          {/* Right Arm writing on exam */}
          <path
            d="M74,52 C65,58 56,61 48,64 C45,65 43,62 45,59 C50,56 60,52 68,48 Z"
          />
          {/* Forearm & Hand */}
          <path d="M55,61 L41,65 C39,66 38,63 41,61 L52,58 Z" />

          {/* Pen in hand */}
          <line
            x1="45"
            y1="57"
            x2="39"
            y2="66"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Exam Sheet on desk */}
          <polygon
            points="31,65 47,65 44,68 28,68"
            fill="#e2e8f0"
          />

          {/* Legs & Sitting Profile */}
          {/* Thighs */}
          <path d="M76,76 C72,75 58,76 56,79 C54,82 59,85 70,85 C75,85 78,82 78,76 Z" />
          {/* Lower legs */}
          <path d="M60,80 L50,102 C49,104 53,106 55,103 L65,83 Z" />
          {/* Left / Back Leg subtle offset */}
          <path d="M68,82 L60,101 C59,103 62,105 64,102 L72,84 Z" opacity="0.85" />
          {/* Shoes */}
          <path d="M48,103 C44,103 36,104 35,107 C34,109 40,110 52,110 C55,110 56,107 53,104 Z" />
          <path d="M58,103 C55,103 51,105 50,108 C50,110 58,110 65,110 C67,110 68,107 65,104 Z" opacity="0.85" />

          {/* Chair */}
          {/* Backrest */}
          <rect x="85" y="56" width="6.5" height="23" rx="2" />
          {/* Seat */}
          <rect x="68" y="78" width="24" height="4.5" rx="1.5" />
          {/* Chair Legs */}
          <rect x="86" y="82.5" width="4" height="27" rx="1" />
          <rect x="71" y="82.5" width="3.5" height="27" rx="1" />

          {/* Exam Desk */}
          {/* Desk Top */}
          <rect x="18" y="65" width="40" height="5.5" rx="1.5" />
          {/* Desk Front Leg */}
          <rect x="21" y="70.5" width="4" height="39.5" rx="1" />
          {/* Desk Rear Leg */}
          <rect x="29" y="70.5" width="3.5" height="39.5" rx="1" />
          {/* Desk Under-board */}
          <rect x="21" y="70.5" width="32" height="4" rx="1" />
        </g>
      </svg>
    </div>
  );
};
