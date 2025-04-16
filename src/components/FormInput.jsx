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
      <input
        type="number"
        step={limits.step}
        min={limits.min}
        max={limits.max}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder={metadata.placeholder}
      />
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
