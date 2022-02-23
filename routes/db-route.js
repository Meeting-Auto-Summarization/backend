const express = require('express')
const router = express.Router()
const DBController = require('../controllers/db-controller')

//미팅리스트, 참가자 정보
router.get('/meetingList', DBController.getMeetingList);

//회의 생성
router.post('/createMeeting', DBController.postCreateMeeting);//회의 생성 시, 스크립트/요약본 모델(document) 생성
//호스트 id 참여자 목록에 추가됨

//회의 참여
router.get('/joinMeeting/:code', DBController.joinMeeting);//회의 참여
//게스트 id 참여자 목록에 추가됨

//스크립트, 요약본 불러오기/수정
router.get('/script/:meetingId', DBController.getScript);//특정 미팅 스크립트 불러오기
router.post('/script/:meetingId', DBController.postScript);//특정 미팅 스크립트 수정
router.get('/report/:meetingId', DBController.getReport);//특정 미팅 요약본 불러오기
router.post('/report/:meetingId', DBController.postReport);//특정 미팅 요약본 수정
router.get('/meeting/:meetingId', DBController.getMeeting);//특정 미팅 전체 불러오기

//회원 정보 수정
router.post('/changeNickname/:nick', DBController.postNick);//닉네임 변경
router.delete('/deleteAccount', DBController.deleteAccount);//회원 탈퇴

//회의 진행
router.get('/currentMeetingId', DBController.getCurrentMeetingId); // 유저의 현재 참여 미팅 ID 불러오기
router.get('/currentMeeting', DBController.getCurrentMeeting); // 유저의 현재 참여 미팅 불러오기
router.get('/currentMeetingScript', DBController.getCurrentMeetingScript); // 유저의 현재 참여 미팅의 스크립트 불러오기
router.get('/currentMeetingReport', DBController.getCurrentMeetingReport); // 유저의 현재 참여 미팅의 요약본 불러오기
router.post('/currentMeetingReport', DBController.postCurrentMeetingReport); // 유저의 현재 참여 미팅의 요약본 설정하기
router.post('/submitMeeting', DBController.postSubmitMeeting);  // 회의 시간 수정
router.get('/isHost', DBController.getIsHost); // 유저의 회의 호스트 여부 판별
router.get('/deleteCurrentMeetingId', DBController.deleteCurrentMeetingId); // 유저의 현재 참여 회의 ID 삭제
router.get('/isMeeting', DBController.getIsMeeting); // 유저의 회의 참여 여부 판별
router.get('/setIsMeetingFalse', DBController.setIsMeetingFalse); // 유저의 회의 참여 여부 false로 지정
router.get('/currentMeetingTitle', DBController.getCurrentMeetingTitle); // 유저의 현재 참여 중인 회의 제목

module.exports = router;
