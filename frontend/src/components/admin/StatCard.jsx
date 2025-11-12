const StatCard = ({ title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <p className="text-sm text-gray-500 mb-2">
        {title}
      </p>
      <p className="text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
};

export default StatCard;