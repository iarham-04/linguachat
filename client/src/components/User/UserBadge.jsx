import { getFlag, getLanguageName } from '../../utils/languages';

export default function UserBadge({ name, lang, size = 'sm' }) {
  const flag = getFlag(lang);
  const langName = getLanguageName(lang);

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-surface-800/60 
                       border border-surface-700/40 ${sizes[size]} text-surface-300`}>
      <span className="leading-none">{flag}</span>
      <span className="font-medium text-surface-200">{name}</span>
      <span className="text-surface-500">·</span>
      <span className="text-surface-400">{langName}</span>
    </span>
  );
}
