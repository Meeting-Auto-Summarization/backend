const express = require('express')
const router = express.Router()
const DBController = require('../controllers/db-controller')

//미팅리스트, 참가자 정보
router.get('/meetingList', DBController.getMeetingList);

//회의 생성
router.post('/createMeeting', DBController.postCreateMeeting);//회의 생성 시, 스크립트/요약본 모델(document) 생성
//호스트 id 참여자 목록에 추가됨

//회의 참여
router.post('/joinMeeting/:Code', DBController.postJoinMeeting);//회의 참여
//게스트 id 참여자 목록에 추가됨

//스크립트, 요약본 불러오기/수정
router.get('/script/:meetingId', DBController.getScript);//특정 미팅 스크립트 불러오기
router.post('/script/:meetingId', DBController.postScript);//특정 미팅 스크립트 수정
router.get('/report/:meetingId', DBController.getReport);//특정 미팅 요약본 불러오기
router.post('/report/:meetingId', DBController.postReport);//특정 미팅 요약본 수정

//회원 정보 수정
router.post('/changeNickname/:nick', DBController.postNick);//닉네임 변경
router.delete('/deleteAccount', DBController.deleteAccount);//회원 탈퇴


module.exports = router