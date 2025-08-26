import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Classes from "./components/Classes";
import Students from "./components/Students";
import Payment from "./components/Payment";
import Teachers from "./components/Teachers";
import TeacherPayment from "./components/TeacherPayment";
import MonthlyExpenses from "./components/MonthlyExpenses";
import StudentTuition from "./components/StudentTuition";
import TeacherSalaries from "./components/TeacherSalaries";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
           <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:tab" element={<Dashboard />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/students/:classId" element={<Students />} />
          <Route path="/payment/:studentId" element={<Payment />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/teacherPayment/:teacherId" element={<TeacherPayment />} />
          <Route path="/studentTuition" element={<StudentTuition />} />
          <Route path="/teacherSalaries" element={<TeacherSalaries />} />
          <Route path="/monthlyExpenses" element={<MonthlyExpenses />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;