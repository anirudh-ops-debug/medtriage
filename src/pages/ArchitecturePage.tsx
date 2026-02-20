import DashboardLayout from "@/components/DashboardLayout";
import { ArrowRight } from "lucide-react";

const steps = [
  { label: "Vital Sign Monitor", desc: "IoT device captures HR, BP, SpO₂, Temp" },
  { label: "Secure Backend Server", desc: "Encrypted data transmission & storage" },
  { label: "AI Severity Engine", desc: "ML classification & risk scoring" },
  { label: "Live Risk Classification", desc: "Real-time patient severity badges" },
  { label: "Queue Reordering", desc: "Dynamic priority based on deterioration" },
  { label: "Resource Optimization", desc: "AI-driven bed & staff allocation" },
  { label: "Organ Allocation System", desc: "Transparent, regulation-compliant ranking" },
];

const ArchitecturePage = () => (
  <DashboardLayout>
    <div className="animate-fade-up">
      <h1 className="text-lg font-bold text-foreground mb-1">System Architecture</h1>
      <p className="text-xs text-muted-foreground mb-8">End-to-end data flow from IoT to intelligence</p>

      <div className="flex flex-col items-center gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="stat-card w-96 text-center">
              <p className="text-sm font-bold text-foreground">{step.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="py-2">
                <ArrowRight size={18} className="text-primary rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default ArchitecturePage;
