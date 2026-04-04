import { Clock } from 'lucide-react';
import { estimateReadingTime, countWords } from '../../lib/readingTime';

interface ReadingTimeEstimateProps {
  script: string;
}

const AVERAGE_WPM = 150;

const ReadingTimeEstimate = ({ script }: ReadingTimeEstimateProps) => {
  const words = countWords(script);
  const time = estimateReadingTime(script, AVERAGE_WPM);

  if (words === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <Clock size={12} />
      <span>{time}</span>
      <span className="text-gray-300">·</span>
      <span>{words} mots</span>
    </div>
  );
};

export default ReadingTimeEstimate;
