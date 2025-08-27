import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const Payment = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // Form states
  const [formData, setFormData] = useState({
    year: '',
    month: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'نقدی',
    isFullPayment: false,
    amount: ''
  });
  
  // Persian months
  const persianMonths = [
    "حمل", "ثور", "جوزا", "سرطان", 
    "اسد", "سنبله", "میزان", "عقرب", 
    "قوس", "جدی", "دلو", "حوت"
  ];
  
  // Get current Persian year in Latin numerals
  const getCurrentPersianYear = () => {
    const now = new Date();
    const persianYear = now.toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' });
    return parseInt(persianYear, 10);
  };
  
  const [currentYear, setCurrentYear] = useState(getCurrentPersianYear());

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/students/${studentId}`, {
          headers: { 'x-auth-token': token }
        });
        setStudent(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/students/${studentId}/payments`, {
          headers: { 'x-auth-token': token }
        });
        // Filter out base payments (paymentType: 'پایه')
        const regularPayments = response.data.filter(payment => payment.paymentType !== 'پایه');
        setPayments(regularPayments);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchStudent();
    fetchPayments();
    setLoading(false);
  }, [studentId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'isFullPayment') {
      // If checkbox is checked, set amount to base fee
      if (checked) {
        setFormData({
          ...formData,
          isFullPayment: true,
          amount: student?.baseFee ? student.baseFee.toString() : ''
        });
      } else {
        setFormData({
          ...formData,
          isFullPayment: false,
          amount: ''
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Create installment string without leading zero
      const installment = `${formData.year}/${formData.month}`;
      
      // Check if payment already exists for this month and year
      const existingPayment = payments.find(
        payment => payment.installment === installment
      );
      
      if (existingPayment) {
        alert(`پرداخت برای ${getMonthName(formData.month)} ${formData.year} قبلاً ثبت شده است`);
        return;
      }
      
      // Use base fee if full payment is checked, otherwise use entered amount
      const paymentAmount = formData.isFullPayment 
        ? (student?.baseFee || 0) 
        : (formData.amount ? parseInt(formData.amount) : 0);
      
      if (paymentAmount <= 0) {
        alert('مبلغ پرداخت باید بیشتر از صفر باشد');
        return;
      }
      
      await axios.post('http://localhost:5000/api/payments', {
        student: studentId,
        installment: installment,
        amount: paymentAmount,
        method: formData.method,
        paymentDate: formData.paymentDate,
        paymentType: 'شهریه' // مشخص کردن نوع پرداخت عادی
      }, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh payments
      const paymentsResponse = await axios.get(`http://localhost:5000/api/students/${studentId}/payments`, {
        headers: { 'x-auth-token': token }
      });
      // Filter out base payments
      const regularPayments = paymentsResponse.data.filter(payment => payment.paymentType !== 'پایه');
      setPayments(regularPayments);
      
      // Reset form
      setFormData({
        year: '',
        month: '',
        paymentDate: new Date().toISOString().split('T')[0],
        method: 'نقدی',
        isFullPayment: false,
        amount: ''
      });
      setShowAddForm(false);
      
      // Show success message
      alert('پرداخت با موفقیت ثبت شد');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.msg?.includes("پرداخت برای این ماه و سال قبلاً ثبت شده است")) {
        alert(err.response.data.msg);
      } else {
        alert('خطا در ثبت پرداخت: ' + (err.response?.data?.msg || err.message));
      }
    }
  };

  // تابع بازگشت
  const handleGoBack = () => {
    navigate(-1); // بازگشت به صفحه قبلی
  };

  const getMonthName = (monthNumber) => {
    if (!monthNumber || isNaN(parseInt(monthNumber))) return '';
    return persianMonths[parseInt(monthNumber, 10) - 1] || '';
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      {/* هدر با دکمه بازگشت */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleGoBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-32 flex justify-normal items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            بازگشت
          </button>

        </div>
          <div className='font-bold'>
            {student && (
              <p className="text-gray-600">
               {student.firstName} {student.lastName} - {student.class.name}
                {student.baseFee && (
                  <span className="mr-2">- شهریه پایه: {student.baseFee.toLocaleString('fa-IR')} افغانی</span>
                )}
              </p>
            )}
          </div>
        {user && (user.role === 'administrator' || user.role === 'admin') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            ثبت پرداخت جدید
          </button>
        )}
      </div>
      
      {/* Add Payment Form */}
      {showAddForm && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">ثبت پرداخت جدید</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ماه پرداخت</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">انتخاب ماه</option>
                  {persianMonths.map((month, index) => (
                    <option key={index} value={(index + 1).toString()}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سال پرداخت</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">انتخاب سال</option>
                  {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پرداخت</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">روش پرداخت</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="نقدی">نقدی</option>
                  <option value="بانکی">بانکی</option>
                  <option value="آنلاین">آنلاین</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع پرداخت</label>
                <div className="mt-1">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="isFullPayment"
                      checked={formData.isFullPayment}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2">پرداخت کامل شهریه پایه</span>
                  </label>
                </div>
              </div>
              {!formData.isFullPayment && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ (افغانی)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    required={!formData.isFullPayment}
                  />
                </div>
              )}
              {formData.isFullPayment && student?.baseFee && (
                <div className="md:col-span-2 bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    مبلغ پرداخت: {student.baseFee.toLocaleString('fa-IR')} افغانی (شهریه پایه)
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4 space-x-reverse space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                ثبت پرداخت
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Payments History */}
      <div>
        <h3 className="text-lg font-medium mb-4">تاریخچه پرداخت‌ها</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ماه پرداخت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ پرداختی</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ماه و سال پرداخت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">پرداختی توسط</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => {
                const [year, month] = payment.installment && payment.installment.includes('/')
                  ? payment.installment.split('/')
                  : ['', ''];
                
                const monthName = getMonthName(month);
                
                return (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {monthName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(payment.amount || 0).toLocaleString('fa-IR')} افغانی
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {monthName && year ? `${monthName} ${year}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.createdBy?.username || 'نامشخص'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600">پرداخت‌شده ✅</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              هیچ پرداختی ثبت نشده است
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;