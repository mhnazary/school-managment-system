import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MonthlyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(['کرایه ساختمان', 'کتاب و قرطاسیه', 'معاش مدیر و ملازیم','برق و آب', 'سایر']);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [user, setUser] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' }),
    category: ''
  });
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' }),
    description: ''
  });
  
  // Monthly totals
  const [monthlyTotals, setMonthlyTotals] = useState({});
  
  // Persian months
  const persianMonths = [
    "حمل", "ثور", "جوزا", "سرطان", 
    "اسد", "سنبله", "میزان", "عقرب", 
    "قوس", "جدی", "دلو", "حوت"
  ];
  
  // Card colors for months
  const monthColors = [
    'bg-pink-100', 'bg-purple-100', 'bg-indigo-100', 'bg-blue-100',
    'bg-green-100', 'bg-teal-100', 'bg-yellow-100', 'bg-orange-100',
    'bg-red-100', 'bg-rose-100', 'bg-fuchsia-100', 'bg-violet-100'
  ];
  
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    fetchExpenses();
  }, []);
  
  useEffect(() => {
    fetchExpenses();
  }, [filters]);
  
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.category) params.category = filters.category;
      
      const response = await axios.get('process.env.REACT_APP_API_URL/api/expenses', {
        headers: { 'x-auth-token': token },
        params
      });
      
      setExpenses(response.data);
      calculateMonthlyTotals(response.data);
    } catch (err) {
      console.error(err);
      alert('خطا در دریافت اطلاعات مخارج');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateMonthlyTotals = (expensesData) => {
    const totals = {};
    
    // Initialize all months with 0
    persianMonths.forEach((month, index) => {
      totals[index + 1] = 0;
    });
    
    // Calculate totals from expenses
    expensesData.forEach(expense => {
      const month = parseInt(expense.month);
      if (totals[month] !== undefined) {
        totals[month] += expense.amount;
      }
    });
    
    setMonthlyTotals(totals);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingExpense) {
        // Update existing expense
        await axios.put(`process.env.REACT_APP_API_URL/api/expenses/${editingExpense._id}`, {
          ...formData,
          amount: parseInt(formData.amount)
        }, {
          headers: { 'x-auth-token': token }
        });
        alert('هزینه با موفقیت به‌روزرسانی شد');
      } else {
        // Add new expense
        await axios.post('process.env.REACT_APP_API_URL/api/expenses', {
          ...formData,
          amount: parseInt(formData.amount)
        }, {
          headers: { 'x-auth-token': token }
        });
        alert('هزینه با موفقیت ثبت شد');
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
        amount: '',
        category: '',
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' }),
        description: ''
      });
      
      setShowModal(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('خطا در ثبت هزینه');
    }
  };
  
  const handleAddExpense = () => {
    setFormData({
      title: '',
      amount: '',
      category: '',
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' }),
      description: ''
    });
    setEditingExpense(null);
    setShowModal(true);
  };
  
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      month: expense.month,
      year: expense.year,
      description: expense.description
    });
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این هزینه مطمئن هستید؟')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`process.env.REACT_APP_API_URL/api/expenses/${id}`, {
          headers: { 'x-auth-token': token }
        });
        
        alert('هزینه با موفقیت حذف شد');
        fetchExpenses();
      } catch (err) {
        console.error(err);
        alert('خطا در حذف هزینه');
      }
    }
  };
  
  const getMonthName = (monthNumber) => {
    if (!monthNumber) return '';
    const num = parseInt(monthNumber, 10);
    if (isNaN(num) || num < 1 || num > 12) return '';
    return persianMonths[num - 1];
  };
  
  // Calculate total filtered expenses
  const totalFilteredExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Generate years for dropdown
  const generateYears = () => {
    const currentYear = parseInt(new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric' }), 10);
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  };
  
  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">مخارج ماهانه</h2>
        {user && (user.role === 'administrator' || user.role === 'admin') && (
          <button
            onClick={handleAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            ثبت هزینه جدید
          </button>
        )}
      </div>
      
      
      {/* Monthly Cards */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">خلاصه هزینه‌های ماهانه</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {persianMonths.map((month, index) => {
            const monthNumber = index + 1;
            const total = monthlyTotals[monthNumber] || 0;
            const hasExpenses = total > 0;
            
            return (
              <div 
                key={index} 
                className={`${monthColors[index]} p-4 rounded-lg shadow-sm`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{month}</h4>
                    <p className="text-lg font-semibold mt-1">
                      {total.toLocaleString('fa-IR')} افغانی
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${hasExpenses ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <p className={`text-xs mt-2 ${hasExpenses ? 'text-green-700' : 'text-red-700'}`}>
                  {hasExpenses ? 'دارای هزینه' : 'بدون هزینه'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary Card */}
      <div className="mb-8 bg-blue-600 rounded-lg p-6 text-center">
        <p className="text-white text-lg mb-2">مجموع هزینه ها</p>
        <p className="text-white text-4xl font-bold">
          {totalFilteredExpenses.toLocaleString('fa-IR')} افغانی
        </p>
      </div>

      
      {/* Filters */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium mb-4">فیلترها</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">همه ماه‌ها</option>
              {persianMonths.map((month, index) => (
                <option key={index} value={(index + 1).toString()}>{month}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سال</label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {generateYears().map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان هزینه</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">دسته‌بندی</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ (افغانی)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سال/ماه</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td className="px-6 py-4 whitespace-nowrap">{expense.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{expense.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">{expense.amount.toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getMonthName(expense.month)} {expense.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(expense.createdAt).toLocaleDateString('fa-IR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user && user.role === 'administrator' && (
                    <>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </>
                  )}
                  {user && user.role === 'admin' && (
                    <span className="text-gray-500">فقط مشاهده</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {expenses.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            هیچ هزینه‌ای با این فیلترها یافت نشد
          </div>
        )}
      </div>
      
      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">
              {editingExpense ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عنوان هزینه</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ (افغانی)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">انتخاب دسته‌بندی</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {persianMonths.map((month, index) => (
                      <option key={index} value={(index + 1).toString()}>{month}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سال</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {generateYears().map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-reverse space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  {editingExpense ? 'به‌روزرسانی' : 'ثبت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyExpenses;