const express = require('express')
const router = express.Router()
const DBController = require('../controllers/db-controller')
const isLogin = require('../middleware/isLogin');

// 미팅리스트, 참가자 정보
router.get('/meetingList', isLogin, DBController.getMeetingList);

// 회의 생성
router.post('/createMeeting', isLogin, DBController.postCreateMeeting); // 회의 생성 시, 스크립트/요약본 모델(document) 생성
// 호스트 id 참여자 목록에 추가됨

// 회의 참여
router.get('/joinMeeting/:code', isLogin, DBController.joinMeeting); // 회의 참여
// 게스트 id 참여자 목록에 추가됨

// 회의 나가기
router.get('/exitMeeting', isLogin, DBController.exitMeeting);

// 회의 삭제
router.post('/deleteMeeting', isLogin, DBController.deleteMeeting); // 회의 삭제

// 회원 정보 수정
router.post('/userInfo', isLogin, DBController.changeUserInfo);// 닉네임 변경
router.delete('/deleteAccount', isLogin, DBController.deleteAccount);// 회원 탈퇴

// 회의 진행
router.get('/currentMeeting', isLogin, DBController.getCurrentMeeting); // 유저의 현재 참여 미팅 불러오기
router.get('/currentMeetingTitle', isLogin, DBController.getCurrentMeetingTitle); // 유저의 현재 참여 중인 회의 제목
router.get('/currentMeetingScript', isLogin, DBController.getCurrentMeetingScript); // 유저의 현재 참여 미팅의 스크립트 불러오기

router.post('/submitMeeting', isLogin, DBController.postSubmitMeeting);  // 회의 종료 시 회의 정보 제출
router.get('/isHost', isLogin, DBController.getIsHost); // 유저의 회의 호스트 여부 판별
router.get('/isMeeting', isLogin, DBController.getIsMeeting); // 유저의 회의 참여 여부 판별
router.get('/setIsMeetingFalse', isLogin, DBController.setIsMeetingFalse); // 회의에 참여 중인 유저의 회의 참여 여부 false로 지정
router.get('/setIsMeetingAllFalse', isLogin, DBController.setIsMeetingAllFalse); // 회의에 참여 중인 모든 유저의 회의 참여 여부 false로 지정
router.post('/saveScripts', isLogin, DBController.postSaveScripts);
// 회의 요약
router.get('/meetingResult/:meetingId', isLogin, DBController.getMeetingResult);
router.post('/meetingResult', isLogin, DBController.postMeetingResult);

module.exports = router;
