import { Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <>
      <Route path="/">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">병원 모니터링 시스템</h1>
          <p>환영합니다. 이 시스템은 환자의 낙상 사고를 감지하고 환경을 모니터링합니다.</p>
        </div>
      </Route>
      <Route path="/:rest*">
        <NotFound />
      </Route>
      <Toaster />
    </>
  );
}

export default App;
