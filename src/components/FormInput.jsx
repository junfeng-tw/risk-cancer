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
      <div className="relative mt-1">
        <input
          type="number"
          step={limits.step}
          min={limits.min}
          max={limits.max}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`block w-full rounded-lg border px-4 py-3 text-base transition-all duration-200 ease-in-out
            ${error ? 'border-red-300' : 'border-gray-300'}
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            shadow-sm hover:shadow-md
          `}
          placeholder={metadata.placeholder}
        />
        {/* Icon can be added here if needed */}
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
