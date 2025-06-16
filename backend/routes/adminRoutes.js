const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// 사용자 승인 로직
router.get("/pending-users", adminController.getPendingUsers);
router.post("/approve-user", adminController.approveUser);
router.post("/reject", adminController.rejectUser);

// 과목 CRUD
router.get("/subjects", adminController.getSubjects);
router.post("/subjects", adminController.createSubject);
router.put("/subjects/:id", adminController.updateSubject);
router.delete("/subjects/:id", adminController.deleteSubject);

// 학생 정보 관리
router.get("/students", adminController.getAllStudents);
router.put("/students/:id", adminController.updateStudent);


// 승인된 이메일 관리
router.get("/approved-emails", adminController.getApprovedEmails);             // 전체 목록 조회
router.post("/approved-emails", adminController.addApprovedEmail);            // 이메일 추가
router.delete("/approved-emails/:id", adminController.deleteApprovedEmail);   // 이메일 삭제
router.patch("/approved-emails/:id/status", adminController.updateApprovedEmailStatus); // 상태 변경




module.exports = router;
