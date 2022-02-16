const express = require('express')
const router = express.Router()
const DBController = require('../controllers/db-controller')

router.get('/meetingList', DBController.getMeetingList);//미팅리스트
router.get('/:meetingId/script', DBController.getScript);//특정 미팅 스크립트 불러오기
router.post('/:meetingId/script', DBController.postScript);//특정 미팅 스크립트 수정
router.get('/:meetingId/surmmarize', DBController.getSurmmarize);//특정 미팅 요약본 불러오기
router.post('/:meetingId/surmmarize', DBController.postSurmmarize);//특정 미팅 요약본 수정
router.post('/:nickname/changeNickname', DBController.postNickname);//닉네임 변경
router.delete('/deleteAccount', DBController.deleteAccount);//회원 탈퇴


module.exports = router