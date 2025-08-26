import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold ml-3 shadow-md hover:shadow-lg transition-shadow duration-300">
              رد
            </div>
            <h1 className="text-xl font-bold text-gray-800">مکتب رهنورد دانش</h1>
          </div>
          <nav className=''>
            <ul className="flex space-x-reverse space-x-6 items-center">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 pt-1 pb-3 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  ورود
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="flex-grow container mx-auto px-4 pt-12 flex flex-col items-center justify-center">
        <div className="max-w-3xl text-center mb-4 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
            به سیستم مدیریت مکتب رهنورد دانش خوش آمدید
          </h1>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            پلتفرم جامع مدیریت آموزشی برای مدیریت بهینه کلاس‌ها، دانش‌آموزان، معلمان و پرداخت‌های مالی
          </p>
         
        </div>  
        
        {/* Features Section */}
        <div className="w-full max-w-5xl">
        
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">مدیریت آموزشی</h3>
              <p className="text-gray-600">مدیریت کامل کلاس‌ها، برنامه درسی و حضور و غیاب دانش‌آموزان</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">مدیریت مالی</h3>
              <p className="text-gray-600">پیگیری پرداخت‌ها، شهریه‌ها و گزارش‌های مالی دقیق</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">امنیت داده‌ها</h3>
              <p className="text-gray-600">حفاظت کامل از اطلاعات دانش‌آموزان و کارکنان مکتب</p>
            </div>
          </div>
        </div>
        
        
        </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-2">
        <div className="container mx-auto px-4">
         
          <div className="border-t border-gray-700 py-4 text-center text-gray-400 text-sm">
            <p>© 2023 مکتب رهنورد دانش. تمامی حقوق محفوظ است.</p>
          </div>
        </div>
      </footer>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Home;