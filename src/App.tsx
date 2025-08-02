import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BoardPage from "./pages/BoardPage";
import StoryPage from "./pages/StoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* 关键：GitHub Pages 的仓库前缀 */}
      <BrowserRouter basename="/card-trail-map">
        <Routes>
          {/* 处理 /card-trail-map（无 /）的空路径 */}
          <Route path="" element={<Navigate to="/" replace />} />

          <Route path="/" element={<BoardPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/story" element={<StoryPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
