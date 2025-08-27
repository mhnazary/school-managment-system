import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const TeacherPayment = () => {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [user, setUser] = useState(null);
  const [duplicatePayment, setDuplicatePayment] = useState(false);
  const navigate = useNavigate();
  
  // Form states
  const [formData, setFormData] = useState({
    month: "",
    year: "",
    amount: "",
    paymentDate: "",
    method: "نقدی",
  });
  
  // Persian months
  const persianMonths = [
    "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
    "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت",
  ];
  
  // Current Persian year
  const currentYear = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    
    const fetchTeacher = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `process.env.REACT_APP_API_URL/api/teachers/${teacherId}`,
          {
            headers: { "x-auth-token": token },
          }
        );
        setTeacher(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `process.env.REACT_APP_API_URL/api/teachers/${teacherId}/payments`,
          {
            headers: { "x-auth-token": token },
          }
        );
        setPayments(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchTeacher();
    fetchPayments();
    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    // بررسی وجود پرداخت برای ماه و سال انتخاب شده
    if (formData.month && formData.year) {
      const installment = `${formData.year}/${formData.month}`;
      const existingPayment = payments.find(payment => payment.installment === installment);
      setDuplicatePayment(!!existingPayment);
    } else {
      setDuplicatePayment(false);
    }
  }, [formData.month, formData.year, payments]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (duplicatePayment) {
      alert("برای این ماه قبلاً پرداخت ثبت شده است");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "process.env.REACT_APP_API_URL/api/teacherPayments",
        {
          ...formData,
          teacher: teacherId,
          installment: `${formData.year}/${formData.month}`,
        },
        {
          headers: { "x-auth-token": token },
        }
      );
      
      // Refresh payments
      const paymentsResponse = await axios.get(
        `process.env.REACT_APP_API_URL/api/teachers/${teacherId}/payments`,
        {
          headers: { "x-auth-token": token },
        }
      );
      setPayments(paymentsResponse.data);
      
      // Reset form
      setFormData({
        month: "",
        year: "",
        amount: "",
        paymentDate: "",
        method: "نقدی",
      });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 400) {
        alert(err.response.data.msg);
      }
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('آیا از حذف این پرداخت مطمئن هستید؟')) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `process.env.REACT_APP_API_URL/api/teacherPayments/${paymentId}`,
          {
            headers: { "x-auth-token": token },
          }
        );
        
        // Refresh payments
        const paymentsResponse = await axios.get(
          `process.env.REACT_APP_API_URL/api/teachers/${teacherId}/payments`,
          {
            headers: { "x-auth-token": token },
          }
        );
        setPayments(paymentsResponse.data);
      } catch (err) {
        console.error(err);
        alert('خطا در حذف پرداخت');
      }
    }
  };

  const getMonthName = (monthNumber) => {
    return persianMonths[monthNumber - 1] || "";
  };

  const handleGoBack = () => {
    navigate(-1); // بازگشت به صفحه قبلی
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
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
          <div>
            <h2 className="text-xl font-semibold">پرداخت حقوق معلم</h2>
            {teacher && (
              <p className="text-gray-600">
                معلم: {teacher.firstName} {teacher.lastName} - تخصص:{" "}
                {teacher.specialization}
              </p>
            )}
          </div>
        {user && (user.role === "administrator" || user.role === "admin") && (
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ماه پرداخت
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">انتخاب ماه</option>
                  {persianMonths.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سال پرداخت
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">انتخاب سال</option>
                  {Array.from(
                    { length: 5 },
                    (_, i) => parseInt(currentYear) - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مبلغ (افغانی)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ پرداخت
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  روش پرداخت
                </label>
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
            </div>
            
            {duplicatePayment && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                برای این ماه و سال قبلاً پرداختی ثبت شده است. لطفاً ماه دیگری را انتخاب کنید.
              </div>
            )}
            
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
                disabled={duplicatePayment}
                className={`px-4 py-2 rounded-md ${
                  duplicatePayment 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ماه پرداخت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مبلغ کل (افغانی)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  آخرین تاریخ پرداخت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  روش پرداخت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                {/* فقط برای administrator نمایش داده شود */}
                {user && user.role === "administrator" && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(
                payments.reduce((acc, payment) => {
                  const key = payment.installment;
                  if (!acc[key]) {
                    acc[key] = {
                      installment: payment.installment,
                      payments: [],
                    };
                  }
                  acc[key].payments.push(payment);
                  return acc;
                }, {})
              ).map((group, index) => {
                const [year, month] = group.installment.split("/");
                const monthName = getMonthName(parseInt(month));
                const totalPaid = group.payments.reduce(
                  (sum, p) => sum + p.amount,
                  0
                );
                const lastPaymentDate = new Date(
                  Math.max(...group.payments.map((p) => new Date(p.date)))
                ).toLocaleDateString("fa-IR");
                const methods = [
                  ...new Set(group.payments.map((p) => p.method)),
                ].join("، ");
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {monthName} {year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {totalPaid.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lastPaymentDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{methods}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        پرداخت شده
                      </span>
                    </td>
                    {/* فقط برای administrator نمایش داده شود */}
                    {user && user.role === "administrator" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeletePayment(group.payments[0]._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          حذف
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherPayment;