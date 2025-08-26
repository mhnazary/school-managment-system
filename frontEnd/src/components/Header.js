// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm py-4 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold ml-3 shadow-md hover:shadow-lg transition-shadow duration-300">
              رد
            </div>
            <h1 className="text-xl font-bold text-gray-800">مکتب رهنورد دانش</h1>
          </Link>
        </div>
        <nav>
          <ul className="flex space-x-reverse space-x-6">
            <li>
              <Link 
                to="/" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                صفحه اصلی
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                درباره ما
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
              >
                تماس با ما
              </Link>
            </li>
            <li>
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
              >
                ورود
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;