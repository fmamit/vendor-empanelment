import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTenant } from "@/contexts/TenantContext";
import { useTenantLogo } from "@/hooks/useTenantLogo";
import {
  ArrowRight,
  ShieldCheck,
  ScanSearch,
  FileCheck2,
  Workflow,
  Brain,
  AlertTriangle,
  BarChart3,
  Send,
  UserPlus,
  FileText,
  CheckCircle2,
  Building2,
  CreditCard,
  ClipboardCheck,
  RefreshCw,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const FLOW_STEPS = [
  {
    icon: Send,
    title: "Invite or Self-Register",
    desc: "Staff sends a link or vendor registers directly on the portal",
  },
  {
    icon: UserPlus,
    title: "Sign Up & Consent",
    desc: "Vendor provides DPDP consent and creates their profile",
  },
  {
    icon: Building2,
    title: "Company & Bank Details",
    desc: "Business information, GST, PAN, and banking details captured",
  },
  {
    icon: FileText,
    title: "Upload Documents",
    desc: "GST certificate, PAN card, cancelled cheque, and more",
  },
  {
    icon: Brain,
    title: "AI Reads & Validates",
    desc: "AI extracts data from documents and cross-checks every field",
  },
  {
    icon: ScanSearch,
    title: "Real-Time Verification",
    desc: "PAN, GST, bank, UPI, Aadhaar verified against government APIs",
  },
  {
    icon: AlertTriangle,
    title: "Fraud Screening",
    desc: "Duplicates, tampering, and suspicious patterns flagged instantly",
  },
  {
    icon: ClipboardCheck,
    title: "Review & Approve",
    desc: "Maker-checker-approver workflow with full audit trail",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Document Analysis",
    desc: "Automatically extracts data from uploaded documents and detects tampering with confidence scoring. Eliminates manual document review entirely.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: ScanSearch,
    title: "6-in-1 Verification Engine",
    desc: "PAN, GST, Bank Account, UPI, Aadhaar, and Credit Reports — all verified in real-time against live government and financial sources.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: AlertTriangle,
    title: "Fraud Detection Dashboard",
    desc: "Catches duplicate GST/PAN/bank accounts, similar company names, and fake documents before they enter your vendor roster.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Workflow,
    title: "Configurable Approval Workflows",
    desc: "Role-based maker/checker/approver process. Send back for corrections, track every action, and maintain a complete audit trail.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: ShieldCheck,
    title: "DPDP Privacy Compliance",
    desc: "PII encryption at rest, automatic masking in UI, data export & erasure rights, consent management, and breach notification — all built in.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const STATS = [
  { value: "< 2 days", label: "Onboarding Time" },
  { value: "6", label: "Verification APIs" },
  { value: "80%", label: "Less Manual Work" },
  { value: "100%", label: "DPDP Compliant" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const logo = useTenantLogo();
  const orgName = tenant?.short_name || "Vendor Portal";
  const dpoEmail = tenant?.dpo_email || "dpo@company.com";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt={orgName} className="h-10 w-auto" />
            <span className="hidden sm:block text-lg font-bold text-primary">
              {orgName} Vendor Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/staff/login")}>
              Staff Login
            </Button>
            <Button variant="outline" onClick={() => navigate("/vendor/login")}>
              Vendor Login
            </Button>
            <Button onClick={() => navigate("/register")}>
              Register <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[hsl(204,100%,30%)] to-[hsl(204,100%,20%)] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-accent font-semibold text-lg mb-4 tracking-wide"
            >
              VENDOR MANAGEMENT PLATFORM
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Onboard vendors in days,
              <br />
              <span className="text-accent">not weeks.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-xl sm:text-2xl text-white/80 mb-10 max-w-2xl leading-relaxed"
            >
              AI-powered verification, real-time fraud detection, and
              compliance-first workflows — from registration to approval in one
              seamless platform.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white h-14 px-8 text-lg"
                onClick={() => navigate("/register")}
              >
                Register as Vendor
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg"
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See How It Works
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — The Flow */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From first contact to approved vendor — a streamlined, fully
              verified process in 8 clear steps.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical line connector (desktop) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

            <div className="space-y-8 lg:space-y-0">
              {FLOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`lg:flex lg:items-center lg:gap-8 ${
                      isLeft ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                  >
                    {/* Content */}
                    <div className={`lg:w-[calc(50%-2rem)] ${isLeft ? "lg:text-right" : "lg:text-left"}`}>
                      <Card className="inline-block w-full hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-start gap-4">
                          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-lg text-foreground">
                              {step.title}
                            </h3>
                            <p className="text-muted-foreground mt-1">{step.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Step number on the line (desktop) */}
                    <div className="hidden lg:flex shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground items-center justify-center font-bold text-sm z-10 shadow-lg">
                      {i + 1}
                    </div>

                    {/* Spacer for opposite side */}
                    <div className="hidden lg:block lg:w-[calc(50%-2rem)]" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features — What Makes It Powerful */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Makes It Powerful
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every step in the flow is backed by technology that eliminates
              manual work, catches fraud, and ensures compliance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-5`}>
                        <Icon className={`h-7 w-7 ${feature.color}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before / After Comparison */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The Difference
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-destructive/30 h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-destructive mb-6">Without This Platform</h3>
                  <ul className="space-y-4">
                    {[
                      "7-10 day onboarding cycle",
                      "Manual document review by 3+ people",
                      "Excel spreadsheets for tracking",
                      "No fraud detection until audit",
                      "Paper-based compliance trail",
                      "Duplicate vendors discovered too late",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-muted-foreground">
                        <span className="mt-1 shrink-0 w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-accent/30 h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-accent mb-6">With {orgName} Vendor Portal</h3>
                  <ul className="space-y-4">
                    {[
                      "1-2 day onboarding with real-time verification",
                      "AI reads and validates every document automatically",
                      "Live dashboard with full pipeline visibility",
                      "Fraud flagged before vendor is even approved",
                      "Digital audit trail — DPDP compliant from day one",
                      "Duplicates caught instantly across 6 parameters",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-foreground">
                        <CheckCircle2 className="mt-0.5 shrink-0 h-5 w-5 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary via-[hsl(204,100%,30%)] to-[hsl(204,100%,22%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Register as a vendor in minutes. Our team will verify your details
              and get you approved quickly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white h-14 px-10 text-lg"
                onClick={() => navigate("/register")}
              >
                Register as Vendor
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-14 px-10 text-lg"
                onClick={() => navigate("/staff/login")}
              >
                Staff Login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>DPDP Act Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4" />
              <span>AI-Powered Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Real-Time API Checks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={logo} alt={orgName} className="h-8 w-auto" />
            <span>{orgName} Vendor Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </a>
            {dpoEmail && <span>DPO: {dpoEmail}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
