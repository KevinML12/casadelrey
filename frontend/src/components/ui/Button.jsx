const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = 'py-3 px-6 rounded-lg shadow-md transition-colors w-full';
  
  const primaryStyle = 'bg-blue-600 text-white font-bold hover:bg-blue-700';
  const secondaryStyle = 'bg-gray-200 text-gray-800 font-bold hover:bg-gray-300';

  let style;
  switch (variant) {
    case 'secondary':
      style = secondaryStyle;
      break;
    case 'primary':
    default:
      style = primaryStyle;
  }

  return (
    <button
      className={`${baseStyle} ${style} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;