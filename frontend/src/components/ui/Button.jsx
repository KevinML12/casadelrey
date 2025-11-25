const Button = ({ children, variant = 'primary', className = '', isLoading = false, disabled = false, ...props }) => {
  const baseStyle = 'py-3 px-6 font-semibold text-sm uppercase tracking-widest transition-all duration-300 w-full flex justify-center items-center rounded-lg shadow-sm hover:shadow-md';
  
  // Azul brillante para interfaces (Login, Formularios, Admin)
  const primaryStyle = 'bg-accent-blue text-white hover:bg-blue-700 dark:bg-accent-blue dark:hover:bg-blue-600 hover:scale-[1.02] transition-all';
  
  // Botón inverso para Hero Section (Blanco con texto Negro)
  const heroInverseStyle = 'bg-white text-dark-text hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-200 dark:text-dark-text shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all';
  
  // Outline minimalista
  const outlineStyle = 'bg-transparent text-white border-2 border-white hover:bg-white hover:text-dark-text dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-dark-text transition-all';
  
  // Secondary con menos prominencia
  const secondaryStyle = 'bg-gray-100 text-dark-text hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-all';

  const disabledStyle = disabled || isLoading ? 'opacity-50 cursor-not-allowed hover:scale-100' : '';

  let variantStyle;
  switch (variant) {
    case 'hero-inverse':
      variantStyle = heroInverseStyle;
      break;
    case 'outline':
      variantStyle = outlineStyle;
      break;
    case 'secondary':
      variantStyle = secondaryStyle;
      break;
    case 'primary':
    default:
      variantStyle = primaryStyle;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;