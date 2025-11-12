const Button = ({ children, variant = 'primary', className = '', isLoading = false, disabled = false, ...props }) => {
  const baseStyle = 'py-3 px-6 rounded-lg shadow-md transition-colors w-full flex justify-center items-center';
  
  const primaryStyle = 'bg-blue-600 text-white font-bold hover:bg-blue-700';
  const secondaryStyle = 'bg-gray-200 text-gray-800 font-bold hover:bg-gray-300';

  const disabledStyle = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

  let variantStyle;
  switch (variant) {
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
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Cargando...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;