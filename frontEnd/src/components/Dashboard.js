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
    admin: { current: '', new: '', confirm: '' },
    administrator: { current: '', new: '', confirm: '' }
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
        axios.get('http://localhost:5000/api/students', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('http://localhost:5000/api/teachers', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('http://localhost:5000/api/classes', {
          headers: { 'x-auth-token': token }
        }),
        axios.get(`http://localhost:5000/api/payments/reports/annual`, {
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
          const studentsResponse = await axios.get('http://localhost:5000/api/students', {
            headers: { 'x-auth-token': token }
          });
          
          // Then get payments for each student for the selected month and year
          const studentPaymentPromises = studentsResponse.data.map(async (student) => {
            try {
              const paymentsResponse = await axios.get(`http://localhost:5000/api/students/${student._id}/payments`, {
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
          const salariesResponse = await axios.get('http://localhost:5000/api/teacherPayments/reports/monthly', {
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
          const expensesResponse = await axios.get('http://localhost:5000/api/expenses', {
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
          const tuitionResponse = await axios.get('http://localhost:5000/api/payments/reports/annual', {
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
          const salariesResponse = await axios.get('http://localhost:5000/api/teacherPayments/reports/annual', {
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
          const expensesResponse = await axios.get('http://localhost:5000/api/expenses', {
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
  const handlePasswordChange = async (userType) => {
    const { current, new: newPassword, confirm } = passwordChange[userType];
    
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
        `http://localhost:5000/api/users/password/${userType}`,
        { currentPassword: current, newPassword },
        { headers: { 'x-auth-token': token } }
      );
      
      setPasswordMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر یافت' });
      // Clear fields after success
      setPasswordChange({
        ...passwordChange,
        [userType]: { current: '', new: '', confirm: '' }
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
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">در حال بارگذاری...</p>
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
    <div className="min-h-screen flex" dir="rtl">
      {/* Fixed Sidebar */}
      <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-md z-10 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold ml-3">
              رد
            </div>
            <h1 className="text-xl font-bold text-gray-800">مکتب رهنورد دانش</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul>
            {sidebarItems.map((item) => (
              <li key={item.id} className="mb-1">
                <Link
                  to={`/dashboard/${item.id}`}
                  className={`w-full flex items-center p-3 text-base font-normal rounded-lg transition duration-300 ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="w-full flex items-center p-3 text-base font-normal text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>خروج از سیستم</span>
          </button>
        </div>
      </div>
      
      {/* Main Content with left margin for sidebar */}
      <div className="flex-1 mr-64 overflow-auto">
        <main className="p-6">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">خلاصه وضعیت مکتب</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-600">دانش‌آموزان</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-2"></div>
                      ) : (
                        <p className="text-2xl font-semibold">{dashboardStats.students}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-600">معلمان</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-2"></div>
                      ) : (
                        <p className="text-2xl font-semibold">{dashboardStats.teachers}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-600">صنف‌ ها</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-2"></div>
                      ) : (
                        <p className="text-2xl font-semibold">{dashboardStats.classes}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-600">
                        {reportType === 'monthly' ? 'درآمد ماهانه (افغانی)' : 'درآمد سالانه (افغانی)'}
                      </p>
                      {statsLoading || financialLoading ? (
                        <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-2"></div>
                      ) : (
                        <div className="flex items-baseline">
                          <p className="text-2xl font-semibold">
                            {reportType === 'monthly' && financialData && financialData.summary.totalIncome > 0
                              ? financialData.summary.totalIncome.toLocaleString('fa-IR')
                              : dashboardStats.revenue.toLocaleString('fa-IR')
                            }
                          </p>
                          {reportType === 'monthly' && financialData && financialData.summary.totalIncome > 0 && (
                            <span className="text-sm text-gray-500 mr-2">
                              ({getMonthName(selectedMonth)} {selectedYear})
                            </span>
                          )}
                        </div>
                      )}
                      {reportType === 'monthly' && financialData && financialData.summary.totalIncome > 0 && (
                        <div className="mt-1">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                            <span className="text-xs text-green-600 font-medium">
                              {((financialData.summary.totalIncome / Math.max(financialData.summary.totalIncome + financialData.summary.totalExpenses, 1)) * 100).toFixed(1)}% از کل درآمد
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* School Status and Financial Report Section */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">گزارش مالی</h2>
                  
                  {/* Financial Report Filters */}
                  <div className="flex space-x-reverse space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نوع گزارش</label>
                      <div className="flex space-x-reverse space-x-2">
                        <button
                          onClick={() => setReportType('monthly')}
                          className={`px-3 py-1 rounded-md text-sm transition-colors ${
                            reportType === 'monthly'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          ماهانه
                        </button>
                        <button
                          onClick={() => setReportType('annual')}
                          className={`px-3 py-1 rounded-md text-sm transition-colors ${
                            reportType === 'annual'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          سالانه
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سال</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
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
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
                    <div className="text-red-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-800 mb-2">خطا در دریافت اطلاعات</h3>
                    <p className="text-red-600 mb-4">{apiError}</p>
                    <button
                      onClick={fetchFinancialData}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                )}
                
                {financialLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">در حال بارگذاری گزارش مالی...</p>
                    <p className="text-sm text-gray-500">لطفاً چند لحظه صبر کنید</p>
                  </div>
                ) : financialData && (financialData.summary.totalIncome > 0 || financialData.summary.totalExpenses > 0) ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow-md border border-green-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-green-500 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="mr-4">
                            <p className="text-sm font-medium text-gray-700">مجموع درآمد</p>
                            <p className="text-2xl font-bold text-green-700">
                              {financialData.summary.totalIncome.toLocaleString('fa-IR')} افغانی
                            </p>
                            {financialData.summary.totalIncome === 0 && (
                              <p className="text-xs text-yellow-600 mt-1">هیچ درآمدی ثبت نشده است</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg shadow-md border border-red-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-red-500 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538.214 1.055.595 1.436L4 17h5m6 0v1m3-3h-1m-1 0h-1m4 0h-1m-1 0h-1m-5 0v1" />
                            </svg>
                          </div>
                          <div className="mr-4">
                            <p className="text-sm font-medium text-gray-700">مجموع مصارف</p>
                            <p className="text-2xl font-bold text-red-700">
                              {financialData.summary.totalExpenses.toLocaleString('fa-IR')} افغانی
                            </p>
                            {financialData.summary.totalExpenses === 0 && (
                              <p className="text-xs text-yellow-600 mt-1">هیچ هزینه‌ای ثبت نشده است</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`bg-gradient-to-r p-6 rounded-lg shadow-md border ${
                        financialData.summary.balance >= 0 
                          ? 'from-blue-50 to-blue-100 border-blue-200' 
                          : 'from-yellow-50 to-yellow-100 border-yellow-200'
                      }`}>
                        <div className="flex items-center">
                          <div className={`p-3 rounded-full text-white ${
                            financialData.summary.balance >= 0 ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="mr-4">
                            <p className="text-sm font-medium text-gray-700">توازن مالی</p>
                            <p className={`text-2xl font-bold ${
                              financialData.summary.balance >= 0 ? 'text-blue-700' : 'text-yellow-700'
                            }`}>
                              {financialData.summary.balance.toLocaleString('fa-IR')} افغانی
                            </p>
                            <p className={`text-xs mt-1 ${
                              financialData.summary.balance >= 0 ? 'text-blue-600' : 'text-yellow-600'
                            }`}>
                              {financialData.summary.balance >= 0 ? 'سود' : 'زیان'}
                            </p>
                            {financialData.summary.totalIncome === 0 && financialData.summary.totalExpenses === 0 && (
                              <p className="text-xs text-gray-500 mt-1">هیچ تراکنشی ثبت نشده است</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 mt-6">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بخش</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ (افغانی)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">درآمد کل (شهریه دانش‌آموزان)</td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                              {financialData.summary.totalIncome.toLocaleString('fa-IR')} افغانی
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">مصارف کل (معاش معلمین + هزینه‌های جاری)</td>
                            <td className="px-6 py-4 whitespace-nowrap text-red-600 font-semibold">
                              {financialData.summary.totalExpenses.toLocaleString('fa-IR')} افغانی
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">توازن (درآمد - مصارف)</td>
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
                      <div className="mt-6 text-center">
                        <button
                          onClick={fetchFinancialData}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          به‌روزرسانی گزارش مالی
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-gray-400 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">هیچ داده مالی وجود ندارد</h3>
                    <p className="text-gray-500 mb-4">
                      {reportType === 'monthly' 
                        ? `هیچ تراکنش مالی برای ماه ${getMonthName(selectedMonth)} ${selectedYear} ثبت نشده است.`
                        : `هیچ تراکنش مالی برای سال ${selectedYear} ثبت نشده است.`}
                    </p>
                    <div className="flex justify-center space-x-reverse space-x-4">
                      <button
                        onClick={() => navigate('/dashboard/studentTuition')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        ثبت شهریه
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/monthlyExpenses')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        ثبت هزینه
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Student Tuition Section */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">شهریه دانش‌آموزان</h2>
                  <button
                    onClick={() => navigate('/dashboard/studentTuition')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    مشاهده جزئیات
                  </button>
                </div>
                
                {apiStatus.tuition.loading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">در حال بارگذاری داده‌های شهریه...</p>
                  </div>
                ) : apiStatus.tuition.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-red-800 mb-2">خطا در دریافت اطلاعات شهریه</h3>
                    <p className="text-red-600 mb-4">{apiStatus.tuition.error}</p>
                    <button
                      onClick={fetchFinancialData}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                ) : tuitionData ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">مجموع شهریه دریافتی</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {(tuitionData.totalPaid || 0).toLocaleString('fa-IR')} افغانی
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">تعداد پرداخت‌ها</p>
                      <p className="text-2xl font-bold text-green-700">
                        {tuitionData.paymentCount || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">دانش‌آموزان پرداخت‌کننده</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {tuitionData.paidStudentCount || 0} نفر
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">دانش‌آموزان باقی‌مانده</p>
                      <p className="text-2xl font-bold text-red-700">
                        {tuitionData.remainingStudentCount || 0} نفر
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-600">هیچ داده‌ای برای شهریه دانش‌آموزان وجود ندارد</p>
                    <button
                      onClick={() => navigate('/dashboard/studentTuition')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      ثبت شهریه جدید
                    </button>
                  </div>
                )}
              </div>
              
              {/* Teacher Salaries Section */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">حقوق معلمین</h2>
                  <button
                    onClick={() => navigate('/dashboard/teacherSalaries')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    مشاهده جزئیات
                  </button>
                </div>
                
                {apiStatus.salaries.loading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4">در حال بارگذاری داده‌های حقوق...</p>
                  </div>
                ) : apiStatus.salaries.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-red-800 mb-2">خطا در دریافت اطلاعات حقوق</h3>
                    <p className="text-red-600 mb-4">{apiStatus.salaries.error}</p>
                    <button
                      onClick={fetchFinancialData}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                ) : salariesData ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">مجموع حقوق پرداخت‌شده</p>
                      <p className="text-2xl font-bold text-green-700">
                        {(salariesData.totalPaidAmount || 0).toLocaleString('fa-IR')} افغانی
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">مجموع حقوق ماهانه</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {(salariesData.totalMonthlySalary || 0).toLocaleString('fa-IR')} افغانی
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">تعداد معلمان پرداخت‌شده</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {salariesData.teachers ? salariesData.teachers.filter(t => t.status === 'پرداخت‌شده').length : 0} نفر
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-600">هیچ داده‌ای برای حقوق معلمین وجود ندارد</p>
                    <button
                      onClick={() => navigate('/dashboard/teacherSalaries')}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      ثبت حقوق جدید
                    </button>
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
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">تنظیمات سیستم</h2>
              <p className="text-gray-600 mb-6">در این بخش می‌توانید تنظیمات سیستم را مدیریت کنید.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">اطلاعات مکتب</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام مکتب</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                      defaultValue="مکتب رهنورد دانش" 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">سال تحصیلی</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                      defaultValue="1402-1403" 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                      rows="3"
                      defaultValue="تهران، خیابان آزادی، کوچه دانش"
                    ></textarea>
                  </div>
                  
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    ذخیره اطلاعات
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">تغییر رمز عبور کاربران</h3>
                  
                  {passwordMessage.text && (
                    <div className={`mb-4 p-3 rounded-md ${
                      passwordMessage.type === 'error' 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {passwordMessage.text}
                    </div>
                  )}
                  
                  {/* فرم تغییر رمز عبور ادمین */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-700 mb-3">تغییر رمز عبور ادمین</h4>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور فعلی</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={passwordChange.admin.current}
                        onChange={(e) => setPasswordChange({
                          ...passwordChange,
                          admin: { ...passwordChange.admin, current: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور جدید</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={passwordChange.admin.new}
                        onChange={(e) => setPasswordChange({
                          ...passwordChange,
                          admin: { ...passwordChange.admin, new: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">تکرار رمز عبور جدید</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={passwordChange.admin.confirm}
                        onChange={(e) => setPasswordChange({
                          ...passwordChange,
                          admin: { ...passwordChange.admin, confirm: e.target.value }
                        })}
                      />
                    </div>
                    
                    <button
                      onClick={() => handlePasswordChange('admin')}
                      disabled={passwordLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور ادمین'}
                    </button>
                  </div>
                  
                  {/* فرم تغییر رمز عبور ادمینیستریتور */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-700 mb-3">تغییر رمز عبور ادمینیستریتور</h4>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور فعلی</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={passwordChange.administrator.current}
                        onChange={(e) => setPasswordChange({
                          ...passwordChange,
                          administrator: { ...passwordChange.administrator, current: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور جدید</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={passwordChange.administrator.new}
                        onChange={(e) => setPasswordChange({
                          ...passwordChange,
                          administrator: { ...passwordChange.administrator, new: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">تکرار رمز عبور جدید</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={passwordChange.administrator.confirm}
                        onChange={(e) => setPasswordChange({
                          ...passwordChange,
                          administrator: { ...passwordChange.administrator, confirm: e.target.value }
                        })}
                      />
                    </div>
                    
                    <button
                      onClick={() => handlePasswordChange('administrator')}
                      disabled={passwordLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور ادمینیستریتور'}
                    </button>
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