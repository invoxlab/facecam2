import { Clock } from 'lucide-react';
import { estimateReadingTime, countWords } from '../../lib/readingTime';

interface ReadingTimeEstimateProps {
  script: string;
  wordsPerMinute: number;
}

const ReadingTimeEstimate = ({ script, wordsPerMinute }: ReadingTimeEstimateProps) => {
  const words = countWords(script);
  const time = estimateReadingTime(script, wordsPerMinute);

  if (words === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500">
      <Clock size={14} />
      <span>{time} à {wordsPerMinute} mots/min</span>
      <span className="text-gray-300">·</span>
      <span>{words} mots</span>
    </div>
  );
};

export default ReadingTimeEstimate;
