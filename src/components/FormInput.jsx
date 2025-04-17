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
      <div className="flex items-center mb-1">
        <span className="text-gray-800 font-semibold text-xs sm:text-sm tracking-wide">{metadata.label}</span>
      </div>
      <div className="relative mt-1 sm:mt-2">
        <input
          type="number"
          step={limits.step}
          min={limits.min}
          max={limits.max}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`block w-full h-10 sm:h-12 rounded-lg border px-3 sm:px-4 text-sm sm:text-base transition-all duration-200 ease-in-out
            ${error ? 'border-red-300' : 'border-gray-300'}
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            shadow-sm hover:shadow-md
          `}
          placeholder={metadata.placeholder}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs sm:text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          {customHint || metadata.hint || ''}
        </p>
      )}
    </label>
  );
}
