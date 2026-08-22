import { memo } from "react";
import { Bed, Bath, Maximize2, MapPin, Eye, ExternalLink } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface PropertyQuickViewProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PropertyQuickView = memo(function PropertyQuickView({
  property,
  open,
  onOpenChange,
}: PropertyQuickViewProps) {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-primary/20">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-square md:aspect-auto h-full overflow-hidden bg-muted">
            <img
              src={property.image}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground shadow-lg">
                For {property.status}
              </span>
              <span className="rounded-full border border-gold/70 bg-black/60 px-3 py-1 text-[11px] font-medium text-gold backdrop-blur-sm shadow-lg">
                {property.type}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col p-6 md:p-8 justify-between bg-card">
            <div>
              <DialogHeader className="text-left space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium text-sm tracking-wide uppercase">
                  <MapPin className="h-4 w-4" />
                  {property.location}
                </div>
                <DialogTitle className="font-display text-3xl md:text-4xl text-foreground">
                  {property.title}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground mt-2">
                  {property.address}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 grid grid-cols-3 gap-4 border-y border-border py-6">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Bed className="h-5 w-5 text-primary mb-1" />
                  <span className="text-sm font-semibold text-foreground">{property.bedrooms}</span>
                  <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">Beds</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Bath className="h-5 w-5 text-primary mb-1" />
                  <span className="text-sm font-semibold text-foreground">{property.bathrooms}</span>
                  <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">Baths</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Maximize2 className="h-5 w-5 text-primary mb-1" />
                  <span className="text-sm font-semibold text-foreground">{property.sqft.toLocaleString()}</span>
                  <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">Sq Ft</span>
                </div>
              </div>
              
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Price</p>
                <p className="font-display text-4xl font-bold text-primary">
                  {formatPrice(property)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/properties/$id"
                params={{ id: property.id }}
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl group">
                  Full Details
                  <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="h-12 border-primary/30 text-primary hover:bg-primary/5 rounded-xl px-6"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});