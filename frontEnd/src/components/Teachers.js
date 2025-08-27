import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    birthDate: '',
    specialization: '',
    degree: '',
    experience: '',
    monthlySalary: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);

    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/teachers', {
          headers: { 'x-auth-token': token }
        });
        setTeachers(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTeachers();
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/teachers', formData, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh teachers list
      const response = await axios.get('http://localhost:5000/api/teachers', {
        headers: { 'x-auth-token': token }
      });
      setTeachers(response.data);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        fatherName: '',
        birthDate: '',
        specialization: '',
        degree: '',
        experience: '',
        monthlySalary: '',
        phone: '',
        email: '',
        address: ''
      });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      fatherName: teacher.fatherName,
      birthDate: new Date(teacher.birthDate).toISOString().split('T')[0],
      specialization: teacher.specialization,
      degree: teacher.degree,
      experience: teacher.experience,
      monthlySalary: teacher.monthlySalary,
      phone: teacher.phone,
      email: teacher.email || '',
      address: teacher.address || ''
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/teachers/${selectedTeacher._id}`, formData, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh teachers list
      const response = await axios.get('http://localhost:5000/api/teachers', {
        headers: { 'x-auth-token': token }
      });
      setTeachers(response.data);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        fatherName: '',
        birthDate: '',
        specialization: '',
        degree: '',
        experience: '',
        monthlySalary: '',
        phone: '',
        email: '',
        address: ''
      });
      setShowEditForm(false);
      setSelectedTeacher(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این معلم مطمئن هستید؟')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/teachers/${id}`, {
          headers: { 'x-auth-token': token }
        });
        
        // Refresh teachers list
        const response = await axios.get('http://localhost:5000/api/teachers', {
          headers: { 'x-auth-token': token }
        });
        setTeachers(response.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePayment = (teacherId) => {
    navigate(`/teacherPayment/${teacherId}`);
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">مدیریت معلمین</h2>
        {user && (user.role === 'administrator' || user.role === 'admin') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            افزودن معلم جدید
          </button>
        )}
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">افزودن معلم جدید</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">تخصص</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مدرک تحصیلی</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سابقه کار (سال)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حقوق ماهانه (تومان)</label>
                <input
                  type="number"
                  name="monthlySalary"
                  value={formData.monthlySalary}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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

      {/* Edit Teacher Form */}
      {showEditForm && selectedTeacher && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">ویرایش معلم</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">تخصص</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مدرک تحصیلی</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سابقه کار (سال)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حقوق ماهانه (تومان)</label>
                <input
                  type="number"
                  name="monthlySalary"
                  value={formData.monthlySalary}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  setSelectedTeacher(null);
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

      {/* Teachers Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام و تخلص</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام پدر</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ تولد</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تخصص</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مدرک تحصیلی</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سابقه کار</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حقوق ماهانه</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اطلاعات تماس</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {teacher.firstName} {teacher.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{teacher.fatherName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(teacher.birthDate).toLocaleDateString('fa-IR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{teacher.specialization}</td>
                <td className="px-6 py-4 whitespace-nowrap">{teacher.degree}</td>
                <td className="px-6 py-4 whitespace-nowrap">{teacher.experience} سال</td>
                <td className="px-6 py-4 whitespace-nowrap">{teacher.monthlySalary.toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>{teacher.phone}</div>
                  {teacher.email && <div className="text-sm text-gray-500">{teacher.email}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handlePayment(teacher._id)}
                    className="text-green-600 hover:text-green-900 ml-3"
                  >
                    پرداخت
                  </button>
                  {user && user.role === 'administrator' && (
                    <>
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(teacher._id)}
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

export default Teachers;