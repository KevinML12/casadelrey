const Input = ({ id, label, type = 'text', value, onChange, placeholder, error, className = '', ...props }) => {
  const inputClasses = error
    ? 'w-full px-4 py-3 border border-red-400 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:focus:ring-red-400 transition-all font-normal text-base shadow-sm'
    : 'w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-dark-text dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent dark:focus:ring-accent-blue transition-all font-normal text-base shadow-sm';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-dark-text dark:text-white font-semibold mb-2 text-sm transition-colors">
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
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 transition-colors font-normal">{error}</p>
      )}
    </div>
  );
};

export default Input;