import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MediBotPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm **MediBot**, your medical assistant. I can help with:\n- Possible causes of symptoms\n- Recommended diagnostic tests\n- Medical explanations\n\nHow can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("medibot", {
        body: { message: msg, history: messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0).slice(-10) },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-up flex flex-col h-[calc(100vh-80px)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">MediBot</h1>
            <p className="text-[10px] text-muted-foreground">AI Medical Assistant · For clinical staff only</p>
          </div>
        </div>

        <div className="flex-1 stat-card overflow-y-auto mb-4 space-y-3 p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={12} className="text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-foreground"}`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-xs prose-invert max-w-none [&_p]:text-xs [&_li]:text-xs [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:text-foreground [&_ul]:my-1 [&_p]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : m.content}
              </div>
              {m.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User size={12} className="text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                <Bot size={12} className="text-primary" />
              </div>
              <div className="bg-secondary border border-border rounded-lg px-3 py-2">
                <Loader2 size={14} className="text-muted-foreground animate-spin" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask about symptoms, tests, treatments..."
            className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center gap-1.5">
            <Send size={14} /> Send
          </button>
        </div>

        <p className="text-[9px] text-muted-foreground mt-2 text-center">⚕️ MediBot provides informational guidance only. Not a substitute for professional medical advice.</p>
      </div>
    </DashboardLayout>
  );
};

export default MediBotPage;
