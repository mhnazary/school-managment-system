// src/components/About.js
import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">درباره مکتب رهنورد دانش</h1>
              <Link 
                to="/" 
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                بازگشت به صفحه اصلی
              </Link>
            </div>
            
            <div className="mb-10">
              <div className="w-24 h-1 bg-blue-600 mb-6"></div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                مکتب رهنورد دانش در سال 1380 تأسیس شد و از آن زمان تاکنون به یکی از معتبرترین مراکز آموزشی در کشور تبدیل شده است. ما با بهره‌گیری از مدرن‌ترین روش‌های آموزشی و با تکیه بر کادر مجرب و متعهد، همواره در تلاشیم تا بهترین خدمات آموزشی را به دانش‌آموزان عزیز ارائه دهیم.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                مأموریت ما ایجاد محیطی امن و پویا برای رشد و شکوفایی استعدادهای دانش‌آموزان و آماده‌سازی آن‌ها برای آینده‌ای روشن است. ما معتقدیم که آموزش با کیفیت حق هر دانش‌آموز است و در این راه از هیچ تلاشی فروگذار نمی‌کنیم.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-blue-800 mb-4">چشم‌انداز ما</h2>
                <p className="text-gray-700">
                  تبدیل شدن به الگوی برتر آموزشی در کشور با ارائه برنامه‌های آموزشی نوآورانه و خلاقانه که دانش‌آموزان را برای چالش‌های آینده آماده می‌کند.
                </p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-indigo-800 mb-4">ارزش‌های ما</h2>
                <ul className="list-disc pr-5 text-gray-700 space-y-2">
                  <li>تعهد به کیفیت آموزشی</li>
                  <li>احترام به تنوع و تفاوت‌های فردی</li>
                  <li>نوآوری و خلاقیت در روش‌های تدریس</li>
                  <li>مسئولیت‌پذیری اجتماعی</li>
                  <li>شفافیت و صداقت در تمام فعالیت‌ها</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">دستاوردهای ما</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-2">+5000</div>
                  <div className="text-gray-600">فارغ‌التحصیل موفق</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
                  <div className="text-gray-600">نرخ قبولی در کنکور</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-purple-600 mb-2">+120</div>
                  <div className="text-gray-600">کادر آموزشی متخصص</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;