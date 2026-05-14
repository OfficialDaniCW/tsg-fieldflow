import { base44 } from '@/api/base44Client';
import { MessageCircle, Smartphone, CheckCircle2, Info, Sparkles, Image, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhatsAppAgent() {
  const whatsappUrl = base44.agents.getWhatsAppConnectURL('tsg_job_agent');

  const features = [
    { icon: Image, title: 'Send job sheet photos', desc: 'Upload one or multiple job sheet images via WhatsApp — the agent will extract all the data automatically.' },
    { icon: MessageSquare, title: 'Update jobs by text', desc: 'Message the agent to update start/finish times, status, colleague, notes and parts — all without opening the app.' },
    { icon: Sparkles, title: 'AI-powered extraction', desc: 'Job numbers, locations, parts, and times are read from images automatically using AI.' },
    { icon: CheckCircle2, title: 'Mark completion status', desc: 'Tell the agent if a job is done, needs parts, or has wrong parts on site — it updates instantly.' },
  ];

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-grotesk text-2xl font-bold">WhatsApp Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your TSG jobs directly from WhatsApp</p>
      </div>

      {/* Connect card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-grotesk font-bold text-lg">Connect via WhatsApp</h2>
            <p className="text-sm text-white/80 mt-1 mb-4">
              Tap the button below to open WhatsApp and start chatting with your TSG Job Agent. 
              Send photos of job sheets to auto-create jobs, or text to update existing ones.
            </p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-white text-green-700 hover:bg-white/90 gap-2 font-semibold">
                <Smartphone className="w-4 h-4" />
                Open WhatsApp Agent
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What you can do</p>
        <div className="grid gap-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 bg-card border border-border rounded-xl">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example commands */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Example messages to send</p>
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {[
            '"Create job TSG-45678 at Tesco Slough, started 8am finished 4:30pm"',
            '"Job TSG-45678 needs parts: part 123456, need 2"',
            '"Mark job TSG-45678 as completed"',
            '"Job TSG-45678 had wrong parts on site"',
            '"I was with John Smith on job TSG-45678"',
            '"List my incomplete jobs"',
          ].map((cmd, i) => (
            <div key={i} className="px-4 py-3 text-sm text-muted-foreground font-mono hover:bg-muted/50">
              {cmd}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Your WhatsApp agent is powered by AI and connected directly to your job database. 
          All changes made via WhatsApp are reflected in the app instantly.
        </p>
      </div>
    </div>
  );
}