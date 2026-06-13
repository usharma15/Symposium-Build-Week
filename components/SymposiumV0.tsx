"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  LibraryBig,
  MessageSquareQuote,
  Moon,
  NotebookPen,
  PanelRightOpen,
  Search,
  Send,
  Sparkles,
  Sun,
  UserRound,
  X
} from "lucide-react";
import {
  feedScopes,
  inquiryItems,
  libraryFolders,
  profile,
  roomChips,
  rooms,
  type FeedScope,
  type InquiryItem,
  type Room,
  type RoomId
} from "@/lib/mockData";

type Theme = "day" | "night";

const kindLabels: Record<InquiryItem["kind"], string> = {
  paper: "Paper",
  thought: "Thought",
  draft: "Draft",
  note: "Note",
  code: "Code"
};

const getRoom = (roomId: RoomId) => rooms.find((room) => room.id === roomId) ?? rooms[0];

export function SymposiumV0() {
  const [theme, setTheme] = useState<Theme>("day");
  const [activeRoom, setActiveRoom] = useState<RoomId>("arrival");
  const [feedScope, setFeedScope] = useState<FeedScope>("suggested");
  const [roomChip, setRoomChip] = useState(roomChips[0]);
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [tabletOpen, setTabletOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [noteText, setNoteText] = useState(
    "First note: make the thing feel alive without pretending the whole world is built yet."
  );

  const activeRoomData = getRoom(activeRoom);
  const selectedItem = inquiryItems.find((item) => item.id === selectedItemId) ?? null;

  const visibleItems = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return inquiryItems
      .filter((item) => {
        if (activeRoom === "arrival") return true;
        if (activeRoom === "office") return item.saved || item.room === "office";
        if (activeRoom === "symposium") return item.kind === "paper" || item.kind === "thought";
        if (activeRoom === "library") return item.kind === "paper";
        if (activeRoom === "amphitheater") return item.kind === "thought" || item.kind === "note";
        return true;
      })
      .filter((item) => {
        if (!lowered) return true;
        return [item.title, item.author, item.status, item.excerpt, ...item.tags]
          .join(" ")
          .toLowerCase()
          .includes(lowered);
      });
  }, [activeRoom, query]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("symposium-theme") as Theme | null;
    const storedNote = window.localStorage.getItem("symposium-notebook");
    if (storedTheme === "day" || storedTheme === "night") setTheme(storedTheme);
    if (storedNote) setNoteText(storedNote);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("symposium-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("symposium-notebook", noteText);
  }, [noteText]);

  const enterRoom = (roomId: RoomId) => {
    setActiveRoom(roomId);
    setSelectedItemId(null);
    setQuery("");
  };

  const currentContext = selectedItem
    ? `${selectedItem.title}: ${selectedItem.gatheringReason}`
    : `${activeRoomData.name}: ${activeRoomData.description}`;

  return (
    <main className={`symposium-shell ${theme}`} data-room={activeRoom}>
      <div className="ambient-layer" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" type="button" onClick={() => enterRoom("arrival")}>
          <span className="brand-glyph">S</span>
          <span>
            <strong>SYMPOSIUM</strong>
            <small>{activeRoomData.location}</small>
          </span>
        </button>

        <nav className="topbar-actions" aria-label="Primary controls">
          <button
            className="icon-button"
            type="button"
            title={theme === "day" ? "Enter night mode" : "Enter day mode"}
            onClick={() => setTheme((value) => (value === "day" ? "night" : "day"))}
          >
            {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            className="icon-button"
            type="button"
            title="Open notebook"
            onClick={() => setNotebookOpen(true)}
          >
            <NotebookPen size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Open AI tablet"
            onClick={() => setTabletOpen(true)}
          >
            <BrainCircuit size={18} />
          </button>
          <button
            className="profile-button"
            type="button"
            title="Profile"
            onClick={() => setProfileOpen((open) => !open)}
          >
            <UserRound size={18} />
            <span>{profile.name}</span>
          </button>
        </nav>
      </header>

      {profileOpen ? <ProfilePanel onClose={() => setProfileOpen(false)} /> : null}

      <aside className="world-rail" aria-label="Rooms">
        {rooms.map((room) => {
          const Icon = room.icon;
          return (
            <button
              key={room.id}
              className={`rail-button ${activeRoom === room.id ? "active" : ""}`}
              type="button"
              onClick={() => enterRoom(room.id)}
              title={room.name}
            >
              <Icon size={18} />
              <span>{room.shortName}</span>
            </button>
          );
        })}
      </aside>

      <section className="stage">
        {activeRoom === "arrival" ? (
          <ArrivalView onEnter={enterRoom} />
        ) : selectedItem ? (
          <DetailView
            item={selectedItem}
            room={activeRoomData}
            onBack={() => setSelectedItemId(null)}
            onOpenTablet={() => setTabletOpen(true)}
            onOpenNotebook={() => setNotebookOpen(true)}
          />
        ) : (
          <RoomView
            room={activeRoomData}
            items={visibleItems}
            feedScope={feedScope}
            roomChip={roomChip}
            query={query}
            onFeedScope={setFeedScope}
            onRoomChip={setRoomChip}
            onQuery={setQuery}
            onSelect={setSelectedItemId}
          />
        )}
      </section>

      <button
        className="pocket pocket-left"
        type="button"
        title="Notebook"
        onClick={() => setNotebookOpen(true)}
      >
        <NotebookPen size={18} />
        <span>Notebook</span>
      </button>

      <button
        className="pocket pocket-right"
        type="button"
        title="AI tablet"
        onClick={() => setTabletOpen(true)}
      >
        <BrainCircuit size={18} />
        <span>AI Tablet</span>
      </button>

      <MovementPad room={activeRoomData} />

      {notebookOpen ? (
        <NotebookPanel
          noteText={noteText}
          setNoteText={setNoteText}
          context={selectedItem?.title ?? activeRoomData.name}
          onClose={() => setNotebookOpen(false)}
        />
      ) : null}

      {tabletOpen ? (
        <TabletPanel
          context={currentContext}
          selectedItem={selectedItem}
          room={activeRoomData}
          onClose={() => setTabletOpen(false)}
        />
      ) : null}
    </main>
  );
}

function ArrivalView({ onEnter }: { onEnter: (roomId: RoomId) => void }) {
  return (
    <div className="arrival-grid">
      <section className="arrival-hero">
        <Image
          src="/symposium-arrival.jpg"
          alt="Greco-futurist Symposium building above the Aegean sea"
          fill
          priority
          sizes="100vw"
          className="arrival-image"
        />
        <div className="arrival-shade" />
        <div className="arrival-copy">
          <p className="eyebrow">Aegean approach</p>
          <h1>SYMPOSIUM</h1>
          <p>
            The first public hall: papers, thoughts, objections, saved work,
            notebooks, and AI-assisted inquiry inside one early world.
          </p>
          <div className="arrival-actions">
            <button className="primary-button" type="button" onClick={() => onEnter("symposium")}>
              <MessagesIcon />
              Enter the hall
            </button>
            <button className="secondary-button" type="button" onClick={() => onEnter("library")}>
              <LibraryBig size={18} />
              Go to library
            </button>
          </div>
        </div>
      </section>

      <section className="room-map" aria-label="Room map">
        {rooms
          .filter((room) => room.id !== "arrival")
          .map((room) => {
            const Icon = room.icon;
            return (
              <button className="room-door" key={room.id} type="button" onClick={() => onEnter(room.id)}>
                <span className="door-icon">
                  <Icon size={20} />
                </span>
                <span>
                  <small>{room.eyebrow}</small>
                  <strong>{room.name}</strong>
                  <em>{room.feedLabel}</em>
                </span>
                <ChevronRight size={18} />
              </button>
            );
          })}
      </section>
    </div>
  );
}

function RoomView({
  room,
  items,
  feedScope,
  roomChip,
  query,
  onFeedScope,
  onRoomChip,
  onQuery,
  onSelect
}: {
  room: Room;
  items: InquiryItem[];
  feedScope: FeedScope;
  roomChip: string;
  query: string;
  onFeedScope: (scope: FeedScope) => void;
  onRoomChip: (chip: string) => void;
  onQuery: (query: string) => void;
  onSelect: (id: string) => void;
}) {
  const RoomIcon = room.icon;

  return (
    <div className="room-layout">
      <section className="room-header">
        <div>
          <p className="eyebrow">{room.eyebrow}</p>
          <h1>{room.title}</h1>
          <p>{room.description}</p>
        </div>
        <div className="room-seal">
          <RoomIcon size={28} />
          <span>{room.feedLabel}</span>
        </div>
      </section>

      <section className="feed-toolbar" aria-label="Feed controls">
        <div className="segmented">
          {feedScopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              className={feedScope === scope.id ? "active" : ""}
              onClick={() => onFeedScope(scope.id)}
            >
              {scope.label}
            </button>
          ))}
        </div>

        <label className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search claims, papers, rooms"
          />
        </label>
      </section>

      {feedScope === "rooms" ? (
        <section className="chip-row" aria-label="Rooms">
          {roomChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={roomChip === chip ? "active" : ""}
              onClick={() => onRoomChip(chip)}
            >
              {chip}
            </button>
          ))}
        </section>
      ) : null}

      {room.id === "office" ? <OfficeFolders /> : null}

      <section className="feed-grid">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </section>
    </div>
  );
}

function OfficeFolders() {
  return (
    <section className="folder-row" aria-label="Saved folders">
      {libraryFolders.map((folder) => {
        const Icon = folder.icon;
        return (
          <button className="folder-tile" key={folder.label} type="button">
            <Icon size={19} />
            <strong>{folder.label}</strong>
            <span>{folder.count} artifacts</span>
          </button>
        );
      })}
    </section>
  );
}

function FeedCard({ item, onSelect }: { item: InquiryItem; onSelect: (id: string) => void }) {
  return (
    <article className="feed-card" data-testid={`feed-card-${item.id}`}>
      <div className="card-topline">
        <span>{kindLabels[item.kind]}</span>
        <span>{item.status}</span>
      </div>
      <h2>{item.title}</h2>
      <p>{item.excerpt}</p>
      <div className="tag-row">
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-footer">
        <span>
          {item.author} · {item.date}
        </span>
        <button type="button" data-testid={`open-${item.id}`} onClick={() => onSelect(item.id)}>
          Open
          <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}

function DetailView({
  item,
  room,
  onBack,
  onOpenTablet,
  onOpenNotebook
}: {
  item: InquiryItem;
  room: Room;
  onBack: () => void;
  onOpenTablet: () => void;
  onOpenNotebook: () => void;
}) {
  return (
    <article className="detail-layout">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to {room.feedLabel}
      </button>

      <section className="detail-main">
        <p className="eyebrow">
          {kindLabels[item.kind]} · {item.status}
        </p>
        <h1>{item.title}</h1>
        <p className="detail-byline">
          {item.author} · {item.affiliation} · {item.date}
        </p>
        <p className="gathering-reason">{item.gatheringReason}</p>
        <p className="detail-body">{item.body}</p>

        <DetailSection title="Claims" items={item.claims} />
        <DetailSection title="Objections" items={item.objections} />
        <DetailSection title="Evidence" items={item.evidence} />
        <DetailSection title="Tests" items={item.tests} />
        <DetailSection title="Forks" items={item.forks} />

        <section className="comments-section">
          <h2>Discussion</h2>
          {item.comments.map((comment) => (
            <div className="comment" key={`${comment.author}-${comment.stance}`}>
              <strong>{comment.author}</strong>
              <span>{comment.stance}</span>
              <p>{comment.body}</p>
            </div>
          ))}
        </section>
      </section>

      <aside className="detail-side">
        <section className="signal-panel">
          <h2>Signal Panel</h2>
          {item.signals.map((signal) => (
            <div key={signal.label}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
            </div>
          ))}
        </section>

        <section className="side-actions">
          <button type="button" onClick={onOpenNotebook}>
            <NotebookPen size={17} />
            Add to notebook
          </button>
          <button type="button" onClick={onOpenTablet}>
            <BrainCircuit size={17} />
            Ask tablet
          </button>
        </section>
      </aside>
    </article>
  );
}

function DetailSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function NotebookPanel({
  noteText,
  setNoteText,
  context,
  onClose
}: {
  noteText: string;
  setNoteText: (text: string) => void;
  context: string;
  onClose: () => void;
}) {
  return (
    <aside className="side-panel notebook-panel">
      <PanelHeader icon={<NotebookPen size={18} />} title="Notebook" onClose={onClose} />
      <p className="panel-context">{context}</p>
      <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} />
      <div className="note-stack">
        <span>Draft paper margin</span>
        <span>Objection smell test</span>
        <span>Saved replication idea</span>
      </div>
    </aside>
  );
}

function TabletPanel({
  context,
  selectedItem,
  room,
  onClose
}: {
  context: string;
  selectedItem: InquiryItem | null;
  room: Room;
  onClose: () => void;
}) {
  const prompts = selectedItem
    ? [
        "Find the strongest unresolved objection.",
        "Suggest the next test.",
        "Map the forks worth opening."
      ]
    : [
        `Summarize the live work in ${room.name}.`,
        "What should be saved for later?",
        "Which claim needs critique first?"
      ];

  return (
    <aside className="side-panel tablet-panel">
      <PanelHeader icon={<BrainCircuit size={18} />} title="AI Tablet" onClose={onClose} />
      <p className="panel-context">{context}</p>
      <section className="tablet-lens">
        <span>Context lens</span>
        <strong>{selectedItem ? selectedItem.status : room.feedLabel}</strong>
      </section>
      <div className="prompt-stack">
        {prompts.map((prompt) => (
          <button type="button" key={prompt}>
            <Sparkles size={15} />
            {prompt}
          </button>
        ))}
      </div>
      <form className="tablet-input">
        <input placeholder="Ask from the current room" />
        <button type="button" title="Send">
          <Send size={17} />
        </button>
      </form>
    </aside>
  );
}

function PanelHeader({
  icon,
  title,
  onClose
}: {
  icon: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <header className="panel-header">
      <span>
        {icon}
        {title}
      </span>
      <button type="button" title="Close" onClick={onClose}>
        <X size={17} />
      </button>
    </header>
  );
}

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const Icon = profile.icon;
  return (
    <aside className="profile-panel">
      <PanelHeader icon={<Icon size={18} />} title="Profile" onClose={onClose} />
      <h2>{profile.name}</h2>
      <p>
        {profile.role} · {profile.location}
      </p>
      <div className="profile-fields">
        {profile.fields.map((field) => (
          <span key={field}>{field}</span>
        ))}
      </div>
      <div className="profile-proof">
        {profile.proof.map((proof) => (
          <strong key={proof}>{proof}</strong>
        ))}
      </div>
    </aside>
  );
}

function MovementPad({ room }: { room: Room }) {
  return (
    <aside className="movement-pad" aria-label="Movement concept">
      <span className="movement-ring">
        <span />
      </span>
      <strong>{room.name}</strong>
      <small>{room.ambient}</small>
    </aside>
  );
}

function MessagesIcon() {
  return <MessageSquareQuote size={18} />;
}
