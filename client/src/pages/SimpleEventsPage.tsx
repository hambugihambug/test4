import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

// 매우 기본적인 이벤트 페이지 컴포넌트
const SimpleEventsPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">이벤트 페이지</h1>
      

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">최근 이벤트</h2>
          <ul className="space-y-2">
            <li className="p-2 bg-red-50 rounded border border-red-200">낙상 감지 알림 - 304호 (14:30)</li>
            <li className="p-2 bg-blue-50 rounded border border-blue-200">약물 투여 - 302호 (09:00)</li>
            <li className="p-2 bg-orange-50 rounded border border-orange-200">실내 온도 이상 알림 - 305호 (16:45)</li>
            <li className="p-2 bg-purple-50 rounded border border-purple-200">정기 건강 검진 - 301호 (10:30)</li>
            <li className="p-2 bg-green-50 rounded border border-green-200">물리 치료 - 304호 (13:00)</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">필터</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">이벤트 유형</label>
              <select className="w-full p-2 border rounded">
                <option>모든 유형</option>
                <option>낙상</option>
                <option>약물투여</option>
                <option>환경알림</option>
                <option>치료</option>
                <option>검진</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">상태</label>
              <select className="w-full p-2 border rounded">
                <option>모든 상태</option>
                <option>완료</option>
                <option>진행중</option>
                <option>예정</option>
                <option>취소</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input type="date" className="w-full p-2 border rounded" />
            </div>
            
            <Button className="w-full mt-2">필터 적용</Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">모든 이벤트</h2>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜/시간</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">낙상 감지 알림</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">낙상</span></td>
              <td className="px-6 py-4 whitespace-nowrap">2025-04-10 14:30</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">완료</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">약물 투여</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">약물투여</span></td>
              <td className="px-6 py-4 whitespace-nowrap">2025-04-15 09:00</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">예정</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">실내 온도 이상 알림</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">환경알림</span></td>
              <td className="px-6 py-4 whitespace-nowrap">2025-04-12 16:45</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">완료</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">정기 건강 검진</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">검진</span></td>
              <td className="px-6 py-4 whitespace-nowrap">2025-04-18 10:30</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">예정</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">물리 치료</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">치료</span></td>
              <td className="px-6 py-4 whitespace-nowrap">2025-04-14 13:00</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">완료</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleEventsPage;