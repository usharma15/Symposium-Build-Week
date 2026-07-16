"use client";

import { Clock3, Flame, SlidersHorizontal, TrendingUp, X } from "lucide-react";
import type {
  CommunityFeedContent,
  CommunityFeedFilter,
  CommunityFeedSort,
  CommunityPopularityWindow
} from "@/features/communities/communityPolicy";

const contentOptions: Array<{ value: CommunityFeedContent; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "thought", label: "Thoughts" },
  { value: "paper", label: "Papers" },
  { value: "opportunity", label: "Opportunities" },
  { value: "proposal", label: "Proposals" }
];

const windowOptions: Array<{ value: CommunityPopularityWindow; label: string }> = [
  { value: "day", label: "Past day" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
  { value: "three-years", label: "Past 3 years" },
  { value: "all-time", label: "All time" }
];

export function CommunityFeedFilterModal({
  value,
  onChange,
  onClose
}: {
  value: CommunityFeedFilter;
  onChange: (value: CommunityFeedFilter) => void;
  onClose: () => void;
}) {
  const setSort = (sort: CommunityFeedSort) => onChange({ ...value, sort });
  return (
    <div className="community-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="community-filter-modal" role="dialog" aria-modal="true" aria-label="Filter community feed" onClick={(event) => event.stopPropagation()}>
        <header>
          <div><span>Community feed</span><strong>Filter and order</strong></div>
          <button type="button" title="Close filters" onClick={onClose}><X size={18} /></button>
        </header>

        <fieldset>
          <legend><SlidersHorizontal size={15} /> Show</legend>
          <div className="community-filter-choice-grid">
            {contentOptions.map((option) => (
              <button key={option.value} type="button" className={value.content === option.value ? "active" : ""} onClick={() => onChange({ ...value, content: option.value })}>
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Order</legend>
          <div className="community-filter-order-grid">
            <button type="button" className={value.sort === "recent" ? "active" : ""} onClick={() => setSort("recent")}><Clock3 size={16} /><span><strong>Most recent</strong><small>Newest work first</small></span></button>
            <button type="button" className={value.sort === "popular" ? "active" : ""} onClick={() => setSort("popular")}><TrendingUp size={16} /><span><strong>Most popular</strong><small>Strongest engagement</small></span></button>
            <button type="button" className={value.sort === "hot" ? "active" : ""} onClick={() => setSort("hot")}><Flame size={16} /><span><strong>Hot right now</strong><small>Momentum weighted by recency</small></span></button>
          </div>
        </fieldset>

        {value.sort === "popular" ? (
          <fieldset>
            <legend>Popularity window</legend>
            <div className="community-filter-window-grid">
              {windowOptions.map((option) => (
                <button key={option.value} type="button" className={value.popularityWindow === option.value ? "active" : ""} onClick={() => onChange({ ...value, popularityWindow: option.value })}>
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <footer>
          <button type="button" onClick={() => onChange({ content: "all", sort: "recent", popularityWindow: "month" })}>Reset</button>
          <button type="button" className="primary" onClick={onClose}>Show results</button>
        </footer>
      </section>
    </div>
  );
}
