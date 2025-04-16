import FormInput from './FormInput';

/**
 * Component for grouping related form inputs
 */
export default function FormSection({ title, subtitle, fields, inputs, errors, handleChange, handleBlur }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <div className="mb-5">
        {/* 标题容器 */}
        <div className="flex flex-col mb-3">
          {/* Section icon */}
          <div className="flex items-center mb-2">
            <div className="flex-shrink-0 mr-3 p-2 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm">
              {title.includes("Biomarkers") ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 leading-tight">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
        </div>
        {/* Gradient divider */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
      </div>
      <div className="space-y-5">
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
    </div>
  );
}
