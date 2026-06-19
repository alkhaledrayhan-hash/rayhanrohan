## Goal
On mobile, the hero search filters (Location, Property type, Price range) should always be visible — not hidden behind hover/focus. On desktop, keep the current hover-to-expand behavior.

## Change
In `src/components/site/HeroSearch.tsx`, update the collapsible filter wrapper (line 279) so filters are open by default and only collapse-on-hover from `md:` upward.

New classes:
```
mt-3 grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity,margin] duration-500 ease-out
md:mt-0 md:grid-rows-[0fr] md:opacity-0
md:group-hover/search:mt-3 md:group-hover/search:grid-rows-[1fr] md:group-hover/search:opacity-100
md:group-focus-within/search:mt-3 md:group-focus-within/search:grid-rows-[1fr] md:group-focus-within/search:opacity-100
```

No other files affected.