
import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Loader } from './Loader';

interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  recommendations: Product[] | null;
}

const InitialState: React.FC = () => (
  <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-md">
    <div className="text-5xl mb-4">✨</div>
    <h3 className="text-2xl font-bold text-pink-800 font-display">Your Personalized Results Will Appear Here</h3>
    <p className="text-gray-600 mt-2 max-w-md mx-auto">Fill out the form above and let our AI shopper find the perfect K-Beauty products for you!</p>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, recommendations }) => {
  if (isLoading) {
    return (
        <div className="text-center py-16">
            <Loader />
            <p className="text-lg text-pink-700 mt-4 animate-pulse">Finding your perfect match...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="text-center py-16 px-6 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-md">
             <div className="text-5xl mb-4">😥</div>
            <h3 className="text-2xl font-bold text-red-800 font-display">Oops! Something went wrong.</h3>
            <p className="text-red-700 mt-2">{error}</p>
        </div>
    );
  }

  if (!recommendations) {
    return <InitialState />;
  }
  
  if (recommendations.length === 0) {
     return (
        <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-md">
            <div className="text-5xl mb-4">🧐</div>
            <h3 className="text-2xl font-bold text-pink-800 font-display">No Products Found</h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">We couldn't find any products that match your specific criteria. Try broadening your search!</p>
        </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-pink-800 mb-8 font-display">Your Top 5 Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {recommendations.map((product, index) => (
          <ProductCard key={`${product.productName}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );
};
