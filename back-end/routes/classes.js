const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Class = require("../models/Class");
const Student = require("../models/Student");
// @route   GET api/classes
// @desc    Get all classes
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const classes = await Class.find().populate(
      "teacher",
      "firstName lastName"
    );

    // Add student count to each class
    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({ class: cls._id });
        return {
          ...cls.toObject(),
          studentCount,
        };
      })
    );

    res.json(classesWithCount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
// @route   POST api/classes
// @desc    Create a new class
// @access  Private
router.post("/", auth, async (req, res) => {
  const { name, academicYear, teacher } = req.body;

  try {
    const newClass = new Class({
      name,
      academicYear,
      teacher,
    });

    const classObj = await newClass.save();
    res.json(classObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
// @route   PUT api/classes/:id
// @desc    Update a class
// @access  Private (Administrator only)
router.put("/:id", auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== "administrator") {
    return res.status(403).json({ msg: "Access denied" });
  }

  const { name, academicYear, teacher } = req.body;

  try {
    const classObj = await Class.findById(req.params.id);

    if (!classObj) {
      return res.status(404).json({ msg: "Class not found" });
    }

    classObj.name = name || classObj.name;
    classObj.academicYear = academicYear || classObj.academicYear;
    classObj.teacher = teacher || classObj.teacher;

    await classObj.save();
    res.json(classObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/classes/:id
// @desc    Delete a class
// @access  Private (Administrator only)
router.delete("/:id", auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== "administrator") {
    return res.status(403).json({ msg: "Access denied" });
  }

  try {
    // Check if there are students in this class
    const studentCount = await Student.countDocuments({ class: req.params.id });
    if (studentCount > 0) {
      return res.status(400).json({ msg: "Cannot delete class with students" });
    }

    // Use findByIdAndDelete instead of find().remove()
    const classObj = await Class.findByIdAndDelete(req.params.id);

    if (!classObj) {
      return res.status(404).json({ msg: "Class not found" });
    }

    res.json({ msg: "Class removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
