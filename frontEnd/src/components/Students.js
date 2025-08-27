import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const Students = ({ classId, embedded = false }) => { 
  const { classId: paramsClassId } = useParams();
  const actualClassId = classId || paramsClassId; 
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    grandfatherName: '',
    studentId: '',
    birthDate: '',
    gender: 'پسر',
    parentPhone: '',
    address: '',
    baseFee: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/students/class/${actualClassId}`, {
          headers: { 'x-auth-token': token }
        });
        setStudents(response.data);
        
        if (response.data.length > 0) {
          setClassInfo(response.data[0].class);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
    setLoading(false);
  }, [actualClassId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/students', {
        ...formData,
        class: actualClassId,
        baseFee: formData.baseFee ? parseInt(formData.baseFee) : 0
      }, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh students list
      const response = await axios.get(`http://localhost:5000/api/students/class/${actualClassId}`, {
        headers: { 'x-auth-token': token }
      });
      setStudents(response.data);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        fatherName: '',
        grandfatherName: '',
        studentId: '',
        birthDate: '',
        gender: 'پسر',
        parentPhone: '',
        address: '',
        baseFee: ''
      });
      setShowAddForm(false);
      
      // Show success message
      alert('دانش‌آموز با موفقیت اضافه شد');
    } catch (err) {
      console.error(err);
      alert('خطا در افزودن دانش‌آموز: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      fatherName: student.fatherName,
      grandfatherName: student.grandfatherName,
      studentId: student.studentId,
      birthDate: new Date(student.birthDate).toISOString().split('T')[0],
      gender: student.gender,
      parentPhone: student.parentPhone,
      address: student.address || '',
      baseFee: student.baseFee ? student.baseFee.toString() : ''
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/students/${selectedStudent._id}`, {
        ...formData,
        class: actualClassId,
        baseFee: formData.baseFee ? parseInt(formData.baseFee) : 0
      }, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh students list
      const response = await axios.get(`http://localhost:5000/api/students/class/${actualClassId}`, {
        headers: { 'x-auth-token': token }
      });
      setStudents(response.data);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        fatherName: '',
        grandfatherName: '',
        studentId: '',
        birthDate: '',
        gender: 'پسر',
        parentPhone: '',
        address: '',
        baseFee: ''
      });
      setShowEditForm(false);
      setSelectedStudent(null);
      
      // Show success message
      alert('اطلاعات دانش‌آموز با موفقیت به‌روزرسانی شد');
    } catch (err) {
      console.error(err);
      alert('خطا در به‌روزرسانی دانش‌آموز: ' + (err.response?.data?.msg || err.message));
    }
  };

  // تابع برای هدایت به صفحه پرداخت
  const handlePayment = (studentId) => {
    navigate(`/payment/${studentId}`);
  };

  // تابع برای حذف دانش‌آموز
  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این دانش‌آموز مطمئن هستید؟')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/students/${id}`, {
          headers: { 'x-auth-token': token }
        });
        
        // Refresh students list
        const response = await axios.get(`http://localhost:5000/api/students/class/${actualClassId}`, {
          headers: { 'x-auth-token': token }
        });
        setStudents(response.data);
        
        // Show success message
        alert('دانش‌آموز با موفقیت حذف شد');
      } catch (err) {
        console.error(err);
        alert('خطا در حذف دانش‌آموز: ' + (err.response?.data?.msg || err.message));
      }
    }
  };

  // تابع بازگشت
  const handleGoBack = () => {
    navigate(-1); // بازگشت به صفحه قبلی
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      {/* هدر با دکمه بازگشت */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          {(embedded || !classId) && (
            <button
              onClick={handleGoBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-32 flex justify-normal items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              بازگشت
            </button>
          )}
        </div>
          <div className='font-bold'>
            {classInfo && (
              <p className="text-gray-600"> {classInfo.name} - سال تحصیلی: {classInfo.academicYear}</p>
            )}
          </div>
        {user && (user.role === 'administrator' || user.role === 'admin') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            افزودن دانش‌آموز جدید
          </button>
        )}
      </div>
      
      {/* Add Student Form */}
      {showAddForm && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">افزودن دانش‌آموز جدید</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تخلص</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام پدر</label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام پدرکلان</label>
                <input
                  type="text"
                  name="grandfatherName"
                  value={formData.grandfatherName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نمبر اساس</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ تولد</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">جنسیت</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="پسر">پسر</option>
                  <option value="دختر">دختر</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس والدین</label>
                <input
                  type="text"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شهریه پایه (افغانی)</label>
                <input
                  type="number"
                  name="baseFee"
                  value={formData.baseFee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                ></textarea>
              </div>
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
                ذخیره
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Edit Student Form */}
      {showEditForm && selectedStudent && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">ویرایش دانش‌آموز</h3>
          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تخلص</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام پدر</label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام پدرکلان</label>
                <input
                  type="text"
                  name="grandfatherName"
                  value={formData.grandfatherName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نمبر اساس</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ تولد</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">جنسیت</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="پسر">پسر</option>
                  <option value="دختر">دختر</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس والدین</label>
                <input
                  type="text"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شهریه پایه (افغانی)</label>
                <input
                  type="number"
                  name="baseFee"
                  value={formData.baseFee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="2"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-reverse space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                به‌روزرسانی
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام و تخلص</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام پدر</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نمبر اساس</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ تولد</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">جنسیت</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره تماس</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شهریه پایه</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {student.firstName} {student.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{student.fatherName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{student.studentId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(student.birthDate).toLocaleDateString('fa-IR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{student.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap">{student.parentPhone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {student.baseFee ? student.baseFee.toLocaleString('fa-IR') + ' افغانی' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handlePayment(student._id)}
                    className="text-green-600 hover:text-green-900 ml-3"
                  >
                    پرداخت
                  </button>
                  {user && user.role === 'administrator' && (
                    <>
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Students;