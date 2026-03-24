import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTenant } from "@/contexts/TenantContext";
import { useTenantLogo } from "@/hooks/useTenantLogo";
import {
  ArrowRight,
  ShieldCheck,
  ScanSearch,
  FileCheck2,
  Brain,
  CheckCircle2,
  Lock,
  RefreshCw,
  ClipboardCheck,
  Send,
  BadgeCheck,
  IndianRupee,
  Sparkles,
  AlertTriangle,
  Workflow,
  FileText,
  UserCheck,
  ChevronDown,
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

const PHASES = [
  {
    step: "01",
    icon: Send,
    title: "Onboard",
    desc: "Invite vendors with a single link. They submit documents, verify their identity, and provide DPDP consent — all in one flow.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    step: "02",
    icon: ScanSearch,
    title: "Verify",
    desc: "AI reads every document. PAN, GST, bank account, Aadhaar — verified against government APIs in real time. Fraud flagged instantly.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    step: "03",
    icon: BadgeCheck,
    title: "Audit-Ready",
    desc: "Complete digital trail for every vendor. Review, approve, and download compliance reports. Your next audit is already done.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Document Analysis",
    desc: "Extracts data from GST certificates, PAN cards, cheques — and catches tampering. No manual review needed.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: ScanSearch,
    title: "5-in-1 Verification",
    desc: "PAN, GST, Bank Account, Aadhaar, and Credit — all verified against live government and financial sources.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: AlertTriangle,
    title: "Fraud Detection",
    desc: "Duplicate GST, PAN, or bank accounts? Fake documents? Suspicious patterns? Caught before they enter your roster.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Workflow,
    title: "Review & Approve Workflow",
    desc: "Two-stage review process with full audit trail. Send back for corrections, track every action, stay audit-ready.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: ShieldCheck,
    title: "DPDP Compliant by Design",
    desc: "PII encryption, automatic masking, data export & erasure rights, consent management — built in from day one.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: ClipboardCheck,
    title: "Downloadable Reports",
    desc: "Export your verification dashboard as PDF anytime. Share with management, attach to audits, prove compliance.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

const STATS = [
  { value: "< 48 hrs", label: "Verification Turnaround" },
  { value: "6", label: "Government API Checks" },
  { value: "80%", label: "Less Manual Work" },
  { value: "100%", label: "DPDP Compliant" },
];

const PRICING = [
  {
    name: "Starter",
    price: "2,499",
    vendors: "Up to 10",
    desc: "For teams getting started with vendor verification",
    popular: false,
  },
  {
    name: "Professional",
    price: "5,999",
    vendors: "11 – 30",
    desc: "For growing organizations with regular vendor onboarding",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "11,999",
    vendors: "31+",
    desc: "For large teams with high vendor volumes",
    popular: false,
  },
];

const WORKFLOW_STEPS = [
  {
    icon: Send,
    title: "You Send an Invite",
    desc: "Share a unique link with your vendor. One click — no manual forms to fill on your side.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
  },
  {
    icon: UserCheck,
    title: "Vendor Verifies Identity",
    desc: "Vendor enters their mobile and email, verifies via OTP. Identity confirmed before anything else.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    ring: "ring-indigo-200",
  },
  {
    icon: FileText,
    title: "Documents & Details Submitted",
    desc: "Company details, banking info, GST certificate, PAN card, cancelled cheque — all collected in one go with DPDP consent.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
  },
  {
    icon: Brain,
    title: "AI Reads Every Document",
    desc: "Our AI extracts data from uploaded documents, cross-checks fields, and flags tampering — with confidence scores.",
    color: "text-pink-600",
    bg: "bg-pink-50",
    ring: "ring-pink-200",
  },
  {
    icon: ScanSearch,
    title: "5-in-1 Government Verification",
    desc: "PAN, GST, Bank Account, Aadhaar, and Credit Report — verified against live government and financial APIs.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  {
    icon: AlertTriangle,
    title: "Fraud Flagged Automatically",
    desc: "Duplicate GST/PAN, similar company names, tampered documents — flagged before they reach your reviewer.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  {
    icon: ClipboardCheck,
    title: "Reviewer Reviews & Forwards",
    desc: "Your team reviews the AI analysis, verifies documents, and forwards to the approver — or sends back for corrections.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    ring: "ring-cyan-200",
  },
  {
    icon: BadgeCheck,
    title: "Approver Signs Off",
    desc: "Final approval with a complete audit trail. Vendor is onboarded. Your compliance report is ready to download.",
    color: "text-green-600",
    bg: "bg-green-50",
    ring: "ring-green-200",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const logo = useTenantLogo();
  const orgName = tenant?.short_name || "In-Sync";
  const dpoEmail = tenant?.dpo_email || "dpo@company.com";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt={orgName} className="h-10 w-auto" />
            <span className="hidden sm:block text-lg font-bold text-primary">
              {orgName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/staff/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/register")}>
              Register Your Organization <ArrowRight className="h-4 w-4 ml-1" />
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
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              First 5 vendor verifications free — no card required
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Verify once.
              <br />
              <span className="text-accent">Stay audit-ready forever.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-xl sm:text-2xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The vendor verification platform that purchase managers trust.
              AI-powered checks, real-time government API verification, and a
              compliance trail that&apos;s always ready for audit.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white h-14 px-10 text-lg"
                onClick={() => navigate("/register")}
              >
                Start Free — Verify 5 Vendors
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-14 px-10 text-lg"
                onClick={() => {
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" });
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
                <div className="text-3xl sm:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — 3 Phases */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Three Steps to Verified Vendors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From invitation to audit-ready — a streamlined process that
              replaces weeks of manual work.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {PHASES.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.15 }}
                >
                  <Card
                    className={`h-full border-2 ${phase.border} hover:shadow-lg transition-shadow`}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-5">
                        <div
                          className={`w-14 h-14 rounded-2xl ${phase.bg} flex items-center justify-center`}
                        >
                          <Icon className={`h-7 w-7 ${phase.color}`} />
                        </div>
                        <span className="text-4xl font-bold text-muted-foreground/30">
                          {phase.step}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {phase.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {phase.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for Compliance Teams
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to eliminate manual work and keep you
              audit-ready at all times.
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
                      <div
                        className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-5`}
                      >
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

      {/* Before / After */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Stop Firefighting. Start Verifying.
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
                  <h3 className="text-xl font-bold text-destructive mb-6">
                    Without {orgName}
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "7–10 days to verify a single vendor",
                      "Manual document review across multiple teams",
                      "Vendor data scattered in spreadsheets and emails",
                      "Fraud discovered only during audits",
                      "Paper-based compliance trail that nobody trusts",
                      "Every audit is a scramble",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-muted-foreground"
                      >
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
                  <h3 className="text-xl font-bold text-accent mb-6">
                    With {orgName}
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Vendors verified in under 48 hours",
                      "AI reads and validates every document automatically",
                      "One dashboard — every vendor, every status, every document",
                      "Fraud flagged before a vendor enters your supply chain",
                      "Digital audit trail — DPDP compliant from day one",
                      "Download your compliance report anytime. Audit done.",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-foreground"
                      >
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

      {/* Application Workflow — How It Works (detailed) */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works — Step by Step
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From invite to approved vendor — here&apos;s exactly what happens
              at every stage.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {WORKFLOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="relative flex gap-4 sm:gap-6"
                  >
                    {/* Step number + icon */}
                    <div className="relative z-10 flex flex-col items-center shrink-0">
                      <div
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${step.bg} ring-4 ring-background ${step.ring} flex items-center justify-center`}
                      >
                        <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${step.color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-1 sm:pt-3 pb-2 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">
                          Step {i + 1}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom connector arrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-center mt-8"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-accent bg-accent/10 rounded-full px-5 py-2.5">
                <CheckCircle2 className="h-5 w-5" />
                Vendor verified. Audit trail complete.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you&apos;re ready. No hidden fees.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-accent/10 text-accent font-semibold rounded-full px-5 py-2 text-sm">
              <Sparkles className="h-4 w-4" />
              First 5 vendor verifications completely free
            </span>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`h-full relative ${
                    plan.popular
                      ? "border-2 border-primary shadow-lg scale-105"
                      : "border border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="p-8 text-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {plan.desc}
                    </p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-foreground flex items-center justify-center">
                        <IndianRupee className="h-7 w-7" />
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /month + GST
                      </span>
                    </div>
                    <div className="text-sm font-medium text-primary mb-8">
                      {plan.vendors} vendors/month
                    </div>
                    <Button
                      className={`w-full h-12 ${
                        plan.popular
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                      onClick={() => navigate("/register")}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <ul className="mt-8 space-y-3 text-left text-sm">
                      {[
                        "6-in-1 government API verification",
                        "AI document analysis",
                        "Fraud detection",
                        "Review & approve workflow",
                        "DPDP compliance built-in",
                        "PDF report downloads",
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary via-[hsl(204,100%,30%)] to-[hsl(204,100%,22%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Your next audit shouldn&apos;t be a fire drill.
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Start verifying vendors today. Your first 5 are on us.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white h-14 px-10 text-lg"
                onClick={() => navigate("/register")}
              >
                Start Free — No Card Required
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-14 px-10 text-lg"
                onClick={() => navigate("/staff/login")}
              >
                Login
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
            <span>{orgName} Vendor Verification Portal</span>
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
