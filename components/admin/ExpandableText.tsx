import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export function ExpandableText({ text, maxLength = 50 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;

  if (!shouldTruncate) return <span>{text}</span>;

  return (
    <div className="relative">
      <span>
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-1 text-primary hover:text-primary/80 text-sm font-medium"
      >
        {isExpanded ? (
          <span className="flex items-center">Less <ChevronUp className="h-3 w-3 ml-0.5" /></span>
        ) : (
          <span className="flex items-center">More <ChevronDown className="h-3 w-3 ml-0.5" /></span>
        )}
      </button>
    </div>
  );
}
