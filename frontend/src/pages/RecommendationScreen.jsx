import { Button } from "@/components/ui/button";

export default function RecommendationScreen({ data, onViewDetails, onGetOnPhone }){
  return (
    <div className="kiosk-frame container py-10 space-y-6" data-testid="recommendation-screen-page">
      <div>
        <div className="text-sm tracking-widest text-neutral-500">Your Perfect Matches</div>
        <h2 className="card-title text-4xl mt-2">Tailored to your preferences</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data?.map((p, idx)=> (
          <div key={p.id} className="rounded-xl border border-neutral-200 overflow-hidden bg-white/90 shadow-sm" data-testid={`rec-card-${idx}`}>
            <img src={p.image_url} alt={p.name} className="w-full h-64 object-cover" />
            <div className="p-4">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm subcopy">{p.description || 'Beautifully crafted piece for your look.'}</div>
              <div className="text-sm mt-2">₹{Math.round(p.price*83).toLocaleString('en-IN')}</div>
              <div className="mt-3">
                <Button onClick={()=> onViewDetails(p)} data-testid={`rec-view-${idx}`} className="button-pill">View Details</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Button data-testid="get-on-phone-button" className="button-pill" onClick={onGetOnPhone}>Get These Results on Your Phone</Button>
      </div>
    </div>
  );
}
