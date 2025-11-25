const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 hover:border-accent-blue/50 dark:hover:border-accent-blue/50 rounded-xl transition-all duration-300 p-8 shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-dark-text/60 dark:text-gray-400 mb-4 uppercase tracking-widest transition-colors">
            {title}
          </p>
          <p className="text-4xl font-display font-bold text-dark-text dark:text-white transition-colors">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="p-4 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-lg transition-colors">
            <Icon className="w-10 h-10 text-accent-blue" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;