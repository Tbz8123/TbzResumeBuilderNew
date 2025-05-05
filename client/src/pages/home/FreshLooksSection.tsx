const FreshLooksSection = () => {
  // Array of 5 template placeholders
  const freshTemplates = Array(5).fill(null);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Showcase Fresh Looks</h2>
          <p className="text-lg text-gray-dark max-w-2xl mx-auto">
            Check out our newest template designs
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {freshTemplates.map((_, index) => (
            <div 
              key={index} 
              className={`bg-gray-200 rounded-lg shadow-md h-60 relative hover:shadow-lg transition
                ${index === 4 ? 'hidden lg:block' : ''}
              `}
            >
              <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                New
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FreshLooksSection;
