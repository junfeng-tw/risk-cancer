import FormInput from './FormInput';

/**
 * Component for grouping related form inputs
 */
export default function FormSection({ title, fields, inputs, errors, handleChange, handleBlur }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
      {fields.map(fieldName => (
        <FormInput
          key={fieldName}
          name={fieldName}
          value={inputs[fieldName]}
          error={errors[fieldName]}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      ))}
    </div>
  );
}
