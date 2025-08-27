import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    academicYear: "",
    teacher: ""
  });
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/classes", {
          headers: { "x-auth-token": token },
        });
        setClasses(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/teachers", {
          headers: { "x-auth-token": token },
        });
        setTeachers(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
    fetchTeachers();
    setLoading(false);
  }, []);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/classes", formData, {
        headers: { "x-auth-token": token },
      });
      // Refresh classes list
      const response = await axios.get("http://localhost:5000/api/classes", {
        headers: { "x-auth-token": token },
      });
      setClasses(response.data);
      // Reset form
      setFormData({
        name: "",
        academicYear: "",
        teacher: ""
      });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    }
  };
  const handleEdit = (cls) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      academicYear: cls.academicYear,
      teacher: cls.teacher?._id || ""
    });
    setShowEditForm(true);
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/classes/${selectedClass._id}`,
        formData,
        {
          headers: { "x-auth-token": token },
        }
      );
      // Refresh classes list
      const response = await axios.get("http://localhost:5000/api/classes", {
        headers: { "x-auth-token": token },
      });
      setClasses(response.data);
      // Reset form
      setFormData({
        name: "",
        academicYear: "",
        teacher: ""
      });
      setShowEditForm(false);
      setSelectedClass(null);
    } catch (err) {
      console.error(err);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm("آیا از حذف این صنف مطمئن هستید؟")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/classes/${id}`, {
          headers: { "x-auth-token": token },
        });
        // Refresh classes list
        const response = await axios.get("http://localhost:5000/api/classes", {
          headers: { "x-auth-token": token },
        });
        setClasses(response.data);
      } catch (err) {
        console.error(err);
      }
    }
  };
  const handleViewStudents = (classId) => {
    navigate(`/students/${classId}`);
  };
  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }
  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">مدیریت صنف ها</h2>
        {user && (user.role === "administrator" || user.role === "admin") && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            افزودن صنف جدید
          </button>
        )}
      </div>
      {/* Add Class Form */}
      {showAddForm && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">افزودن صنف جدید</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام صنف
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سال تحصیلی
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  معلم
                </label>
                <select
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">انتخاب معلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
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
      {/* Edit Class Form */}
      {showEditForm && selectedClass && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">ویرایش صنف</h3>
          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام صنف
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سال تحصیلی
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  معلم
                </label>
                <select
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">انتخاب معلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-reverse space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedClass(null);
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
      {/* Classes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                نام صنف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                سال تحصیلی
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                معلم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تعداد دانش‌آموزان
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((cls) => (
              <tr key={cls._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewStudents(cls._id)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    {cls.name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cls.academicYear}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cls.teacher
                    ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cls.studentCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user && user.role === "administrator" && (
                    <>
                      <button
                        onClick={() => handleEdit(cls)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(cls._id)}
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
export default Classes;