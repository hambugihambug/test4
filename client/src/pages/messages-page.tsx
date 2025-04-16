import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Search,
  Send,
  User,
  Users,
  Clock,
  CheckCheck,
} from "lucide-react";

// 임시 사용자 데이터
const USERS_DATA = [
  { id: 1, name: "김간호사", role: UserRole.NURSE },
  { id: 2, name: "이의사", role: UserRole.NURSE }, // 일단 간호사로 설정
  { id: 3, name: "박보호자", role: UserRole.GUARDIAN },
  { id: 4, name: "최환자", role: UserRole.PATIENT },
];

// 임시 메시지 데이터
const INITIAL_MESSAGES = [
  {
    id: 1,
    senderId: 1,
    receiverId: 30, // Director2의 ID (현재 로그인한 사용자)
    senderName: "김간호사",
    message: "병원장님, 101호실 환자 상태가 호전되고 있습니다.",
    timestamp: new Date(2025, 3, 15, 9, 30),
    read: true,
  },
  {
    id: 2,
    senderId: 30, // Director2의 ID (현재 로그인한 사용자)
    receiverId: 1,
    senderName: "나",
    message: "감사합니다. 계속 관찰 부탁드립니다.",
    timestamp: new Date(2025, 3, 15, 9, 45),
    read: true,
  },
  {
    id: 3,
    senderId: 2,
    receiverId: 30, // Director2의 ID (현재 로그인한 사용자)
    senderName: "이의사",
    message: "병원장님, 오늘 오후에 회의 가능하신지요?",
    timestamp: new Date(2025, 3, 16, 10, 15),
    read: false,
  },
  {
    id: 4,
    senderId: 3,
    receiverId: 30, // Director2의 ID (현재 로그인한 사용자)
    senderName: "박보호자",
    message: "어머니 상태에 대해 상담 요청드립니다.",
    timestamp: new Date(2025, 3, 16, 11, 5),
    read: false,
  },
];

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState(USERS_DATA);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [filteredContacts, setFilteredContacts] = useState(contacts);
  const [currentChat, setCurrentChat] = useState<any[]>([]);

  // 검색어에 따라 연락처 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(
        contacts.filter((contact) =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, contacts]);

  // 선택한 연락처와의 대화 로드
  useEffect(() => {
    if (selectedContact) {
      const chat = messages.filter(
        (msg) =>
          (msg.senderId === selectedContact && msg.receiverId === user?.id) ||
          (msg.senderId === user?.id && msg.receiverId === selectedContact)
      );
      
      // 시간순 정렬
      chat.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setCurrentChat(chat);
      
      // 읽음 표시 업데이트
      const updatedMessages = messages.map((msg) => {
        if (msg.senderId === selectedContact && msg.receiverId === user?.id && !msg.read) {
          return { ...msg, read: true };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
    } else {
      setCurrentChat([]);
    }
  }, [selectedContact, messages, user]);

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact) return;

    try {
      // 실제 API 전송 대신 상태 업데이트로 시뮬레이션
      const newMessage = {
        id: messages.length + 1,
        senderId: user?.id || 0,
        receiverId: selectedContact,
        senderName: "나",
        message: message.trim(),
        timestamp: new Date(),
        read: false,
      };

      setMessages([...messages, newMessage]);
      setMessage("");

      toast({
        title: "메시지 전송 완료",
        description: "메시지가 성공적으로 전송되었습니다.",
      });
    } catch (error) {
      toast({
        title: "메시지 전송 실패",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 연락처 선택 핸들러
  const handleSelectContact = (contactId: number) => {
    setSelectedContact(contactId);
  };

  // 메시지 시간 포맷팅
  const formatMessageTime = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    // 오늘 메시지는 시간만 표시
    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return messageDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 오늘이 아닌 메시지는 날짜와 시간 표시
    return messageDate.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 읽지 않은 메시지 수 계산
  const getUnreadCount = (contactId: number) => {
    return messages.filter(
      (msg) => msg.senderId === contactId && msg.receiverId === user?.id && !msg.read
    ).length;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">메시지</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 연락처 목록 */}
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름으로 검색..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      selectedContact === contact.id
                        ? "bg-primary/10"
                        : "hover:bg-secondary"
                    }`}
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{contact.name}</span>
                        {getUnreadCount(contact.id) > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {getUnreadCount(contact.id)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contact.role === UserRole.NURSE
                          ? "간호사"
                          : contact.role === UserRole.DIRECTOR
                          ? "병원장"
                          : contact.role === UserRole.PATIENT
                          ? "환자"
                          : "보호자"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 메시지 영역 */}
        <div className="md:col-span-2">
          <Card className="h-[calc(100vh-12rem)] flex flex-col">
            {selectedContact ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {contacts.find((c) => c.id === selectedContact)?.name}
                        </CardTitle>
                        <CardDescription>
                          {contacts.find((c) => c.id === selectedContact)?.role === UserRole.NURSE
                            ? "간호사"
                            : contacts.find((c) => c.id === selectedContact)?.role === UserRole.DIRECTOR
                            ? "병원장"
                            : contacts.find((c) => c.id === selectedContact)?.role === UserRole.PATIENT
                            ? "환자"
                            : "보호자"}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
                  {currentChat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs opacity-70">
                            {formatMessageTime(msg.timestamp)}
                          </span>
                          {msg.senderId === user?.id && (
                            <CheckCheck
                              className={`h-3 w-3 ${
                                msg.read ? "text-blue-400" : "opacity-70"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="메시지를 입력하세요..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[2.5rem] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">메시지 앱</h3>
                <p className="text-muted-foreground max-w-md">
                  왼쪽에서 대화 상대를 선택하여 메시지를 주고받으세요.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}