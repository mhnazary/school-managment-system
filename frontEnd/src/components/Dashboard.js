import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Classes from './Classes';
import Students from './Students';
import Payment from './Payment';
import Teachers from './Teachers';
import TeacherPayment from './TeacherPayment';
import TeacherSalaries from './TeacherSalaries';
import StudentTuition from './StudentTuition';
import MonthlyExpenses from './MonthlyExpenses';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Financial report state
  const [financialData, setFinancialData] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' }));
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [reportType, setReportType] = useState('monthly');
  const [apiError, setApiError] = useState(null);
  const [apiStatus, setApiStatus] = useState({
    tuition: { loading: false, error: null, data: null },
    salaries: { loading: false, error: null, data: null },
    expenses: { loading: false, error: null, data: null },
    stats: { loading: false, error: null, data: null }
  });
  
  // State for tuition and salaries data
  const [tuitionData, setTuitionData] = useState(null);
  const [salariesData, setSalariesData] = useState(null);
  
  // Password change state
  const [passwordChange, setPasswordChange] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  // Persian months
  const persianMonths = [
    "حمل", "ثور", "جوزا", "سرطان", 
    "اسد", "سنبله", "میزان", "عقرب", 
    "قوس", "جدی", "دلو", "حوت"
  ];
  
  // Generate years for dropdown
  const generateYears = () => {
    const currentYear = parseInt(new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' }), 10);
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };
  
  // Extract tab from URL
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const tabFromUrl = pathSegments[pathSegments.length - 1];
    
    // Check if the last segment is a valid tab
    const validTabs = ['dashboard', 'classes', 'teachers', 'studentTuition', 'teacherSalaries', 'monthlyExpenses', 'settings'];
    if (validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (location.pathname === '/dashboard') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch dashboard stats
    fetchDashboardStats(token);
    
    setLoading(false);
  }, [navigate]);
  
  // Fetch dashboard stats function
  const fetchDashboardStats = async (token) => {
    setStatsLoading(true);
    setApiStatus(prev => ({ ...prev, stats: { ...prev.stats, loading: true, error: null } }));
    
    try {
      // Get current year for revenue calculation
      const currentYear = new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' });
      
      // Make parallel requests to get all stats
      const [studentsRes, teachersRes, classesRes, paymentsRes] = await Promise.all([
        axios.get('process.env.REACT_APP_API_URL/api/students', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('process.env.REACT_APP_API_URL/api/teachers', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('process.env.REACT_APP_API_URL/api/classes', {
          headers: { 'x-auth-token': token }
        }),
        axios.get(`process.env.REACT_APP_API_URL/api/payments/reports/annual`, {
          headers: { 'x-auth-token': token },
          params: { year: currentYear }
        })
      ]);
      
      // Update stats with real data
      const newStats = {
        students: studentsRes.data.length,
        teachers: teachersRes.data.length,
        classes: classesRes.data.length,
        revenue: paymentsRes.data.totalPaid || 0
      };
      
      setDashboardStats(newStats);
      setApiStatus(prev => ({ 
        ...prev, 
        stats: { 
          loading: false, 
          error: null, 
          data: newStats
        } 
      }));
      
      console.log('Dashboard stats updated:', newStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setApiStatus(prev => ({ 
        ...prev, 
        stats: { 
          loading: false, 
          error: err.message, 
          data: null 
        } 
      }));
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Fetch financial data
  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear, selectedMonth, reportType]);
  
  const fetchFinancialData = async () => {
    setFinancialLoading(true);
    setApiError(null);
    
    // Reset API status
    setApiStatus(prev => ({
      ...prev,
      tuition: { ...prev.tuition, loading: false, error: null, data: null },
      salaries: { ...prev.salaries, loading: false, error: null, data: null },
      expenses: { ...prev.expenses, loading: false, error: null, data: null }
    }));
    
    try {
      const token = localStorage.getItem('token');
      
      // Initialize data structure
      let incomeData = [];
      let salariesData = [];
      let operatingExpensesData = [];
      
      console.log(`Fetching financial data for: ${reportType}, year: ${selectedYear}, month: ${selectedMonth}`);
      
      // Format months for different APIs - use single digit format for all APIs
      const monthForAllAPIs = parseInt(selectedMonth, 10).toString();
      
      if (reportType === 'monthly') {
        // For monthly report, fetch data for the selected month
        try {
          // Fetch tuition data
          setApiStatus(prev => ({ ...prev, tuition: { ...prev.tuition, loading: true, error: null } }));
          
          // Get all students first
          const studentsResponse = await axios.get('process.env.REACT_APP_API_URL/api/students', {
            headers: { 'x-auth-token': token }
          });
          
          // Then get payments for each student for the selected month and year
          const studentPaymentPromises = studentsResponse.data.map(async (student) => {
            try {
              const paymentsResponse = await axios.get(`process.env.REACT_APP_API_URL/api/students/${student._id}/payments`, {
                headers: { 'x-auth-token': token }
              });
              
              // Filter payments by month and year
              const filteredPayments = paymentsResponse.data.filter(payment => {
                if (payment.installment) {
                  const [year, month] = payment.installment.split('/');
                  return year === selectedYear && month === monthForAllAPIs;
                }
                return false;
              });
              
              return {
                student,
                payments: filteredPayments,
                totalPaid: filteredPayments.reduce((sum, p) => sum + p.amount, 0)
              };
            } catch (err) {
              console.error(`Error fetching payments for student ${student._id}:`, err);
              return {
                student,
                payments: [],
                totalPaid: 0
              };
            }
          });
          
          const studentPaymentsData = await Promise.all(studentPaymentPromises);
          
          // Calculate total tuition received
          const totalPaid = studentPaymentsData.reduce((sum, item) => sum + item.totalPaid, 0);
          const paymentCount = studentPaymentsData.reduce((sum, item) => sum + item.payments.length, 0);
          const paidStudentCount = studentPaymentsData.filter(item => item.totalPaid > 0).length;
          const remainingStudentCount = studentPaymentsData.length - paidStudentCount;
          
          const tuitionResponseData = {
            totalPaid,
            paymentCount,
            paidStudentCount,
            remainingStudentCount,
            month: monthForAllAPIs,
            year: selectedYear
          };
          
          console.log('Monthly Tuition data:', tuitionResponseData);
          setApiStatus(prev => ({ ...prev, tuition: { ...prev.tuition, loading: false, data: tuitionResponseData } }));
          setTuitionData(tuitionResponseData);
          incomeData = [totalPaid];
        } catch (err) {
          console.error('Error fetching monthly tuition data:', err);
          setApiStatus(prev => ({ ...prev, tuition: { ...prev.tuition, loading: false, error: err.message } }));
          setTuitionData(null);
          incomeData = [0];
        }
        
        try {
          // Fetch salaries data
          setApiStatus(prev => ({ ...prev, salaries: { ...prev.salaries, loading: true, error: null } }));
          const salariesResponse = await axios.get('process.env.REACT_APP_API_URL/api/teacherPayments/reports/monthly', {
            headers: { 'x-auth-token': token },
            params: { 
              year: selectedYear, 
              month: monthForAllAPIs
            }
          });
          console.log('Monthly Salaries data:', salariesResponse.data);
          setApiStatus(prev => ({ ...prev, salaries: { ...prev.salaries, loading: false, data: salariesResponse.data } }));
          setSalariesData(salariesResponse.data);
          salariesData = [salariesResponse.data.totalPaidAmount || 0];
        } catch (err) {
          console.error('Error fetching monthly salaries data:', err);
          setApiStatus(prev => ({ ...prev, salaries: { ...prev.salaries, loading: false, error: err.message } }));
          setSalariesData(null);
          salariesData = [0];
        }
        
        try {
          // Fetch expenses data
          setApiStatus(prev => ({ ...prev, expenses: { ...prev.expenses, loading: true, error: null } }));
          const expensesResponse = await axios.get('process.env.REACT_APP_API_URL/api/expenses', {
            headers: { 'x-auth-token': token },
            params: { 
              year: selectedYear, 
              month: monthForAllAPIs
            }
          });
          console.log('Monthly Expenses data:', expensesResponse.data);
          setApiStatus(prev => ({ ...prev, expenses: { ...prev.expenses, loading: false, data: expensesResponse.data } }));
          
          // Calculate operating expenses from expenses data
          const totalOperatingExpenses = expensesResponse.data.reduce((sum, expense) => {
            return sum + (expense.amount || 0);
          }, 0);
          operatingExpensesData = [totalOperatingExpenses];
        } catch (err) {
          console.error('Error fetching monthly expenses data:', err);
          setApiStatus(prev => ({ ...prev, expenses: { ...prev.expenses, loading: false, error: err.message } }));
          operatingExpensesData = [0];
        }
      } else {
        // For annual report
        try {
          // Fetch tuition data for the whole year
          setApiStatus(prev => ({ ...prev, tuition: { ...prev.tuition, loading: true, error: null } }));
          const tuitionResponse = await axios.get('process.env.REACT_APP_API_URL/api/payments/reports/annual', {
            headers: { 'x-auth-token': token },
            params: { year: selectedYear }
          });
          console.log('Annual Tuition data:', tuitionResponse.data);
          setApiStatus(prev => ({ ...prev, tuition: { ...prev.tuition, loading: false, data: tuitionResponse.data } }));
          setTuitionData(tuitionResponse.data);
          incomeData = [tuitionResponse.data.totalPaid || 0];
        } catch (err) {
          console.error('Error fetching annual tuition data:', err);
          setApiStatus(prev => ({ ...prev, tuition: { ...prev.tuition, loading: false, error: err.message } }));
          setTuitionData(null);
          incomeData = [0];
        }
        
        try {
          // Fetch salaries data for the whole year
          setApiStatus(prev => ({ ...prev, salaries: { ...prev.salaries, loading: true, error: null } }));
          const salariesResponse = await axios.get('process.env.REACT_APP_API_URL/api/teacherPayments/reports/annual', {
            headers: { 'x-auth-token': token },
            params: { year: selectedYear }
          });
          console.log('Annual Salaries data:', salariesResponse.data);
          setApiStatus(prev => ({ ...prev, salaries: { ...prev.salaries, loading: false, data: salariesResponse.data } }));
          setSalariesData(salariesResponse.data);
          salariesData = [salariesResponse.data.totalPaidAmount || 0];
        } catch (err) {
          console.error('Error fetching annual salaries data:', err);
          setApiStatus(prev => ({ ...prev, salaries: { ...prev.salaries, loading: false, error: err.message } }));
          setSalariesData(null);
          salariesData = [0];
        }
        
        try {
          // Fetch expenses data for the whole year
          setApiStatus(prev => ({ ...prev, expenses: { ...prev.expenses, loading: true, error: null } }));
          const expensesResponse = await axios.get('process.env.REACT_APP_API_URL/api/expenses', {
            headers: { 'x-auth-token': token },
            params: { year: selectedYear }
          });
          console.log('Annual Expenses data:', expensesResponse.data);
          setApiStatus(prev => ({ ...prev, expenses: { ...prev.expenses, loading: false, data: expensesResponse.data } }));
          
          // Calculate operating expenses from expenses data
          const totalOperatingExpenses = expensesResponse.data.reduce((sum, expense) => {
            return sum + (expense.amount || 0);
          }, 0);
          operatingExpensesData = [totalOperatingExpenses];
        } catch (err) {
          console.error('Error fetching annual expenses data:', err);
          setApiStatus(prev => ({ ...prev, expenses: { ...prev.expenses, loading: false, error: err.message } }));
          operatingExpensesData = [0];
        }
      }
      
      // Calculate totals
      const totalIncome = incomeData.reduce((sum, val) => sum + val, 0);
      const totalSalaries = salariesData.reduce((sum, val) => sum + val, 0);
      const totalOperating = operatingExpensesData.reduce((sum, val) => sum + val, 0);
      const totalExpenses = totalSalaries + totalOperating;
      const balance = totalIncome - totalExpenses;
      
      console.log('Calculated financial data:', {
        totalIncome,
        totalSalaries,
        totalOperating,
        totalExpenses,
        balance
      });
      
      // Ensure we have valid data even if some values are zero
      const newFinancialData = {
        chartData: {
          labels: reportType === 'monthly' ? [persianMonths[parseInt(selectedMonth) - 1]] : ['سالانه'],
          income: incomeData.length > 0 ? incomeData : [0],
          expenses: {
            salaries: salariesData.length > 0 ? salariesData : [0],
            operating: operatingExpensesData.length > 0 ? operatingExpensesData : [0]
          }
        },
        summary: {
          totalIncome: totalIncome || 0,
          totalSalaries: totalSalaries || 0,
          totalOperating: totalOperating || 0,
          totalExpenses: totalExpenses || 0,
          balance: balance || 0
        }
      };
      
      setFinancialData(newFinancialData);
    } catch (err) {
      console.error('Error in fetchFinancialData:', err);
      setApiError('خطا در دریافت اطلاعات مالی. لطفاً اتصال به سرور را بررسی کنید.');
      
      // Set default data to prevent rendering issues
      setFinancialData({
        chartData: {
          labels: reportType === 'monthly' ? [persianMonths[parseInt(selectedMonth) - 1]] : ['سالانه'],
          income: [0],
          expenses: {
            salaries: [0],
            operating: [0]
          }
        },
        summary: {
          totalIncome: 0,
          totalSalaries: 0,
          totalOperating: 0,
          totalExpenses: 0,
          balance: 0
        }
      });
    } finally {
      setFinancialLoading(false);
    }
  };
  
  // Password change function
  const handlePasswordChange = async () => {
    const { current, new: newPassword, confirm } = passwordChange;
    
    // Validate fields
    if (!current || !newPassword || !confirm) {
      setPasswordMessage({ type: 'error', text: 'لطفاً تمام فیلدها را پر کنید' });
      return;
    }
    
    if (newPassword !== confirm) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور جدید و تکرار آن یکسان نیست' });
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `process.env.REACT_APP_API_URL/api/users/password/${user.username}`,
        { currentPassword: current, newPassword },
        { headers: { 'x-auth-token': token } }
      );
      
      setPasswordMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر یافت' });
      // Clear fields after success
      setPasswordChange({
        current: '',
        new: '',
        confirm: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'خطا در تغییر رمز عبور' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  const sidebarItems = [
    { 
      id: 'dashboard', 
      name: 'داشبورد', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
    },
    { 
      id: 'classes', 
      name: 'مدیریت صنف‌ها', 
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' 
    },
    { 
      id: 'teachers', 
      name: 'مدیریت معلمین', 
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' 
    },
    { 
      id: 'studentTuition', 
      name: 'شهریه دانش‌آموزان', 
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' 
    },
    { 
      id: 'teacherSalaries', 
      name: 'حقوق معلمین', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      id: 'monthlyExpenses', 
      name: 'مخارج ماهانه', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      id: 'settings', 
      name: 'تنظیمات', 
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' 
    },
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-xl font-medium text-gray-700">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }
  
  const getMonthName = (monthNumber) => {
    if (!monthNumber) return '';
    const num = parseInt(monthNumber, 10);
    if (isNaN(num) || num < 1 || num > 12) return '';
    return persianMonths[num - 1];
  };
  
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Fixed Sidebar */}
      <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl z-10 flex flex-col">
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl ml-4 shadow-lg">
              رد
            </div>
            <h1 className="text-xl font-bold text-white">مکتب رهنورد دانش</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/dashboard/${item.id}`}
                  className={`w-full flex items-center p-4 text-base font-medium rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-4 border-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-4 text-base font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition duration-300 hover:shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>خروج از سیستم</span>
          </button>
        </div>
      </div>
      
      {/* Main Content with left margin for sidebar */}
      <div className="flex-1 mr-64 overflow-auto">
        <main className="p-8">
          {activeTab === 'dashboard' && (
            <div>
              {/* Header */}
              
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg transform transition-transform duration-300 hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-100">دانش‌آموزان</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-10 w-20 bg-blue-400 rounded mt-3"></div>
                      ) : (
                        <p className="text-4xl font-bold text-white mt-2">{dashboardStats.students}</p>
                      )}
                    </div>
                    <div className="p-4 rounded-full bg-blue-400 bg-opacity-30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg transform transition-transform duration-300 hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-100">معلمان</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-10 w-20 bg-green-400 rounded mt-3"></div>
                      ) : (
                        <p className="text-4xl font-bold text-white mt-2">{dashboardStats.teachers}</p>
                      )}
                    </div>
                    <div className="p-4 rounded-full bg-green-400 bg-opacity-30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg transform transition-transform duration-300 hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-100">صنف‌ها</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-10 w-20 bg-purple-400 rounded mt-3"></div>
                      ) : (
                        <p className="text-4xl font-bold text-white mt-2">{dashboardStats.classes}</p>
                      )}
                    </div>
                    <div className="p-4 rounded-full bg-purple-400 bg-opacity-30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl shadow-lg transform transition-transform duration-300 hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-100">
                        {reportType === 'monthly' ? 'درآمد ماهانه' : 'درآمد سالانه'}
                      </p>
                      {statsLoading || financialLoading ? (
                        <div className="animate-pulse h-10 w-24 bg-amber-400 rounded mt-3"></div>
                      ) : (
                        <p className="text-4xl font-bold text-white mt-2">
                          {reportType === 'monthly' && financialData && financialData.summary.totalIncome > 0
                            ? financialData.summary.totalIncome.toLocaleString('fa-IR')
                            : dashboardStats.revenue.toLocaleString('fa-IR')
                          }
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-full bg-amber-400 bg-opacity-30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Financial Report Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">گزارش مالی</h2>
                  
                  {/* Financial Report Filters */}
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع گزارش</label>
                      <div className="flex space-x-reverse space-x-2">
                        <button
                          onClick={() => setReportType('monthly')}
                          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                            reportType === 'monthly'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          ماهانه
                        </button>
                                             </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سال</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {generateYears().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    {reportType === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {persianMonths.map((month, index) => (
                            <option key={index} value={(index + 1).toString()}>{month}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
                    <div className="text-red-600 mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-red-800 mb-3">خطا در دریافت اطلاعات</h3>
                    <p className="text-red-600 mb-6">{apiError}</p>
                    <button
                      onClick={fetchFinancialData}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                )}
                
                {financialLoading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-8 text-gray-600 text-xl">در حال بارگذاری گزارش مالی...</p>
                    <p className="text-gray-500 mt-3">لطفاً چند لحظه صبر کنید</p>
                  </div>
                ) : financialData && (financialData.summary.totalIncome > 0 || financialData.summary.totalExpenses > 0) ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl shadow-md border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700">مجموع درآمد</p>
                            <p className="text-4xl font-bold text-green-800 mt-3">
                              {financialData.summary.totalIncome.toLocaleString('fa-IR')} افغانی
                            </p>
                            {financialData.summary.totalIncome === 0 && (
                              <p className="text-xs text-yellow-600 mt-3">هیچ درآمدی ثبت نشده است</p>
                            )}
                          </div>
                          <div className="p-4 rounded-full bg-green-500 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-2xl shadow-md border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-700">مجموع مصارف</p>
                            <p className="text-4xl font-bold text-red-800 mt-3">
                              {financialData.summary.totalExpenses.toLocaleString('fa-IR')} افغانی
                            </p>
                            {financialData.summary.totalExpenses === 0 && (
                              <p className="text-xs text-yellow-600 mt-3">هیچ هزینه‌ای ثبت نشده است</p>
                            )}
                          </div>
                          <div className="p-4 rounded-full bg-red-500 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538.214 1.055.595 1.436L4 17h5m6 0v1m3-3h-1m-1 0h-1m4 0h-1m-1 0h-1m-5 0v1" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`bg-gradient-to-r p-6 rounded-2xl shadow-md border ${
                        financialData.summary.balance >= 0 
                          ? 'from-blue-50 to-blue-100 border-blue-200' 
                          : 'from-yellow-50 to-yellow-100 border-yellow-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">توازن مالی</p>
                            <p className={`text-4xl font-bold mt-3 ${
                              financialData.summary.balance >= 0 ? 'text-blue-800' : 'text-yellow-800'
                            }`}>
                              {financialData.summary.balance.toLocaleString('fa-IR')} افغانی
                            </p>
                            <p className={`text-xs mt-3 ${
                              financialData.summary.balance >= 0 ? 'text-blue-600' : 'text-yellow-600'
                            }`}>
                              {financialData.summary.balance >= 0 ? 'سود' : 'زیان'}
                            </p>
                            {financialData.summary.totalIncome === 0 && financialData.summary.totalExpenses === 0 && (
                              <p className="text-xs text-gray-500 mt-3">هیچ تراکنشی ثبت نشده است</p>
                            )}
                          </div>
                          <div className={`p-4 rounded-full text-white ${
                            financialData.summary.balance >= 0 ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Table */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بخش</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ (افغانی)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">درآمد کل (شهریه دانش‌آموزان)</td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                              {financialData.summary.totalIncome.toLocaleString('fa-IR')} افغانی
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">مصارف کل (معاش معلمین + هزینه‌های جاری)</td>
                            <td className="px-6 py-4 whitespace-nowrap text-red-600 font-semibold">
                              {financialData.summary.totalExpenses.toLocaleString('fa-IR')} افغانی
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">توازن (درآمد - مصارف)</td>
                            <td className={`px-6 py-4 whitespace-nowrap font-semibold ${
                              financialData.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {financialData.summary.balance.toLocaleString('fa-IR')} افغانی
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Update Button for Administrator */}
                    {user && user.role === 'administrator' && (
                      <div className="mt-8 text-center">
                        <button
                          onClick={fetchFinancialData}
                          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          به‌روزرسانی گزارش مالی
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-gray-400 mb-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-28 w-28 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-medium text-gray-600 mb-6">هیچ داده مالی وجود ندارد</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                      {reportType === 'monthly' 
                        ? `هیچ تراکنش مالی برای ماه ${getMonthName(selectedMonth)} ${selectedYear} ثبت نشده است.`
                        : `هیچ تراکنش مالی برای سال ${selectedYear} ثبت نشده است.`}
                    </p>
                    <div className="flex justify-center space-x-reverse space-x-6">
                      <button
                        onClick={() => navigate('/dashboard/studentTuition')}
                        className="px-8 py-4 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                      >
                        ثبت شهریه
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/monthlyExpenses')}
                        className="px-8 py-4 bg-red-600 text-white font-medium rounded-2xl hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
                      >
                        ثبت هزینه
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
             </div>
          )}
          
          {activeTab === 'classes' && <Classes />}
          {activeTab === 'teachers' && <Teachers />}
          {activeTab === 'studentTuition' && <StudentTuition />}
          {activeTab === 'teacherSalaries' && <TeacherSalaries />}
          {activeTab === 'monthlyExpenses' && <MonthlyExpenses />}
          
          {activeTab === 'settings' && (
  <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg transform transition-all duration-300 hover:shadow-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">تغییر رمز عبور</h2>
        <p className="text-gray-600 mt-2">برای حفظ امنیت حساب خود، رمز عبور را به طور منظم تغییر دهید</p>
      </div>
      
      {passwordMessage.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          passwordMessage.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-2 mt-0.5 flex-shrink-0 ${
            passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-500'
          }`} viewBox="0 0 20 20" fill="currentColor">
            {passwordMessage.type === 'error' ? (
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            )}
          </svg>
          <span>{passwordMessage.text}</span>
        </div>
      )}
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            رمز عبور فعلی
          </label>
          <div className="relative">
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={passwordChange.current}
              onChange={(e) => setPasswordChange({
                ...passwordChange,
                current: e.target.value
              })}
              placeholder="رمز عبور فعلی خود را وارد کنید"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            رمز عبور جدید
          </label>
          <div className="relative">
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={passwordChange.new}
              onChange={(e) => setPasswordChange({
                ...passwordChange,
                new: e.target.value
              })}
              placeholder="رمز عبور جدید خود را وارد کنید"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            تکرار رمز عبور جدید
          </label>
          <div className="relative">
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={passwordChange.confirm}
              onChange={(e) => setPasswordChange({
                ...passwordChange,
                confirm: e.target.value
              })}
              placeholder="رمز عبور جدید را تکرار کنید"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={handlePasswordChange}
        disabled={passwordLoading}
        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {passwordLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
              در حال تغییر...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تغییر رمز عبور
            </span>
          )}
        </button>
        
        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-md font-medium text-blue-800">نکات امنیتی</h3>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 mt-0.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>رمز عبور باید حداقل ۶ کاراکتر باشد</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 mt-0.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>از ترکیبی از حروف بزرگ، کوچک، اعداد و نمادها استفاده کنید</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 mt-0.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>رمز عبور خود را با دیگران به اشتراک نگذارید</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 mt-0.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>به طور منظم رمز عبور خود را تغییر دهید</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  </div>
)}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;