const SkeletonCard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="h-8 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
