import { Trash2, Clock, FileText, CheckCircle } from 'lucide-react';
import { Project } from '../../types';
import { formatRelativeDate } from '../../lib/readingTime';

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
}

const ProjectCard = ({ project, onClick, onDelete }: ProjectCardProps) => {
  const isValidated = project.status === 'validated';
  const preview = project.script.trim().slice(0, 80) || 'Script vide…';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl shadow-sm border p-4 cursor-pointer active:scale-[0.98] transition-transform select-none ${
        isValidated ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isValidated && <CheckCircle size={14} className="text-green-600 flex-shrink-0" />}
            <h2 className={`font-semibold text-base truncate ${isValidated ? 'text-green-900' : 'text-gray-900'}`}>
              {project.name}
            </h2>
          </div>
          {!isValidated && (
            <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">
              {preview}{project.script.length > 80 ? '…' : ''}
            </p>
          )}
          {isValidated && project.validatedAt && (
            <p className="text-green-700 text-xs mt-0.5">
              Validé {formatRelativeDate(project.validatedAt)}
              {project.videoDuration && ` · ${formatDuration(project.videoDuration)}`}
              {project.videoSize && ` · ${formatSize(project.videoSize)}`}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0 -mt-1 -mr-1"
          aria-label="Supprimer"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {!isValidated && (
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatRelativeDate(project.updatedAt)}
          </span>
          {project.script && (
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {project.script.trim().split(/\s+/).filter(w => w).length} mots
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
