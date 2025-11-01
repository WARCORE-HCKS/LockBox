interface LockIconProps {
  className?: string;
}

export default function LockIcon({ className = "h-8 w-auto" }: LockIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M70 45V30C70 18.954 61.046 10 50 10C38.954 10 30 18.954 30 30V45M25 45H75C80.523 45 85 49.477 85 55V85C85 90.523 80.523 95 75 95H25C19.477 95 15 90.523 15 85V55C15 49.477 19.477 45 25 45Z"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
