export type Language = 'ko' | 'en';

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

interface TranslationMap {
  ko: TranslationObject;
  en: TranslationObject;
}

export const translations: TranslationMap = {
  ko: {
    common: {
      dashboard: '대시보드',
      cctvMonitoring: 'CCTV 모니터링',
      roomManagement: '병실 관리',
      userManagement: '사용자 관리',
      statistics: '통계 및 리포트',
      settings: '설정',
      logout: '로그아웃',
      normal: '정상',
      fallDetected: '낙상감지',
      temperatureHigh: '온도높음',
      username: '아이디',
      password: '비밀번호',
      login: '로그인',
      register: '회원가입',
      name: '이름',
      role: '역할',
      admin: '병원장',
      nurse: '간호사',
      patient: '환자',
      guardian: '보호자',
      save: '저장',
      cancel: '취소',
      confirmAndAction: '확인 및 조치',
      close: '닫기',
      downloadReport: '보고서 다운로드',
      registerNewPatient: '신규 환자 등록',
      edit: '편집',
      savedMessage: '저장되었습니다',
    },
    dashboard: {
      title: '대시보드',
      subtitle: '병원 낙상 감지 및 환경 모니터링 시스템',
      totalPatients: '전체 환자',
      totalRooms: '총 병실',
      todayFallsTitle: '금일 낙상 사고',
      todayFalls: '건',
      environmentalAlerts: '환경 이상 감지',
      increasedBy: '증가',
      occupancyRate: '가동률',
      roomLayout: '병실 - 레이아웃',
      fallIncidentsChart: '낙상 사고 발생 현황',
      environmentMonitoring: '환경 모니터링',
      patientDetails: '환자 정보',
      viewDetails: '상세보기',
      age: '나이',
      heightWeight: '키 / 몸무게',
      bloodType: '혈액형',
      assignedNurse: '담당 간호사',
      fallRisk: '낙상 위험도',
      guardianInfo: '보호자 정보',
      contact: '연락처',
      contactGuardian: '보호자에게 연락',
      fallRiskStats: '낙상 위험도 통계',
      lowRisk: '낮음',
      mediumRisk: '중간',
      highRisk: '높음',
      recentEvents: '최근 이벤트',
      viewAllEvents: '모든 이벤트 보기',
      weeklyView: '주간',
      monthlyView: '월간',
      yearlyView: '연간',
    },
    fallAlert: {
      title: '낙상 감지 경고',
      description: '호 환자 낙상 사고가 감지되었습니다. 즉시 확인이 필요합니다.'
    },
    cctv: {
      title: 'CCTV 모니터링',
      subtitle: '모든 병실 실시간 영상',
      fullscreen: '전체화면',
      allCameras: '모든 카메라',
      selectedRoom: '선택된 병실',
      noStream: '스트림 없음',
      addCamera: '카메라 추가',
      roomName: '병실명',
      cameraName: '카메라명',
      streamUrl: '스트림 URL'
    },
    rooms: {
      title: '병실 관리',
      subtitle: '병실 정보 및 배치',
      addRoom: '병실 추가',
      beds: '침대',
      temperature: '온도',
      humidity: '습도',
      status: '상태',
      layout: '레이아웃',
      patients: '환자',
      tempThreshold: '온도 기준치',
      humidityThreshold: '습도 기준치',
      currentTemperature: '현재 온도',
      currentHumidity: '현재 습도',
      saveLayout: '레이아웃 저장',
      addBed: '침대 추가',
      wall: '벽',
      door: '문',
      emptyRoom: '이 병실에 환자가 없습니다'
    },
    users: {
      title: '사용자 관리',
      subtitle: '모든 사용자의 계정 관리',
      addUser: '사용자 추가',
      searchPlaceholder: '이름 또는 ID로 검색...',
      role: '역할',
      lastLogin: '마지막 로그인',
      actions: '작업',
      assignPatient: '환자 할당',
      nurseManagement: '간호사 관리',
      patientManagement: '환자 관리',
      guardianManagement: '보호자 관리',
      assignedPatients: '담당 환자',
      assignedRoom: '병실',
      medicalInfo: '의료 정보',
      editUser: '사용자 편집',
      deleteUser: '사용자 삭제',
      confirmDelete: '정말로 이 사용자를 삭제하시겠습니까?'
    },
    reports: {
      title: '통계 및 리포트',
      subtitle: '사고 기록 및 환경 데이터 분석',
      generateReport: '리포트 생성',
      fallIncidents: '낙상 사고',
      environmentalData: '환경 데이터',
      patientStatistics: '환자 통계',
      timeRange: '기간',
      rooms: '병실',
      downloadPDF: 'PDF 다운로드',
      downloadCSV: 'CSV 다운로드',
      daily: '일별',
      weekly: '주별',
      monthly: '월별',
      yearly: '연별'
    },
    settings: {
      title: '설정',
      subtitle: '시스템 및 계정 설정',
      accountSettings: '계정 설정',
      systemSettings: '시스템 설정',
      notificationSettings: '알림 설정',
      language: '언어',
      theme: '테마',
      notifications: '알림',
      emailNotifications: '이메일 알림',
      pushNotifications: '푸시 알림',
      smsNotifications: 'SMS 알림',
      fallThreshold: '낙상 감지 기준치',
      temperatureThreshold: '온도 기준치',
      humidityThreshold: '습도 기준치',
      saveSettings: '설정 저장'
    }
  },
  en: {
    common: {
      dashboard: 'Dashboard',
      cctvMonitoring: 'CCTV Monitoring',
      roomManagement: 'Room Management',
      userManagement: 'User Management',
      statistics: 'Statistics & Reports',
      settings: 'Settings',
      logout: 'Logout',
      normal: 'Normal',
      fallDetected: 'Fall Detected',
      temperatureHigh: 'Temperature High',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      register: 'Register',
      name: 'Name',
      role: 'Role',
      admin: 'Administrator',
      nurse: 'Nurse',
      patient: 'Patient',
      guardian: 'Guardian',
      save: 'Save',
      cancel: 'Cancel',
      confirmAndAction: 'Confirm & Action',
      close: 'Close',
      downloadReport: 'Download Report',
      registerNewPatient: 'Register New Patient',
      edit: 'Edit',
      savedMessage: 'Saved successfully',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Hospital Fall Detection and Environment Monitoring System',
      totalPatients: 'Total Patients',
      totalRooms: 'Total Rooms',
      todayFallsTitle: 'Today\'s Falls',
      todayFalls: 'incidents',
      environmentalAlerts: 'Environmental Alerts',
      increasedBy: 'increased by',
      occupancyRate: 'Occupancy rate',
      roomLayout: 'Room Layout',
      fallIncidentsChart: 'Fall Incidents',
      environmentMonitoring: 'Environment Monitoring',
      patientDetails: 'Patient Details',
      viewDetails: 'View Details',
      age: 'Age',
      heightWeight: 'Height / Weight',
      bloodType: 'Blood Type',
      assignedNurse: 'Assigned Nurse',
      fallRisk: 'Fall Risk',
      guardianInfo: 'Guardian Information',
      contact: 'Contact',
      contactGuardian: 'Contact Guardian',
      fallRiskStats: 'Fall Risk Statistics',
      lowRisk: 'Low',
      mediumRisk: 'Medium',
      highRisk: 'High',
      recentEvents: 'Recent Events',
      viewAllEvents: 'View All Events',
      weeklyView: 'Weekly',
      monthlyView: 'Monthly',
      yearlyView: 'Yearly',
    },
    fallAlert: {
      title: 'Fall Detection Alert',
      description: 'A fall has been detected for patient in Room. Immediate attention is required.'
    },
    cctv: {
      title: 'CCTV Monitoring',
      subtitle: 'Real-time video of all rooms',
      fullscreen: 'Fullscreen',
      allCameras: 'All Cameras',
      selectedRoom: 'Selected Room',
      noStream: 'No Stream',
      addCamera: 'Add Camera',
      roomName: 'Room Name',
      cameraName: 'Camera Name',
      streamUrl: 'Stream URL'
    },
    rooms: {
      title: 'Room Management',
      subtitle: 'Room information and layout',
      addRoom: 'Add Room',
      beds: 'Beds',
      temperature: 'Temperature',
      humidity: 'Humidity',
      status: 'Status',
      layout: 'Layout',
      patients: 'Patients',
      tempThreshold: 'Temperature Threshold',
      humidityThreshold: 'Humidity Threshold',
      currentTemperature: 'Current Temperature',
      currentHumidity: 'Current Humidity',
      saveLayout: 'Save Layout',
      addBed: 'Add Bed',
      wall: 'Wall',
      door: 'Door',
      emptyRoom: 'This room has no patients'
    },
    users: {
      title: 'User Management',
      subtitle: 'Manage all user accounts',
      addUser: 'Add User',
      searchPlaceholder: 'Search by name or ID...',
      role: 'Role',
      lastLogin: 'Last Login',
      actions: 'Actions',
      assignPatient: 'Assign Patient',
      nurseManagement: 'Nurse Management',
      patientManagement: 'Patient Management',
      guardianManagement: 'Guardian Management',
      assignedPatients: 'Assigned Patients',
      assignedRoom: 'Assigned Room',
      medicalInfo: 'Medical Info',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      confirmDelete: 'Are you sure you want to delete this user?'
    },
    reports: {
      title: 'Statistics & Reports',
      subtitle: 'Analysis of incidents and environmental data',
      generateReport: 'Generate Report',
      fallIncidents: 'Fall Incidents',
      environmentalData: 'Environmental Data',
      patientStatistics: 'Patient Statistics',
      timeRange: 'Time Range',
      rooms: 'Rooms',
      downloadPDF: 'Download PDF',
      downloadCSV: 'Download CSV',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    },
    settings: {
      title: 'Settings',
      subtitle: 'System and account settings',
      accountSettings: 'Account Settings',
      systemSettings: 'System Settings',
      notificationSettings: 'Notification Settings',
      language: 'Language',
      theme: 'Theme',
      notifications: 'Notifications',
      emailNotifications: 'Email Notifications',
      pushNotifications: 'Push Notifications',
      smsNotifications: 'SMS Notifications',
      fallThreshold: 'Fall Detection Threshold',
      temperatureThreshold: 'Temperature Threshold',
      humidityThreshold: 'Humidity Threshold',
      saveSettings: 'Save Settings'
    }
  }
};
