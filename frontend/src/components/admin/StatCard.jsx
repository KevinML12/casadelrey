const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2 font-medium">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="p-3 bg-blue-100 rounded-full">
            <Icon className="w-8 h-8 text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;