import type { CompressionStatus } from '../types/image';

interface ProgressIndicatorProps {
  status: CompressionStatus;
}

export default function ProgressIndicator({ status }: ProgressIndicatorProps) {
  if (status === 'pending') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-label="Pending"
      >
        <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
      </svg>
    );
  }

  if (status === 'processing') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-blue-500 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Processing"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );
  }

  if (status === 'done') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-label="Done"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  // error
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-label="Error"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
