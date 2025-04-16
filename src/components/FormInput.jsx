import { PARAM_LIMITS, FIELD_METADATA } from '../constants/paramLimits';

/**
 * Reusable form input component for numeric inputs with validation
 */
export default function FormInput({
  name,
  value,
  error,
  onChange,
  onBlur,
  customHint
}) {
  const metadata = FIELD_METADATA[name];
  const limits = PARAM_LIMITS[name];

  return (
    <label className="block">
      <span className="text-gray-700 font-medium">{metadata.label}</span>
      <div className="relative mt-2">
        <input
          type="number"
          step={limits.step}
          min={limits.min}
          max={limits.max}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`block w-full h-12 rounded-lg border px-4 text-base transition-all duration-200 ease-in-out
            ${error ? 'border-red-300' : 'border-gray-300'}
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            shadow-sm hover:shadow-md
          `}
          placeholder={metadata.placeholder}
        />
        {/* Field icon based on field type */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {name.includes('age') && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
            </svg>
          )}
          {name.includes('afp') && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
            </svg>
          )}
          {(name.includes('kcnq1') || name.includes('linc')) && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          )}
          {(name.includes('alb') || name.includes('ggt')) && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">
          {customHint || metadata.hint || ''}
        </p>
      )}
    </label>
  );
}
