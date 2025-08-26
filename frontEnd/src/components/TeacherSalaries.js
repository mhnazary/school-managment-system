import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeacherSalaries = () => {
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [annualReport, setAnnualReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const initialJalaliYear = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric' }).format(new Date());
  const [selectedYear, setSelectedYear] = useState(initialJalaliYear);
  const [reportType, setReportType] = useState('monthly');
  const [user, setUser] = useState(null);
  
  // Persian months
  const persianMonths = [
    "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
    "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت",
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, selectedYear, reportType]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (reportType === 'monthly') {
        const response = await axios.get(`http://localhost:5000/api/teacherPayments/reports/monthly`, {
          headers: { 'x-auth-token': token },
          params: {
            year: selectedYear,
            month: selectedMonth
          }
        });
        setMonthlyReport(response.data);
      } else {
        const response = await axios.get(`http://localhost:5000/api/teacherPayments/reports/annual`, {
          headers: { 'x-auth-token': token },
          params: {
            year: selectedYear
          }
        });
        setAnnualReport(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'پرداخت‌شده':
        return '✅';
      case 'باقی‌مانده':
        return '⏳';
      default:
        return '';
    }
  };

  const getMonthName = (monthNumber) => {
    return persianMonths[monthNumber - 1] || '';
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      <h2 className="text-xl font-semibold mb-6">حقوق معلمین</h2>
      
      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع گزارش</label>
            <div className="flex space-x-reverse space-x-2">
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                گزارش ماهانه
              </button>
              <button
                onClick={() => setReportType('annual')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  reportType === 'annual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                گزارش سالانه
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">سال</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 10 }, (_, i) => parseInt(selectedYear) - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {reportType === 'monthly' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {persianMonths.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              اعمال فیلتر
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      {reportType === 'monthly' && monthlyReport && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium mb-2 text-blue-800">خلاصه گزارش ماهانه</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">مجموع حقوق ماهانه</p>
              <p className="text-lg font-semibold text-blue-700">
                {monthlyReport.totalMonthlySalary.toLocaleString('fa-IR')} افغانی
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">مجموع پرداخت‌شده</p>
              <p className="text-lg font-semibold text-green-700">
                {monthlyReport.totalPaidAmount.toLocaleString('fa-IR')} افغانی
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">ماه گزارش</p>
              <p className="text-lg font-semibold text-purple-700">
                {getMonthName(selectedMonth)} {selectedYear}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {reportType === 'annual' && annualReport && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
          <h3 className="text-lg font-medium mb-2 text-green-800">خلاصه گزارش سالانه</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">مجموع حقوق سالانه</p>
              <p className="text-lg font-semibold text-green-700">
                {annualReport.totalAnnualSalary.toLocaleString('fa-IR')} افغانی
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">مجموع پرداخت‌شده</p>
              <p className="text-lg font-semibold text-blue-700">
                {annualReport.totalPaidAmount.toLocaleString('fa-IR')} افغانی
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">سال گزارش</p>
              <p className="text-lg font-semibold text-purple-700">
                {selectedYear}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Teachers List */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          {reportType === 'monthly' 
            ? `لیست معلمین (${getMonthName(selectedMonth)} ${selectedYear})` 
            : `لیست معلمین (${selectedYear})`}
        </h3>
        
        {(reportType === 'monthly' && monthlyReport?.teachers?.length === 0) ||
         (reportType === 'annual' && annualReport?.teachers?.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            هیچ داده‌ای برای نمایش وجود ندارد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام و تخلص</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تخصص</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حقوق ماهانه</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ پرداخت‌شده</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(reportType === 'monthly' ? monthlyReport?.teachers : annualReport?.teachers)?.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{teacher.specialization}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {teacher.monthlySalary.toLocaleString('fa-IR')} افغانی
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {teacher.totalPaid.toLocaleString('fa-IR')} افغانی
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        teacher.status === 'پرداخت‌شده' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(teacher.status)} {teacher.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSalaries;