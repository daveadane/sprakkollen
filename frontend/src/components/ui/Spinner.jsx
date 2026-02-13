export default function Spinner({ size = 'md', color = 'text-indigo-600', className = "" }) {
  // Define size mapping
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizes[size]} ${color} animate-spin rounded-full border-current border-t-transparent`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
}