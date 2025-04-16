import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserRole } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/contexts/I18nContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Search,
  Send,
  User,
  Users,
  Clock,
  CheckCheck,
  Plus,
  Loader2,
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
  const { t } = useI18n();
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState(USERS_DATA);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [filteredContacts, setFilteredContacts] = useState(contacts);
  const [currentChat, setCurrentChat] = useState<any[]>([]);
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState<string>("");
  const [newMessageText, setNewMessageText] = useState("");

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
  
  // API에서 모든 가능한 수신자 가져오기 
  const { data: availableRecipients, isLoading: isLoadingRecipients } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // 임시 데이터 반환 - 실제로는 API에서 가져와야 함
      return USERS_DATA; 
    },
    enabled: isNewMessageDialogOpen, // 다이얼로그가 열릴 때만 실행
  });
  
  // 새 메시지 전송 핸들러
  const handleSendNewMessage = async () => {
    if (!newMessageText.trim() || !newMessageRecipient) return;
    
    try {
      const recipientId = parseInt(newMessageRecipient);
      const recipient = contacts.find((c) => c.id === recipientId);
      
      if (!recipient) {
        toast({
          title: "수신자를 찾을 수 없음",
          description: "선택된 수신자를 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }
      
      // 새 메시지 객체 생성
      const newMessage = {
        id: messages.length + 1,
        senderId: user?.id || 0,
        receiverId: recipientId,
        senderName: "나",
        message: newMessageText.trim(),
        timestamp: new Date(),
        read: false,
      };
      
      // 메시지 목록에 추가
      setMessages([...messages, newMessage]);
      
      // 다이얼로그 상태 초기화
      setNewMessageText("");
      setNewMessageRecipient("");
      setIsNewMessageDialogOpen(false);
      
      // 새 대화를 선택
      setSelectedContact(recipientId);
      
      toast({
        title: "메시지 전송 완료",
        description: "새 메시지가 성공적으로 전송되었습니다.",
      });
    } catch (error) {
      toast({
        title: "메시지 전송 실패",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">메시지</h1>
        <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 메시지
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>새 메시지 작성</DialogTitle>
              <DialogDescription>
                메시지를 보낼 수신자를 선택하고 내용을 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="recipient" className="text-sm font-medium">
                  수신자 선택
                </label>
                {isLoadingRecipients ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Select
                    value={newMessageRecipient}
                    onValueChange={setNewMessageRecipient}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="수신자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRecipients?.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id.toString()}>
                          {recipient.name} ({recipient.role === UserRole.NURSE
                            ? "간호사"
                            : recipient.role === UserRole.DIRECTOR
                            ? "병원장"
                            : recipient.role === UserRole.PATIENT
                            ? "환자"
                            : "보호자"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  메시지 내용
                </label>
                <Textarea
                  id="message"
                  placeholder="보낼 메시지를 입력하세요..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="secondary" 
                onClick={() => setIsNewMessageDialogOpen(false)}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={!newMessageText.trim() || !newMessageRecipient}
                onClick={handleSendNewMessage}
              >
                보내기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
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