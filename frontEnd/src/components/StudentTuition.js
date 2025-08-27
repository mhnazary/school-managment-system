import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentTuition = () => {
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [annualReport, setAnnualReport] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsWithPayment, setStudentsWithPayment] = useState([]);
  const [loading, setLoading] = useState(true);

  // سال را با اعداد لاتین می‌گیریم
  const getCurrentPersianYear = () => {
    const now = new Date();
    const persianYear = now.toLocaleDateString("fa-IR-u-nu-latn", {
      year: "numeric",
    });
    return parseInt(persianYear, 10);
  };

  const [selectedYear, setSelectedYear] = useState(
    getCurrentPersianYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );

  const [selectedClass, setSelectedClass] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [user, setUser] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Persian months
  const persianMonths = [
    "حمل",
    "ثور",
    "جوزا",
    "سرطان",
    "اسد",
    "سنبله",
    "میزان",
    "عقرب",
    "قوس",
    "جدی",
    "دلو",
    "حوت",
  ];

  // Generate years for dropdown
  const generateYears = () => {
    const currentYear = getCurrentPersianYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

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
        alert("خطا در دریافت اطلاعات کلاس‌ها");
      }
    };

    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/students", {
          headers: { "x-auth-token": token },
        });
        setStudents(response.data);
      } catch (err) {
        console.error(err);
        alert("خطا در دریافت اطلاعات دانش‌آموزان");
      }
    };

    fetchClasses();
    fetchStudents();
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setReportLoading(true);
      try {
        const token = localStorage.getItem("token");

        if (reportType === "monthly") {
          const response = await axios.get(
            "http://localhost:5000/api/payments/reports/monthly",
            {
              headers: { "x-auth-token": token },
              params: {
                year: selectedYear,
                month: selectedMonth,
              },
            }
          );
          setMonthlyReport(response.data);
        } else {
          const response = await axios.get(
            "http://localhost:5000/api/payments/reports/annual",
            {
              headers: { "x-auth-token": token },
              params: {
                year: selectedYear,
              },
            }
          );
          setAnnualReport(response.data);
        }
      } catch (err) {
        console.error(err);
        alert("خطا در دریافت گزارش");
      } finally {
        setReportLoading(false);
      }
    };

    fetchReports();
  }, [selectedMonth, selectedYear, reportType]);

  // دریافت وضعیت پرداخت دانش‌آموزان برای ماه و سال انتخاب شده
  useEffect(() => {
    const fetchStudentsPaymentStatus = async () => {
      if (students.length === 0) return;

      setStatusLoading(true);
      try {
        const token = localStorage.getItem("token");

        // استفاده از مسیر جدید برای دریافت پرداخت‌های هر دانش‌آموز برای ماه و سال خاص
        const studentsWithStatus = await Promise.all(
          students.map(async (student) => {
            try {
              // دریافت پرداخت‌های دانش‌آموز برای ماه و سال انتخاب شده
              const paymentsResponse = await axios.get(
                `http://localhost:5000/api/payments/student/${student._id}/payments-by-month`,
                {
                  headers: { "x-auth-token": token },
                  params: {
                    month: selectedMonth,
                    year: selectedYear,
                  },
                }
              );

              const payments = paymentsResponse.data;
              const totalPaid = payments.reduce(
                (sum, payment) => sum + payment.amount,
                0
              );

              let status;
              if (totalPaid > 0) {
                status = "پرداخت‌شده";
              } else {
                status = "پرداخت‌نشده";
              }

              return {
                ...student,
                paymentStatus: {
                  totalPaid,
                  status,
                  month: selectedMonth,
                  year: selectedYear,
                  payments: payments,
                },
              };
            } catch (err) {
              console.error(
                `Error fetching payment status for student ${student._id}:`,
                err
              );
              return {
                ...student,
                paymentStatus: {
                  totalPaid: 0,
                  status: "پرداخت‌نشده",
                  month: selectedMonth,
                  year: selectedYear,
                  payments: [],
                },
              };
            }
          })
        );

        setStudentsWithPayment(studentsWithStatus);
      } catch (err) {
        console.error(err);
        alert("خطا در دریافت وضعیت پرداخت دانش‌آموزان");
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStudentsPaymentStatus();
  }, [students, selectedMonth, selectedYear]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "پرداخت‌شده":
        return "✅";
      case "باقی‌مانده":
        return "⏳";
      case "پرداخت‌نشده":
        return "❌";
      default:
        return "";
    }
  };

  const getMonthName = (monthNumber) => {
    if (!monthNumber) return "";
    const num = parseInt(monthNumber, 10);
    if (isNaN(num) || num < 1 || num > 12) return "";
    return persianMonths[num - 1];
  };

  const filteredStudents = studentsWithPayment.filter((student) => {
    const matchesSearch =
      searchTerm === "" ||
      (student.studentId && student.studentId.includes(searchTerm)) ||
      (student.firstName &&
        student.lastName &&
        `${student.firstName} ${student.lastName}`.includes(searchTerm));

    const matchesClass =
      selectedClass === "" ||
      (student.class && student.class._id === selectedClass);

    const matchesPaymentStatus =
      paymentStatus === "" ||
      (student.paymentStatus && student.paymentStatus.status === paymentStatus);

    return matchesSearch && matchesClass && matchesPaymentStatus;
  });

  // محاسبه مقادیر برای گزارش از داده‌های دانش‌آموزان
  const calculateReportData = () => {
    // محاسبه برای گزارش (مشترک برای ماهانه و سالانه)
    const totalPaid = filteredStudents.reduce((sum, student) => {
      return sum + (student.paymentStatus?.totalPaid || 0);
    }, 0);

    // محاسبه مجموع شهریه پایه مورد انتظار
    const totalExpected = filteredStudents.reduce((sum, student) => {
      if (student.baseFee) {
        if (reportType === "monthly") {
          return sum + student.baseFee;
        } else {
          // برای گزارش سالانه: شهریه پایه × 12 ماه
          return sum + student.baseFee * 12;
        }
      }
      return sum;
    }, 0);

    // محاسبه مجموع مبلغ باقی‌مانده
    const totalRemaining = totalExpected - totalPaid;

    const paidStudentCount = filteredStudents.filter(
      (student) => student.paymentStatus?.status === "پرداخت‌شده"
    ).length;

    const remainingStudentCount = filteredStudents.filter(
      (student) => student.paymentStatus?.status === "پرداخت‌نشده"
    ).length;

    return {
      totalPaid,
      totalExpected,
      totalRemaining,
      paidStudentCount,
      remainingStudentCount,
    };
  };

  const reportData = calculateReportData();

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      <h2 className="text-xl font-semibold mb-6">شهریه دانش‌آموزان</h2>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع گزارش
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="monthly">ماهانه</option>
              <option value="annual">سالانه</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              سال
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {generateYears().map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {reportType === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ماه
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {persianMonths.map((month, index) => (
                  <option key={index} value={(index + 1).toString()}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              صنف
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">همه صنف‌ها</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وضعیت پرداخت
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="پرداخت‌شده">پرداخت‌شده ✅</option>
              <option value="پرداخت‌نشده">پرداخت‌نشده ❌</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            جستجو (نمبر اساس یا نام)
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="جستجو بر اساس نمبر اساس یا نام دانش‌آموز"
          />
        </div>
      </div>

      {/* Summary */}
      {reportLoading ? (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
          <p>در حال بارگذاری گزارش...</p>
        </div>
      ) : (
        <>
          {reportType === "monthly" && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">خلاصه گزارش ماهانه</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    مجموع شهریه پایه مورد انتظار
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.totalExpected.toLocaleString("fa-IR")} افغانی
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">مجموع مبلغ پرداخت شده</p>
                  <p className="text-lg font-semibold">
                    {reportData.totalPaid.toLocaleString("fa-IR")} افغانی
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">مجموع مبلغ باقی‌مانده</p>
                  <p
                    className={`text-lg font-semibold ${
                      reportData.totalRemaining > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {reportData.totalRemaining.toLocaleString("fa-IR")} افغانی
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    دانش‌آموزان پرداخت‌کننده
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.paidStudentCount} نفر
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    دانش‌آموزان باقی‌مانده
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.remainingStudentCount} نفر
                  </p>
                </div>
              </div>
            </div>
          )}

          {reportType === "annual" && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">خلاصه گزارش سالانه</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="">
                  <p className="text-sm text-gray-600">مجموع مبلغ پرداخت شده</p>
                  <p className="text-lg font-semibold">
                    {reportData.totalPaid.toLocaleString("fa-IR")} افغانی
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">مجموع فیس مورد انتظار</p>
                  <p className="text-lg font-semibold">
                    {reportData.totalExpected.toLocaleString("fa-IR")} افغانی
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">مجموع مبلغ باقی‌مانده</p>
                  <p
                    className={`text-lg font-semibold ${
                      reportData.totalRemaining > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {reportData.totalRemaining.toLocaleString("fa-IR")} افغانی
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    دانش‌آموزان پرداخت‌کننده
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.paidStudentCount} نفر
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    دانش‌آموزان باقی‌مانده
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.remainingStudentCount} نفر
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading indicator for student status */}
      {statusLoading && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-center">
          <p>در حال به‌روزرسانی وضعیت پرداخت دانش‌آموزان...</p>
        </div>
      )}

      {/* Students List */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          {reportType === "monthly"
            ? `لیست دانش‌آموزان (${getMonthName(
                selectedMonth
              )} ${selectedYear})`
            : `لیست دانش‌آموزان (${selectedYear})`}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نام و تخلص
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نمبر اساس
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  صنف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  شهریه پایه
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مبلغ پرداخت‌شده
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  جزئیات پرداخت
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const paymentStatus = student.paymentStatus || {};
                const paidAmount = paymentStatus.totalPaid || 0;
                const status = paymentStatus.status || "پرداخت‌نشده";
                const payments = paymentStatus.payments || [];

                // محاسبه شهریه پایه مورد انتظار
                const expectedAmount =
                  reportType === "monthly"
                    ? student.baseFee || 0
                    : (student.baseFee || 0) * 12;

                // محاسبه مبلغ باقی‌مانده
                const remainingAmount = expectedAmount - paidAmount;

                return (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.class?.name || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.baseFee
                        ? student.baseFee.toLocaleString("fa-IR") + " افغانی"
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {paidAmount.toLocaleString("fa-IR")} افغانی
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          status === "پرداخت‌شده"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getStatusIcon(status)} {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payments.length > 0 ? (
                        <div>
                          {payments.map((payment, index) => (
                            <div key={index} className="text-xs">
                              {getMonthName(payment.installment?.split("/")[1])}
                              : {payment.amount.toLocaleString("fa-IR")} افغانی
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>بدون پرداخت</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              هیچ دانش‌آموزی با این فیلترها یافت نشد
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTuition;
