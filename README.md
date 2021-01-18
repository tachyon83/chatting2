# 채팅 프로그램   
   
    
   
## 소개
  
본 프로젝트는 3인이 수행한 미니 프로젝트이며,   
처음에는 ramgabi님과 함께하다가 그 분이 개인사정으로 빠지시고,   
Danakim21님이 대신하여 프론트를 이어받아 진행하였습니다.   

본 프로젝트의 기획 및 설계에 사용한 문서 링크입니다   
https://www.notion.so/Chatting-Web-Mini-Project-b2105f72f1a543779e018ca617f27bd9   
   
    
백엔드는 제가 맡았고,  
프론트엔드는 ramgabi님과 danakim21님이 맡았습니다.  
https://github.com/ramgabi   
https://github.com/danakim21    

본 Readme에는 백엔드 코드와 관련된 내용만 담겨있습니다.  
    
백엔드: https://github.com/tachyon83/chatting2   
   
     
        
## 개요
   
회원가입, 로그인 등의 기본 사용자 인증을 passport로 구현하였습니다.   
로그인 이후에 socket.io를 통해 소켓이 연결되고,    
채팅방과 사용자 리스트를 받습니다.   
채팅방 입장, 그룹 가입, 채팅방 개설, 채팅, 그룹채팅, 귓속말 등의 기능이 있습니다.   
채팅방 정보, 유저 정보 변경 등의 기능도 있습니다.   
   
Restful한 api를 만들고자 하여 경로명만으로 무엇에 관련한 요청인지 그리고 method를 통해 어떤 기능인지   
파악할 수 있도록 하였습니다. 회원가입과 회원 로그인만 http요청을 통해 수행됩니다.   
나머지는 모두 소켓 이벤트를 통해 관리합니다.   
router에서는 경로를 분기해주는 역할만 하고   
controller를 따로 두어, 데이터베이스 연결, 로직 구현 등의 역할을 수행하도록 하였습니다.   
인증을 위해서는 jwt(json web token)를 사용하였습니다. 

jwt를 통한 인증, 데이터베이스 연결, 모듈화, 라우팅, 컨트롤러 구현, Promise체인 활용, CRUD구현, 클라우드에 배포까지를 목표했습니다.  
  
  
  
## 사용 기술 및 주요 모듈
  
Node Express Passport Mysql Redis Socket.io   
  
   
      
## 폴더 구조
  
index.js : entry point   
dbSetup_heroku.js : 헤로쿠 데이터베이스 셋업   
dbSetup.js : 로컬 데이터베이스 셋업   
&emsp;&emsp;config : jwt, cors등의 각종 세팅   
&emsp;&emsp;controllers : 데이터베이스 연결, 로직처 등의 역할   
&emsp;&emsp;models   
&emsp;&emsp;&emsp;&emsp;Settings   
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;dbConnectionSettings : 데이터베이스 연결 관련 세팅   
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;sqlDispenser : SQL 쿼리문 모음   
&emsp;&emsp;&emsp;&emsp;dbPoolCreator : MySQL연결 Pool 리턴   
&emsp;&emsp;&emsp;&emsp;Dao : DAO 클래스 구현   
&emsp;&emsp;routes   
&emsp;&emsp;&emsp;&emsp;admin : 관리자 모드에서만 사용가능한, admin경로로 들어오는 모든 요청 처리   
&emsp;&emsp;&emsp;&emsp;announcement : 공지사항 등록 및 조회 관련 요청   
&emsp;&emsp;&emsp;&emsp;assessment : 과제 관련 CRUD요청   
&emsp;&emsp;&emsp;&emsp;conversion : 학점 시스템 추가 및 조회 관련 요청      
&emsp;&emsp;&emsp;&emsp;course : 수업 관련 CRUD요청   
&emsp;&emsp;&emsp;&emsp;semester : 학기 관련 CRUD요청   
&emsp;&emsp;&emsp;&emsp;user : 유저 관련 회원가입, 로그인, 정보변경 등의 요청   
&emsp;&emsp;utils : jwt인증, 발급, 세션 인증 관련 미들웨어 등 모음   
   
   
   
## 주요 내용
  
- 백엔드와 프론트엔드가 서로 다른 주소를 통해 배포 (CORS이슈 관리함)  
- 데이터베이스 접속시 connection을 계속 만들지 않고, pool을 활용하여 connection사용 후 반납하는 방식   
- 하나의 파일에서 pool을 만들고 다른 곳에서는 그 pool을 참조하는 방식   
- Dao클래스를 분할하여 쿼리 관련 메서드를 모아둠   
- Routes를 주제에 따라 분할하여 관리   
- jwt를 활용하여 서버가 가벼워짐. 메모리나 데이터베이스를 활용하여 세션을 저장하지 않음.   
- Promise체인을 적극 활용하여, 로직을 단계별로 나누고 유지보수가 편리하도록 함. 직관성도 좋아짐   
  
        
        
## 어려웠거나 배운 점 그리고 보완할 점
   
- 리프레시 토큰을 활용하지 않아 보안 관련 문제를 완벽히 관리하지 못함.   
- 한 학생의 성적 추이를 그래프로 관리하여 보여주는 기능이 있었으면 하는 아쉬움이 있음.   
- SQL에서 join이나 프로시져, 함수 등을 사용하지 않아 불필요하게 많은 쿼리를 요청함. -> ORM을 사용, join, 프로시져 적극 활용 등을 통해 개선 필요함.    
- CORS 이슈 관리가 힘들었음. POST, PUT등의 메서드로 요청이 있을 때 OPTIONS라는 method로 '사전요청'이 있다는 사실을 알게 됨.
- CORS 세팅을 통해 허가할 요청 경로를 명시하여 넣어둘 수 있다는 사실을 알게 됨 (배열도 가능). 현재는 간단하게 true로 되어있음.
- 크롬 브라우저 정책으로 도메인이 다른 곳에서 보내주는 쿠키는 거부한다는 사실을 알게 됨. <- 이를 해결하기 위해 관련 설정 필요하였음.
  (cookie-sameSite, cors-credentials 등등)
- heroku에서 proxy를 앞에 세우기에 관련 설정이 필요하였음.
- 하나의 파일에 모든 것을 넣지 않고, 여러 개의 파일로 분할하는 과정에서 비동기처리의 동기화가 어려웠고,
  공용자원을 한 곳에서만 정의하고 같이 쓰도록 하는 부분도 어려웠음.
  예시: createPool이 비동기 처리인데 그것이 완료된 후에 다른 파일에서 참조하도록 만드는 부분   
- 컨트롤러 분할 시, 같은 함수가 여기저기에서 중복 정의되고 있음. util 함수로 묶어서 관리 필요함. (응답 및 에러 핸들러 등)   
- promise체인 활용시 resolve를 통해 단 하나의 변수(또는 객체)만 전달할 수 있다는 점이 아쉬웠음.   
- resCode를 컨트롤러 내부 메서드마다 일일이 부르는 것도 좋지 않음.   
   
      방 제거 시 로직,
      로그아웃 시에 대한 처리
      각종 맵 데이터 모두 변경
      효율적 관리 필요?
      소켓과 세션을 공유하는 것이 어려웠다
      소켓 관련 이벤트를 모듈화하기 위한 방법을 고민 (실제로는 간단)
      과거 채팅 내역 처리
         
         

