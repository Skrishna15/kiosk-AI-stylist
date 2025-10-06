import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Section = ({ title, options, value, onChange, name }) => (
  <div>
    <div className="text-sm font-medium mb-2">{title}</div>
    <div className="grid grid-cols-2 gap-3" data-testid={`survey-${name}`}>
      {options.map(opt => (
        <button key={opt} data-testid={`survey-${name}-${opt}`} onClick={()=>onChange(opt)} className={`p-4 rounded-xl border text-left ${value===opt? 'border-emerald-400 bg-emerald-50':'border-neutral-200 bg-white/90 hover:bg-neutral-50'}`}>
          <div className="font-semibold">{opt}</div>
        </button>
      ))}
    </div>
  </div>
);

export default function SurveyScreen({ onSubmit }){
  const [q, setQ] = React.useState({ style:"", occasion:"", budget:"", metal:""});
  const nextDisabled = !(q.style && q.occasion && q.budget && q.metal);
  return (
    <div className="kiosk-frame container py-10 space-y-8" data-testid="survey-screen-page">
      <div>
        <div className="text-sm tracking-widest text-neutral-500">Tell Us About You</div>
        <div className="flex items-center gap-4 mt-2">
          <h2 className="card-title text-4xl">Your Style Profile</h2>
          <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-emerald-400" initial={{ width: 0 }} animate={{ width: nextDisabled? '75%':'100%' }} transition={{ duration: .6 }} />
          </div>
        </div>
        <div className="text-xs subcopy mt-1">4 questions · Tap to choose · Step {nextDisabled? '3/4':'4/4'}</div>
      </div>

      <Section title="Style preference" name="style" value={q.style} onChange={v=>setQ(s=>({...s, style:v}))} options={["Classic","Modern","Vintage","Bohemian"]} />
      <Section title="Occasion" name="occasion" value={q.occasion} onChange={v=>setQ(s=>({...s, occasion:v}))} options={["Everyday","Special Events","Work","Romantic"]} />
      <Section title="Budget range" name="budget" value={q.budget} onChange={v=>setQ(s=>({...s, budget:v}))} options={["Under $500","$500-$1,500","$1,500-$5,000","Above $5,000"]} />
      <Section title="Metal type" name="metal" value={q.metal} onChange={v=>setQ(s=>({...s, metal:v}))} options={["Gold","Silver","Platinum","Rose Gold"]} />

      <div className="flex justify-end">
        <Button data-testid="survey-next-button" className="button-pill" disabled={nextDisabled} onClick={()=> onSubmit(q)}>See Recommendations</Button>
      </div>
    </div>
  );
}
