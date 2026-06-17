export function Footer() {
  return (
    <footer id="contact" className="mt-24 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="font-display text-2xl font-semibold">
            Maison<span className="text-primary">Qatar</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab —
            tailored for the discerning resident.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold">Licensed real estate brokerage · Qatar</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>For Rent</li>
            <li>For Sale</li>
            <li>Off-Plan</li>
            <li>Property Management</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>West Bay, Doha — Qatar</li>
            <li>+974 4000 0000</li>
            <li>hello@maisonqatar.qa</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MaisonQatar. All rights reserved.
      </div>
    </footer>
  );
}
