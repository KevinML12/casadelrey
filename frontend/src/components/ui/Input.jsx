const Input = ({ id, label, type = 'text', value, onChange, placeholder, error, className = '', ...props }) => {
  const inputClasses = error
    ? 'w-full px-4 py-3 border border-red-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
    : 'w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-gray-700 font-medium mb-2">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;