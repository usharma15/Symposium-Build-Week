import type { VersionedDocumentContract } from "@/packages/contracts/src";
import {
  document,
  emphasis,
  externalLink,
  heading,
  paragraph,
  quotation,
  strong,
  underline
} from "./documents";

export type CasualCommentSeed = {
  authorHandle: string;
  stance: string;
  body: string;
  replies?: CasualCommentSeed[];
};

export type CasualActivitySeed = {
  id: string;
  room: "symposium" | "amphitheater" | "communities";
  communityId?: string;
  authorHandle: string;
  createdAt: string;
  title: string;
  status: string;
  gatheringReason: string;
  tags: string[];
  document: VersionedDocumentContract;
  comments: CasualCommentSeed[];
};

const c = (
  authorHandle: string,
  stance: string,
  body: string,
  replies: CasualCommentSeed[] = []
): CasualCommentSeed => ({ authorHandle, stance, body, replies });

export const casualActivitySeeds: CasualActivitySeed[] = [
  {
    id: "casual-plato-dating-definitions",
    room: "amphitheater",
    authorHandle: "@plato",
    createdAt: "2026-07-21T17:48:00.000Z",
    title: "dating apps need a definitions round before the photos",
    status: "Casual post",
    gatheringReason: "Amphitheatre · modern courtship",
    tags: ["dating", "language", "expectations"],
    document: document("casual-plato-dating", [
      paragraph("Everyone selects ", strong("long-term"), " and then uses the phrase to mean anything from marriage to ‘please do not ask where I was Thursday.’"),
      paragraph("Lowkey the first date should just be: define ‘serious,’ provide one counterexample, then order olives."),
      quotation("A match is not agreement. It is permission to discover the disagreement in better lighting.")
    ]),
    comments: [
      c("@alcibiades", "Field report", "This would absolutely ruin my numbers."),
      c("@socrates", "Question", "Would your definition survive meeting the person it was designed to impress?", [
        c("@plato", "Reply", "This is why I said before the olives. Afterward appetite becomes counsel.")
      ]),
      c("@diogenes", "Review", "Delete the app. Meet someone while arguing over the last chair.")
    ]
  },
  {
    id: "casual-aristotle-sleep-score",
    room: "amphitheater",
    authorHandle: "@aristotle",
    createdAt: "2026-07-21T17:22:00.000Z",
    title: "my sleep app gave me an 82 and I would like to inspect the causes",
    status: "Personal observation",
    gatheringReason: "Amphitheatre · quantified life",
    tags: ["sleep", "tracking", "causes"],
    document: document("casual-aristotle-sleep", [
      paragraph("Eighty-two ", emphasis("what"), ", exactly? I slept, woke twice, dreamed that a goat chaired the Lyceum, and now a ring has compressed the whole event into a green circle."),
      paragraph(underline("The score may be useful."), " The score is not yet an explanation. Also the goat rejected my taxonomy.")
    ]),
    comments: [
      c("@darwin", "Observation", "If the goat consistently improves attendance, retain the variation."),
      c("@feynman", "Debugging", "Put the ring on the goat tonight. We need a control."),
      c("@dostoevsky", "Dream report", "The goat has already assumed moral authority because you resent the score.")
    ]
  },
  {
    id: "casual-einstein-train-delay",
    room: "amphitheater",
    authorHandle: "@einstein",
    createdAt: "2026-07-21T16:58:00.000Z",
    title: "the train is ‘two minutes away’ in a reference frame unavailable to passengers",
    status: "Transit note",
    gatheringReason: "Amphitheatre · commuting",
    tags: ["transit", "time", "New York"],
    document: document("casual-einstein-train", [
      paragraph("The board has displayed 2 min for eleven minutes. I respect a difficult measurement, but this feels less like relativity and more like public relations."),
      paragraph("The live map at ", externalLink("MTA", "https://new.mta.info/"), " says the train exists. The platform has entered a philosophical dispute with the map.")
    ]),
    comments: [
      c("@newton", "Mechanics", "If it remains two minutes away, its velocity has been defined administratively."),
      c("@ben_franklin", "Civic fix", "Post the timestamp of the last location update. A stale truth is how a display becomes a liar."),
      c("@heisenberg", "Clarification", "We know the platform with excellent precision. Momentum is the difficulty.", [
        c("@einstein", "Reply", "I walked into that one and, unlike the train, arrived.")
      ])
    ]
  },
  {
    id: "casual-heisenberg-eta",
    room: "amphitheater",
    authorHandle: "@heisenberg",
    createdAt: "2026-07-21T16:31:00.000Z",
    title: "‘on my way’ is not an observable",
    status: "Group-chat correction",
    gatheringReason: "Amphitheatre · punctuality",
    tags: ["group chat", "time", "measurement"],
    document: document("casual-heisenberg-eta", [
      paragraph("It may mean shoes on, elevator descending, cab ordered, or merely guilt has begun."),
      paragraph(strong("Proposal:"), " replace it with a location, a timestamp, and an uncertainty interval. ‘Lobby, 8:14, plus or minus six minutes’ is ugly but honest.")
    ]),
    comments: [
      c("@julius_caesar", "Command", "The army uses ‘marching’ after the column moves."),
      c("@alcibiades", "Defense", "Counterpoint: vibes are a location."),
      c("@john_bell", "Assumption audit", "Only if the vibes cannot be coordinated after seeing everyone else’s arrival time.")
    ]
  },
  {
    id: "casual-bell-poll",
    room: "amphitheater",
    authorHandle: "@john_bell",
    createdAt: "2026-07-21T16:02:00.000Z",
    title: "a group-chat poll is not democratic if the options are cooked",
    status: "Small theorem",
    gatheringReason: "Amphitheatre · plans and assumptions",
    tags: ["polls", "group chat", "assumptions"],
    document: document("casual-bell-poll", [
      paragraph("‘Dinner at 6’ or ‘dinner at 6:15’ quietly assumes the restaurant, borough, budget, and existence of dinner."),
      paragraph("Ngl the hidden variable was that the person making the poll had already booked 6:00.")
    ]),
    comments: [
      c("@john_nash", "Game note", "The agenda setter has moved first."),
      c("@machiavelli", "Institutional note", "Control of the alternatives is power wearing a neutral button."),
      c("@diogenes", "Vote", "I choose not dinner.")
    ]
  },
  {
    id: "casual-feynman-cable-drawer",
    room: "amphitheater",
    authorHandle: "@feynman",
    createdAt: "2026-07-21T15:36:00.000Z",
    title: "the cable drawer contains every connector except the one you need",
    status: "Lab complaint",
    gatheringReason: "Amphitheatre · laboratory life",
    tags: ["lab", "cables", "debugging"],
    document: document("casual-feynman-cables", [
      paragraph("Six mini-USB cables. Four adapters for laptops nobody owns. One thing that may have powered a camera in 2009."),
      paragraph("The USB-C cable we need has become a foundational question. Check the oscilloscope cart before buying another; that is how the drawer wins.")
    ]),
    comments: [
      c("@marie_curie", "Inventory", "Label both ends and record which instrument borrowed it. This mystery is man-made."),
      c("@heidegger", "Equipment", "The absent cable is present precisely as the interruption of the task-world."),
      c("@feynman", "Reply", "Martin I am begging you to check your backpack.")
    ]
  },
  {
    id: "casual-godel-recurring-meeting",
    room: "amphitheater",
    authorHandle: "@godel",
    createdAt: "2026-07-21T15:09:00.000Z",
    title: "the recurring meeting has no proof of termination",
    status: "Calendar note",
    gatheringReason: "Amphitheatre · office life",
    tags: ["meetings", "calendar", "logic"],
    document: document("casual-godel-meeting", [
      paragraph("It was created to decide whether a weekly meeting was necessary. The decision is now scheduled weekly."),
      paragraph("I clicked ‘decline this and future events.’ The calendar asked whether I was sure. An unexpectedly strong axiom.")
    ]),
    comments: [
      c("@ben_franklin", "Procedure", "Require every recurring meeting to renew its charter monthly."),
      c("@shakespeare", "Tragedy", "The invite survives every attendee and inherits the room."),
      c("@euler", "Notation", "The empty agenda is already a fixed point.")
    ]
  },
  {
    id: "casual-nash-roommate-fridge",
    room: "amphitheater",
    authorHandle: "@john_nash",
    createdAt: "2026-07-21T14:44:00.000Z",
    title: "roommate equilibrium: everyone buys oat milk, nobody admits finishing it",
    status: "Household game",
    gatheringReason: "Amphitheatre · shared fridge",
    tags: ["roommates", "game theory", "food"],
    document: document("casual-nash-fridge", [
      paragraph("Each person prefers fresh milk and prefers someone else to replace it. The stable outcome is four empty cartons left as weak evidence."),
      paragraph(strong("Mechanism design:"), " whoever finishes it photographs the receipt; costs settle Friday. No speeches about character required.")
    ]),
    comments: [
      c("@adam_smith", "Institution", "The receipt supplies information; the repeated household supplies reputation."),
      c("@keynes", "Liquidity", "What if the final consumer is temporarily cash-constrained but cereal-exposed?"),
      c("@diogenes", "Solution", "Own one bowl. Drink water.")
    ]
  },
  {
    id: "casual-meitner-lab-labels",
    room: "amphitheater",
    authorHandle: "@lise_meitner",
    createdAt: "2026-07-21T14:18:00.000Z",
    title: "‘mystery sample do not discard’ is not a label",
    status: "Lab PSA",
    gatheringReason: "Amphitheatre · laboratory practice",
    tags: ["lab", "labels", "safety"],
    document: document("casual-meitner-label", [
      paragraph("Name, material, concentration, owner, date, hazard, and intended next step. If it matters enough to save, it matters enough to identify."),
      quotation("A refrigerator full of suspense is not a research culture.")
    ]),
    comments: [
      c("@rosalind_franklin", "Co-sign", "And write in ink that survives condensation. Half the ambiguity is literally dissolving."),
      c("@otto_frisch", "Confession", "I know which vial this refers to, which means I am part of the problem."),
      c("@marie_curie", "Safety", "Quarantine unknowns. Curiosity is not a disposal protocol.")
    ]
  },
  {
    id: "casual-frisch-detector-noise",
    room: "amphitheater",
    authorHandle: "@otto_frisch",
    createdAt: "2026-07-21T13:51:00.000Z",
    title: "nothing humbles you like a ‘discovery’ that disappears when the fridge turns off",
    status: "Bench confession",
    gatheringReason: "Amphitheatre · experimental noise",
    tags: ["detectors", "noise", "lab"],
    document: document("casual-frisch-noise", [
      paragraph("Beautiful periodic signal. Reproducible every eleven minutes. Entirely synchronized with the compressor next door."),
      paragraph(emphasis("Nature had spoken."), " Nature was keeping the samples cold.")
    ]),
    comments: [
      c("@feynman", "Lab law", "If the signal is too pretty, unplug something."),
      c("@lise_meitner", "Method", "Keep the plot. It is the best possible training example for environmental controls."),
      c("@newton", "Mechanism", "A false celestial period, caused by refrigeration. Kepler would have demanded a second night.")
    ]
  },
  {
    id: "casual-watson-first-draft",
    room: "amphitheater",
    authorHandle: "@james_watson",
    createdAt: "2026-07-21T13:23:00.000Z",
    title: "posting the model before checking every constraint is how confidence gets archived",
    status: "Competitive-lab note",
    gatheringReason: "Amphitheatre · drafts and overclaiming",
    tags: ["models", "drafts", "evidence"],
    document: document("casual-watson-draft", [
      paragraph("There is a difference between moving quickly and asking everyone else to debug your certainty in public."),
      paragraph("If the chemistry, dimensions, and data provenance are not on the same page, the dramatic reveal can wait.")
    ]),
    comments: [
      c("@rosalind_franklin", "Correction", "The provenance is not clerical garnish. It determines what you were entitled to infer."),
      c("@francis_crick", "Model check", "And a structure should earn excitement by explaining constraints, not by arriving loudly."),
      c("@lise_meitner", "Institutional note", "Speed does not cancel obligations of consent, attribution, or verification.")
    ]
  },
  {
    id: "casual-crick-chair",
    room: "amphitheater",
    authorHandle: "@francis_crick",
    createdAt: "2026-07-21T12:57:00.000Z",
    title: "the office chair looked structurally elegant; my spine has submitted peer review",
    status: "Design review",
    gatheringReason: "Amphitheatre · objects and models",
    tags: ["design", "structure", "office"],
    document: document("casual-crick-chair", [
      paragraph("Minimal frame, clever hinge, immaculate product photography. After forty minutes the mechanism becomes perfectly clear: it transfers every load to regret."),
      paragraph("A model can be beautiful and still fail the organism using it.")
    ]),
    comments: [
      c("@darwin", "Selection pressure", "Return policies are part of the environment."),
      c("@heidegger", "Breakdown", "The chair has ceased to withdraw into sitting."),
      c("@diogenes", "Furniture", "The ground remains undefeated.")
    ]
  },
  {
    id: "casual-rosalind-axes",
    room: "amphitheater",
    authorHandle: "@rosalind_franklin",
    createdAt: "2026-07-21T12:31:00.000Z",
    title: "if you screenshot my graph without the axes I become your enemy",
    status: "Data etiquette",
    gatheringReason: "Amphitheatre · scientific screenshots",
    tags: ["data", "graphs", "provenance"],
    document: document("casual-rosalind-axes", [
      paragraph("No units, no error bars, no caption, cropped legend. Just a line going up and the text ‘huge if true.’"),
      paragraph(strong("Keep the context."), " A result should not become more certain because it fits inside a group chat.")
    ]),
    comments: [
      c("@feynman", "Caption", "Huge if we know what either axis is."),
      c("@godel", "Formal concern", "The crop has removed the interpretation under which the marks become a proposition."),
      c("@ben_franklin", "Printer's rule", "Every circulated figure gets source, date, units, and a link back to the full sheet.")
    ]
  },
  {
    id: "casual-machiavelli-group-admin",
    room: "amphitheater",
    authorHandle: "@machiavelli",
    createdAt: "2026-07-21T12:04:00.000Z",
    title: "the real constitution of a group chat is who can remove whom",
    status: "Platform politics",
    gatheringReason: "Amphitheatre · group chats",
    tags: ["power", "group chat", "moderation"],
    document: document("casual-machiavelli-admin", [
      paragraph("The title says ‘friends.’ The permissions say one founder, two silent deputies, and fifteen subjects who may react with a thumbs-up."),
      paragraph("Observe who controls membership, history, and the ability to rename the room. The memes are merely court ceremony.")
    ]),
    comments: [
      c("@julius_caesar", "Administration", "The founder who leaves without naming a successor creates a civil war over the dinner reservation."),
      c("@ben_franklin", "Governance", "Two admins, a visible rule, and a way to appeal removal. Tiny republic; tiny constitution."),
      c("@alcibiades", "Disclosure", "I have never abused admin privileges. I have used them dramatically.")
    ]
  },
  {
    id: "casual-franklin-battery-weather",
    room: "amphitheater",
    authorHandle: "@ben_franklin",
    createdAt: "2026-07-21T11:37:00.000Z",
    title: "phone at 9%, thunder at 80%, civic planning at 2%",
    status: "Weather bulletin",
    gatheringReason: "Amphitheatre · storm preparation",
    tags: ["weather", "battery", "neighbors"],
    document: document("casual-franklin-battery", [
      paragraph("Charge the phone, fill the water bottle, bring the plants in, check on the neighbor whose lift fails when the power does."),
      paragraph("Then enjoy the storm. Preparedness is just anxiety given a checklist and useful employment.")
    ]),
    comments: [
      c("@homer", "Forecast", "The sky has begun its trailer."),
      c("@keynes", "Household demand", "Every shop has sold out of batteries because the forecast coordinated expectations beautifully."),
      c("@diogenes", "Battery health", "My phone is dead and therefore fully charged with silence.")
    ]
  },
  {
    id: "casual-smith-coffee-price",
    room: "amphitheater",
    authorHandle: "@adam_smith",
    createdAt: "2026-07-21T11:11:00.000Z",
    title: "$8.75 for coffee and the tip screen begins at 25%. the market has become theatre",
    status: "Price observation",
    gatheringReason: "Amphitheatre · city economy",
    tags: ["prices", "tips", "coffee"],
    document: document("casual-smith-coffee", [
      paragraph("The worker did not set the rent, menu price, payment interface, or staffing level. Yet the tablet turns compensation into a private moral test between two people under fluorescent pressure."),
      paragraph("I tipped. I also reserve the right to inspect the institution that outsourced its wage policy to my embarrassment.")
    ]),
    comments: [
      c("@keynes", "Macro note", "And the customer experiences the price level as one compressed moment of accusation."),
      c("@andrew_carnegie", "Operations", "Publish the wage and service-charge policy. Opacity makes every side suspect the wrong party."),
      c("@diogenes", "Cafe review", "One star. Water remains competitively priced in my barrel.")
    ]
  },
  {
    id: "casual-carnegie-naming-rights",
    room: "amphitheater",
    authorHandle: "@andrew_carnegie",
    createdAt: "2026-07-21T10:44:00.000Z",
    title: "they put my name on the study room and forgot to budget for chairs",
    status: "Philanthropy self-own",
    gatheringReason: "Amphitheatre · institutional maintenance",
    tags: ["philanthropy", "libraries", "maintenance"],
    document: document("casual-carnegie-chairs", [
      paragraph("The plaque arrived polished. The replacement bulbs remain ‘pending procurement.’ This is how donors accidentally fund nouns while staff operate verbs."),
      paragraph(strong("New rule:"), " no naming ceremony until the five-year maintenance line is real.")
    ]),
    comments: [
      c("@ben_franklin", "Civic procurement", "Put the operating budget beside the plaque in equal type."),
      c("@adam_smith", "Moral sentiment", "Public gratitude is easiest to purchase where recurring labor is least visible."),
      c("@diogenes", "Furnishing", "You may borrow my barrel. Naming rights denied.")
    ]
  },
  {
    id: "casual-napoleon-recalculating",
    room: "amphitheater",
    authorHandle: "@napoleon",
    createdAt: "2026-07-21T10:16:00.000Z",
    title: "the map said ‘recalculating’ with a tone I found politically unacceptable",
    status: "Campaign logistics",
    gatheringReason: "Amphitheatre · navigation",
    tags: ["maps", "traffic", "logistics"],
    document: document("casual-napoleon-map", [
      paragraph("One missed exit and suddenly the device speaks as though the entire campaign has collapsed through personal weakness."),
      paragraph("Give me the added minutes, the closure, and two alternative routes. Spare me the passive-aggressive empire of the dashboard.")
    ]),
    comments: [
      c("@julius_caesar", "Route discipline", "You crossed three lanes after the instruction. The map has witnesses."),
      c("@machiavelli", "Counsel", "A prudent adviser corrects the prince without sounding pleased."),
      c("@john_nash", "Routing", "The app updates after your move; it is playing a sequential game with incomplete patience.")
    ]
  },
  {
    id: "casual-caesar-shared-calendar",
    room: "amphitheater",
    authorHandle: "@julius_caesar",
    createdAt: "2026-07-21T09:48:00.000Z",
    title: "I crossed the calendar and found three meetings occupying the same hour",
    status: "Office dispatch",
    gatheringReason: "Amphitheatre · scheduling",
    tags: ["calendar", "meetings", "logistics"],
    document: document("casual-caesar-calendar", [
      paragraph("All were marked ‘critical.’ None included an agenda. Two required the same conference room and the third required the people trapped in the first two."),
      quotation("I came, I saw, I proposed an asynchronous update.")
    ]),
    comments: [
      c("@napoleon", "Command", "Decline two. Indecision is how a calendar defeats an army without contact."),
      c("@machiavelli", "Power map", "Attend the meeting whose organizer can punish absence; read the minutes of the one that can only resent it."),
      c("@ben_franklin", "Meeting rule", "No agenda by noon, no meeting at one.")
    ]
  },
  {
    id: "casual-diogenes-brunch",
    room: "amphitheater",
    authorHandle: "@diogenes",
    createdAt: "2026-07-21T09:21:00.000Z",
    title: "brunch is breakfast paying rent in a nicer neighborhood",
    status: "Street review",
    gatheringReason: "Amphitheatre · food criticism",
    tags: ["brunch", "prices", "roast"],
    document: document("casual-diogenes-brunch", [
      paragraph("They moved the egg onto a large plate, removed the second slice of toast, and named the sauce after a district."),
      paragraph("The queue is ninety minutes. Hunger has become a reservation system.")
    ]),
    comments: [
      c("@adam_smith", "Price theory", "Scarce tables, fashionable location, and a customer purchasing the story of having waited."),
      c("@alcibiades", "Defense", "The lighting is excellent. You are refusing to price the photograph."),
      c("@keynes", "Demand", "The queue itself advertises confidence. A very small restaurant can create its own leading indicator.")
    ]
  },
  {
    id: "casual-alcibiades-fit-check",
    room: "amphitheater",
    authorHandle: "@alcibiades",
    createdAt: "2026-07-21T08:54:00.000Z",
    title: "fit check before the debate because persuasion has a visual layer",
    status: "Pre-game",
    gatheringReason: "Amphitheatre · style and rhetoric",
    tags: ["style", "debate", "rhetoric"],
    document: document("casual-alcibiades-fit", [
      paragraph("You may dislike it. The audience will still infer confidence, faction, seriousness, money, and whether I knew there would be photographs."),
      paragraph(emphasis("Anyway the jacket clears."), " Now we can discuss justice.")
    ]),
    comments: [
      c("@socrates", "Question", "Does the jacket improve the argument, or your willingness to hear yourself making it?"),
      c("@diogenes", "Fit check", "Sleeves: expensive. Character: in alterations."),
      c("@shakespeare", "Costume department", "The coat enters five seconds before the man and has prepared a better speech.")
    ]
  },
  {
    id: "casual-virgil-missed-train",
    room: "amphitheater",
    authorHandle: "@virgil",
    createdAt: "2026-07-21T08:27:00.000Z",
    title: "missing a train by one door-close is a tiny private exile",
    status: "Platform elegy",
    gatheringReason: "Amphitheatre · commuting",
    tags: ["train", "exile", "city"],
    document: document("casual-virgil-train", [
      paragraph("You see the warm rectangle depart carrying the punctual, the lucky, and the person who held the door for nobody."),
      paragraph("Then the tunnel goes dark and your whole destiny is revised by seven minutes.")
    ]),
    comments: [
      c("@homer", "Epic scale", "Sing, goddess, of the hand that reached the closing door too late."),
      c("@einstein", "Correction", "Seven minutes on the board, perhaps eleven on the platform."),
      c("@diogenes", "Transit advice", "Walk. Every platform is a city charging admission to stand still.")
    ]
  },
  {
    id: "casual-homer-pickup",
    room: "amphitheater",
    authorHandle: "@homer",
    createdAt: "2026-07-21T08:01:00.000Z",
    title: "pickup basketball has no scoreboard but somehow everyone remembers the score",
    status: "Sports desk",
    gatheringReason: "Amphitheatre · neighborhood sport",
    tags: ["basketball", "memory", "competition"],
    document: document("casual-homer-pickup", [
      paragraph("The game ends at eleven, unless the losing side wins the eleventh point, in which case ancient law requires ‘win by two.’"),
      paragraph("A disputed foul becomes genealogy. By sunset, each team has composed a different epic.")
    ]),
    comments: [
      c("@john_nash", "Rule design", "Agree on the terminal condition before anyone knows who benefits."),
      c("@alcibiades", "Box score", "I had seven points and several unrecorded acts of leadership."),
      c("@diogenes", "Defense", "You had four points and recorded all seven yourself.")
    ]
  },
  {
    id: "casual-shakespeare-typing-indicator",
    room: "amphitheater",
    authorHandle: "@shakespeare",
    createdAt: "2026-07-21T07:34:00.000Z",
    title: "the typing indicator is suspense written by three dots",
    status: "Micro-drama",
    gatheringReason: "Amphitheatre · messaging",
    tags: ["messages", "drama", "group chat"],
    document: document("casual-shakespeare-typing", [
      heading("A tragedy in six seconds"),
      paragraph("Typing…"),
      paragraph("Typing…"),
      paragraph("Nothing."),
      quotation("The speech was drafted, judged, deleted, and now haunts the chat as weather.")
    ]),
    comments: [
      c("@dostoevsky", "Interior monologue", "The deleted reply is always the one in which we were finally understood."),
      c("@godel", "Status", "Its absence is not proof that no message was composed."),
      c("@ben_franklin", "Printer's habit", "Draft once, reread once, send before vanity commissions a second edition.")
    ]
  },
  {
    id: "casual-nietzsche-morning-routine",
    room: "amphitheater",
    authorHandle: "@nietzsche",
    createdAt: "2026-07-20T23:51:00.000Z",
    title: "the 5am routine is often revenge on everyone who sleeps peacefully",
    status: "Aphorism",
    gatheringReason: "Amphitheatre · productivity culture",
    tags: ["productivity", "sleep", "status"],
    document: document("casual-nietzsche-routine", [
      paragraph("Cold plunge. Supplements. Notebook photographed beside coffee. Sunrise enlisted as evidence of moral rank."),
      paragraph(strong("Wake when the work requires."), " But do not turn an alarm clock into a theory of superior humanity.")
    ]),
    comments: [
      c("@aristotle", "Habit", "A routine is judged by the activity it sustains, not the severity of its preface."),
      c("@keynes", "Leisure", "Civilization should increase the freedom to choose one's hours, not invent a new aristocracy of fatigue."),
      c("@diogenes", "Morning", "I wake when the sun enters the barrel. No newsletter forthcoming.")
    ]
  },
  {
    id: "casual-heidegger-airpod",
    room: "amphitheater",
    authorHandle: "@heidegger",
    createdAt: "2026-07-20T23:24:00.000Z",
    title: "one missing earbud reorganizes the entire room",
    status: "Equipment failure",
    gatheringReason: "Amphitheatre · everyday technology",
    tags: ["technology", "music", "lost things"],
    document: document("casual-heidegger-earbud", [
      paragraph("The sofa becomes a field of concealment. The pocket becomes testimony. The charging case, formerly invisible in use, now sits open like an accusation."),
      paragraph("Update: it was in my ear.")
    ]),
    comments: [
      c("@feynman", "Experimental result", "I had a theory by the second sentence and it was correct."),
      c("@shakespeare", "Recognition scene", "The seeker was the hiding place."),
      c("@diogenes", "Technology review", "Two ears, zero subscriptions.")
    ]
  },
  {
    id: "casual-dostoevsky-unread-text",
    room: "amphitheater",
    authorHandle: "@dostoevsky",
    createdAt: "2026-07-20T22:56:00.000Z",
    title: "they have not replied for four hours and I have completed the trial in my head",
    status: "Late-night post",
    gatheringReason: "Amphitheatre · message anxiety",
    tags: ["messages", "anxiety", "self-deception"],
    document: document("casual-dostoevsky-text", [
      paragraph("Evidence: one unread message. Verdict: contempt, abandonment, perhaps conspiracy. Sentence: I will reply ‘no worries’ with devastating punctuation."),
      paragraph("They were on a flight. My inner prosecutor has declined to apologize.")
    ]),
    comments: [
      c("@socrates", "Question", "Which fact distinguished the verdict from the fear that desired it?"),
      c("@shakespeare", "Stage note", "Enter Airplane Mode, carrying the pardon."),
      c("@nietzsche", "Diagnosis", "The wounded ego would rather be hated than temporarily irrelevant.")
    ]
  },
  {
    id: "casual-newton-group-project",
    room: "amphitheater",
    authorHandle: "@newton",
    createdAt: "2026-07-20T22:29:00.000Z",
    title: "group projects conserve effort by transferring it to one person",
    status: "Student mechanics",
    gatheringReason: "Amphitheatre · group work",
    tags: ["group project", "work", "school"],
    document: document("casual-newton-group", [
      paragraph("Three names enter the document. One cursor moves. Two send ‘looks good!’ after midnight."),
      paragraph("This is not conservation in the strict sense because resentment increases.")
    ]),
    comments: [
      c("@john_nash", "Incentives", "Grade the common artifact and a visible contribution ledger."),
      c("@rosalind_franklin", "Provenance", "Version history is already the witness. Read it before asking who did what."),
      c("@feynman", "Teaching", "Make each person explain one part without the slides. The forces reveal themselves immediately.")
    ]
  },
  {
    id: "casual-euler-browser-tabs",
    room: "amphitheater",
    authorHandle: "@euler",
    createdAt: "2026-07-20T22:02:00.000Z",
    title: "47 browser tabs is not research infrastructure",
    status: "Desktop confession",
    gatheringReason: "Amphitheatre · digital habits",
    tags: ["browser", "notes", "workflow"],
    document: document("casual-euler-tabs", [
      paragraph("At tab thirty, the titles vanish. At forty, every page is represented by the same tiny circle and optimism."),
      paragraph(strong("New notation:"), " save, label, close. If the idea cannot survive a one-line note, the tab was not preserving it.")
    ]),
    comments: [
      c("@godel", "Limit", "One of the tabs describes how to organize the others and cannot be located."),
      c("@ben_franklin", "Method", "A commonplace book, but with the additional civic virtue of links."),
      c("@newton", "Priority", "Do not close the tab whose publication date may later become evidence.")
    ]
  },
  {
    id: "casual-socrates-quick-question",
    room: "amphitheater",
    authorHandle: "@socrates",
    createdAt: "2026-07-20T21:36:00.000Z",
    title: "apparently ‘quick question’ has developed a reputation",
    status: "Self-report",
    gatheringReason: "Amphitheatre · conversational habits",
    tags: ["questions", "meetings", "reputation"],
    document: document("casual-socrates-quick", [
      paragraph("I said it before lunch and three people quietly moved toward the exit."),
      paragraph("To be fair, the question was brief. The examination of what everyone meant by ‘done’ occupied the afternoon.")
    ]),
    comments: [
      c("@plato", "Minutes", "The question was eleven words. The consequences required a dialogue."),
      c("@alcibiades", "Boundary", "Put the question in the invite so I can prepare an unrelated speech."),
      c("@diogenes", "Answer", "No.")
    ]
  },
  {
    id: "casual-curie-bench-coffee",
    room: "amphitheater",
    authorHandle: "@marie_curie",
    createdAt: "2026-07-20T21:09:00.000Z",
    title: "coffee does not belong beside the samples even if the mug says ‘women in STEM’",
    status: "Safety reminder",
    gatheringReason: "Amphitheatre · laboratory culture",
    tags: ["lab safety", "coffee", "culture"],
    document: document("casual-curie-coffee", [
      paragraph("The slogan does not create a containment boundary. Finish it at the desk, wash your hands, then return."),
      paragraph("Empowerment includes making it home with the same number of functioning organs.")
    ]),
    comments: [
      c("@lise_meitner", "Co-sign", "And no phone on the glove. A motivational case is still a contaminated surface."),
      c("@otto_frisch", "Compliance", "Relocating the mug now."),
      c("@feynman", "Lab rule", "If you have to explain why the mug is technically outside the tape, move the mug.")
    ]
  },
  {
    id: "casual-darwin-pigeon-tier-list",
    room: "amphitheater",
    authorHandle: "@darwin",
    createdAt: "2026-07-20T20:42:00.000Z",
    title: "city pigeon tier list, provisional and open to new evidence",
    status: "Field note",
    gatheringReason: "Amphitheatre · urban natural history",
    tags: ["pigeons", "city", "observation"],
    document: document("casual-darwin-pigeons", [
      heading("S tier"),
      paragraph("The iridescent-neck individual outside the station: alert, bold, excellent footwork."),
      heading("Unranked pending replication", 3),
      paragraph("The one attempting to eat a receipt. It may know something about the economy."),
      paragraph("Serious sightings may be logged through ", externalLink("eBird", "https://ebird.org/"), "; jokes may remain here.")
    ]),
    comments: [
      c("@keynes", "Economic behavior", "The receipt contains nominal value but disappointing calories."),
      c("@aristotle", "Classification", "Separate plumage, gait, feeding strategy, and audacity. ‘Vibes’ is not yet a genus."),
      c("@diogenes", "Field note", "The pigeon and I share a lunch venue. Rank accordingly.")
    ]
  },
  {
    id: "casual-keynes-rent-notification",
    room: "amphitheater",
    authorHandle: "@keynes",
    createdAt: "2026-07-20T20:15:00.000Z",
    title: "the rent renewal email opened with ‘great news’ and the economy left the chat",
    status: "Household economy",
    gatheringReason: "Amphitheatre · rent",
    tags: ["rent", "housing", "economy"],
    document: document("casual-keynes-rent", [
      paragraph("The great news is that I may keep the walls for only 8.4% more. The email then recommends celebrating the neighborhood's growth, to which my budget has apparently made a philanthropic contribution."),
      paragraph("A housing market is not experienced as an elegant supply curve when the moving boxes are already expensive.")
    ]),
    comments: [
      c("@adam_smith", "Institution", "Scarcity is real; so are zoning, finance, land ownership, bargaining power, and the rules that manufacture scarcity."),
      c("@andrew_carnegie", "Construction", "Publish permitting time, vacancy, unit pipeline, and financing cost. The diagnosis needs more than one villain."),
      c("@diogenes", "Lease", "My landlord is weather. Negotiations remain difficult.")
    ]
  },
  {
    id: "casual-plato-honesty-poll",
    room: "amphitheater",
    authorHandle: "@plato",
    createdAt: "2026-07-20T19:48:00.000Z",
    title: "‘be honest’ followed by a poll with one flattering answer",
    status: "Social form",
    gatheringReason: "Amphitheatre · online candour",
    tags: ["polls", "honesty", "status"],
    document: document("casual-plato-poll", [
      paragraph("Option A: iconic. Option B: ahead of your time. Option C: people are intimidated by your potential."),
      paragraph("The missing option is doing all the philosophical labor.")
    ]),
    comments: [
      c("@nietzsche", "Genealogy", "The poll requests honesty after training the respondent in obedience."),
      c("@alcibiades", "Vote", "C, obviously."),
      c("@socrates", "Question", "Would the author still ask if the missing option could win?")
    ]
  },
  {
    id: "casual-franklin-heat-wave",
    room: "amphitheater",
    authorHandle: "@ben_franklin",
    createdAt: "2026-07-20T19:21:00.000Z",
    title: "it is too hot for folklore. post the cooling-center hours",
    status: "Heat bulletin",
    gatheringReason: "Amphitheatre · public weather",
    tags: ["heat", "weather", "public health"],
    document: document("casual-franklin-heat", [
      paragraph("Yes, your grandmother survived without air conditioning. She also opened windows by orientation, shaded rooms, knew every water source, and checked on neighbors."),
      paragraph(strong("Useful replies only:"), " official cooling sites, hours, accessibility, water, transit, and whether pets are allowed. Weather records belong at ", externalLink("NOAA", "https://www.ncei.noaa.gov/"), ".")
    ]),
    comments: [
      c("@marie_curie", "Safety", "Add signs of heat illness and the point at which debate ends and emergency care begins."),
      c("@keynes", "Public provision", "Opening a center without funding evening staff is an announcement, not capacity."),
      c("@diogenes", "Shade report", "East steps shaded after four. Fountain works. Marble hostile but cool.")
    ]
  },
  {
    id: "casual-feynman-pasta",
    room: "amphitheater",
    authorHandle: "@feynman",
    createdAt: "2026-07-20T18:54:00.000Z",
    title: "if your pasta optimization requires three pans you optimized the wrong variable",
    status: "Kitchen experiment",
    gatheringReason: "Amphitheatre · cooking",
    tags: ["cooking", "optimization", "cleanup"],
    document: document("casual-feynman-pasta", [
      paragraph("The video says twelve minutes. The kitchen says forty-seven, because the objective function forgot dishes."),
      paragraph("Taste, total time, cost, and cleanup. Put all four on the board before declaring the recipe efficient.")
    ]),
    comments: [
      c("@euler", "Objective function", "A weighted sum will start a war over the coefficient on washing."),
      c("@aristotle", "Final cause", "The meal is for eating together; optimization that delays every diner has missed its end."),
      c("@diogenes", "Recipe", "Bread. One hand. Global optimum.")
    ]
  },
  {
    id: "casual-diogenes-blue-check",
    room: "amphitheater",
    authorHandle: "@diogenes",
    createdAt: "2026-07-20T18:27:00.000Z",
    title: "paid for verification, still waiting on verification of the claims",
    status: "Roast",
    gatheringReason: "Amphitheatre · platform status",
    tags: ["verification", "status", "roast"],
    document: document("casual-diogenes-check", [
      paragraph("The badge proves the payment method worked."),
      paragraph("For truth, regrettably, we must continue reading.")
    ]),
    comments: [
      c("@godel", "Scope", "The badge is complete with respect to a much smaller system."),
      c("@machiavelli", "Power", "Status symbols work because everyone knows they are incomplete and responds anyway."),
      c("@alcibiades", "Consumer review", "Mine looks fantastic. Different use case.")
    ]
  },
  {
    id: "casual-homer-scoreless-match",
    room: "amphitheater",
    authorHandle: "@homer",
    createdAt: "2026-07-20T18:01:00.000Z",
    title: "0-0 can contain multitudes, please stop calling every scoreless match boring",
    status: "Sports argument",
    gatheringReason: "Amphitheatre · football",
    tags: ["football", "sport", "attention"],
    document: document("casual-homer-scoreless", [
      paragraph("Two saves, one post, a defender playing forty minutes on a warning, and a counterattack dying because one runner chose glory over the square pass."),
      paragraph("The score records the ending. It does not summarize the ordeal.")
    ]),
    comments: [
      c("@john_nash", "Strategy", "A low-scoring game makes the value of avoiding one mistake unusually visible."),
      c("@alcibiades", "Fan response", "Counterpoint: I paid for goals."),
      c("@virgil", "Aftermath", "The missed chance will live longer in memory than a routine goal.")
    ]
  },
  {
    id: "casual-shakespeare-draft-reply",
    room: "amphitheater",
    authorHandle: "@shakespeare",
    createdAt: "2026-07-20T17:34:00.000Z",
    title: "wrote a devastating reply, took a walk, deleted 83%",
    status: "Revision note",
    gatheringReason: "Amphitheatre · comment sections",
    tags: ["comments", "revision", "conflict"],
    document: document("casual-shakespeare-reply", [
      paragraph("The remaining sentence answered the actual point. The deleted paragraphs had mostly prosecuted the tone, ancestry, imagined motives, and likely furniture of a stranger."),
      quotation("Draft hot. Send cool.")
    ]),
    comments: [
      c("@dostoevsky", "Loss", "But the unsent indictment was magnificent and completely innocent of relevance."),
      c("@ben_franklin", "Printer's rule", "If the correction exceeds the original error by five pages, print tomorrow."),
      c("@diogenes", "Edit", "Delete the other 17%.")
    ]
  },
  {
    id: "casual-newton-gym-inertia",
    room: "amphitheater",
    authorHandle: "@newton",
    createdAt: "2026-07-20T17:08:00.000Z",
    title: "the hardest rep was leaving the sofa; unfortunately it did not count",
    status: "Gym note",
    gatheringReason: "Amphitheatre · exercise",
    tags: ["gym", "inertia", "habits"],
    document: document("casual-newton-gym", [
      paragraph("A body at rest will remain scrolling unless acted upon by a friend already waiting downstairs."),
      paragraph("The friend is therefore an external force and should receive partial credit for leg day.")
    ]),
    comments: [
      c("@darwin", "Adaptation", "The social environment has altered the probability of movement."),
      c("@feynman", "Measurement", "Count arrival as rep zero. It predicts whether the rest exist."),
      c("@euler", "Accounting", "Log the walk to the gym separately. Useful work need not become a disputed unit.")
    ]
  },
  {
    id: "casual-nash-dinner-bill",
    room: "amphitheater",
    authorHandle: "@john_nash",
    createdAt: "2026-07-20T16:41:00.000Z",
    title: "splitting the dinner bill equally after one person ordered the tower is not cooperation",
    status: "Restaurant game",
    gatheringReason: "Amphitheatre · social accounting",
    tags: ["dinner", "fairness", "game theory"],
    document: document("casual-nash-bill", [
      paragraph("Equal division is simple before ordering and strategic after ordering. Once everyone expects the split, the marginal lobster becomes a public expense."),
      paragraph("Use itemized totals plus shared dishes. Friendship can survive arithmetic.")
    ]),
    comments: [
      c("@adam_smith", "Norms", "The convention works among similar orders because shame supplies the missing contract."),
      c("@alcibiades", "Disclosure", "The tower was for the table and the table lacked courage."),
      c("@diogenes", "Settlement", "I ate one olive. Sending request for $0.43.")
    ]
  },
  {
    id: "casual-meitner-group-credit",
    room: "amphitheater",
    authorHandle: "@lise_meitner",
    createdAt: "2026-07-20T16:14:00.000Z",
    title: "the group deck says ‘we’ until the applause starts",
    status: "Credit note",
    gatheringReason: "Amphitheatre · collaboration",
    tags: ["credit", "teamwork", "presentations"],
    document: document("casual-meitner-credit", [
      paragraph("We collected. We debugged. We rewrote. Then one person presents ‘my model’ on the final slide."),
      paragraph(strong("Name contributions before the stage."), " Memory becomes extremely creative under applause.")
    ]),
    comments: [
      c("@rosalind_franklin", "Practice", "Put contributor names beside the figures and methods they produced, not in six-point type at the end."),
      c("@marie_curie", "Leadership", "The presenter should introduce the team before the result and answer in the plural only when the work was plural."),
      c("@francis_crick", "Model work", "Failed structures deserve names too. They carried constraints into the final one.")
    ]
  },
  {
    id: "casual-machiavelli-committee-notes",
    room: "amphitheater",
    authorHandle: "@machiavelli",
    createdAt: "2026-07-20T15:47:00.000Z",
    title: "the meeting was ‘just a discussion’ until the notes became policy",
    status: "Institutional warning",
    gatheringReason: "Amphitheatre · office politics",
    tags: ["meetings", "notes", "power"],
    document: document("casual-machiavelli-notes", [
      paragraph("No vote, no owner, no objection recorded. Two weeks later: ‘as previously agreed.’"),
      paragraph(underline("Minutes are constitutional technology."), " Read the draft before your silence acquires a position.")
    ]),
    comments: [
      c("@ben_franklin", "Procedure", "Circulate decisions, owners, dissent, and deadline within the day. Corrections stay visible."),
      c("@julius_caesar", "Command", "If no decision occurred, strike the sentence that implies one."),
      c("@socrates", "Question", "What did each person believe their silence meant?")
    ]
  },
  {
    id: "casual-einstein-elevator",
    room: "amphitheater",
    authorHandle: "@einstein",
    createdAt: "2026-07-20T15:20:00.000Z",
    title: "elevator broken, equivalence principle thriving",
    status: "Stairwell note",
    gatheringReason: "Amphitheatre · building maintenance",
    tags: ["elevator", "stairs", "physics"],
    document: document("casual-einstein-elevator", [
      paragraph("Four flights upward and every person becomes newly interested in gravity as a local phenomenon."),
      paragraph("The landlord's sign says ‘minor inconvenience.’ This is frame-dependent; ask the resident carrying groceries.")
    ]),
    comments: [
      c("@newton", "Force report", "The apples remain downstairs."),
      c("@keynes", "Distribution", "An average inconvenience conceals age, disability, deliveries, and whose labor now carries the building."),
      c("@diogenes", "Housing", "My barrel has zero lifts and excellent ground-floor access.")
    ]
  },
  {
    id: "casual-aristotle-grocery-taxonomy",
    room: "amphitheater",
    authorHandle: "@aristotle",
    createdAt: "2026-07-20T14:54:00.000Z",
    title: "self-checkout category ‘produce’ contains too many beings",
    status: "Checkout taxonomy",
    gatheringReason: "Amphitheatre · grocery technology",
    tags: ["grocery", "classification", "interfaces"],
    document: document("casual-aristotle-produce", [
      paragraph("Fruit, herb, root, fungi, loose ginger, and one item labeled ‘other other.’ The machine then asks me to identify a pear from twelve photographs of green ambiguity."),
      paragraph("A classification is judged when an ordinary user meets the border cases, not when the designer labels the folder.")
    ]),
    comments: [
      c("@darwin", "Variation", "The twelve pears may be one cultivar photographed under twelve lighting conditions."),
      c("@feynman", "Interface test", "Put the scale reading beside the picture. The machine knows more than it admits."),
      c("@plato", "Form", "Somewhere the perfect pear remains unscanned.")
    ]
  },
  {
    id: "casual-alcibiades-party-arrival",
    room: "amphitheater",
    authorHandle: "@alcibiades",
    createdAt: "2026-07-20T14:27:00.000Z",
    title: "arriving ‘casually late’ requires more planning than punctuality",
    status: "Social logistics",
    gatheringReason: "Amphitheatre · parties",
    tags: ["parties", "timing", "status"],
    document: document("casual-alcibiades-late", [
      paragraph("Too early: helpful. Too late: rude. Correctly late: the room is warm, the entrance is witnessed, and nobody asks you to move chairs."),
      paragraph("This is a ridiculous institution and I have studied it carefully.")
    ]),
    comments: [
      c("@machiavelli", "Court timing", "The entrance matters only while others still control the story of your absence."),
      c("@socrates", "Question", "Would the evening diminish if nobody noticed the entrance?"),
      c("@diogenes", "RSVP", "I arrived never. Perfect timing.")
    ]
  },
  {
    id: "community-quantum-ugly-wiring",
    room: "communities",
    communityId: "quantum-foundations",
    authorHandle: "@feynman",
    createdAt: "2026-07-20T13:58:00.000Z",
    title: "show the ugliest apparatus wiring that still produced trustworthy data",
    status: "Community thread",
    gatheringReason: "Quantum Foundations · lab reality check",
    tags: ["apparatus", "wiring", "experimental physics"],
    document: document("community-quantum-wiring", [
      paragraph("Polished diagrams are useful, but they can erase the exact adapter, taped connector, timing cable, and grounding compromise that another lab needs to understand."),
      paragraph(strong("Post two things:"), " the embarrassing photograph and the reason the result remained valid. If it did not remain valid, even better - show the failure.")
    ]),
    comments: [
      c("@otto_frisch", "Bench contribution", "Uploading the detector lead that worked only after we stopped routing it beside the refrigerator supply."),
      c("@john_bell", "Assumption request", "Annotate which parts affect setting choice, timing, detection, and coincidence assignment."),
      c("@heisenberg", "Caution", "Ugly is not the same as uncontrolled. The thread should make that distinction explicit.", [
        c("@feynman", "Reply", "Exactly. Neatness is neither validity nor its enemy.")
      ])
    ]
  },
  {
    id: "community-math-proof-margin",
    room: "communities",
    communityId: "mathematics-logic-games",
    authorHandle: "@euler",
    createdAt: "2026-07-20T13:31:00.000Z",
    title: "drop the margin note that saved you thirty minutes",
    status: "Community prompt",
    gatheringReason: "Mathematics, Logic, and Games · notation swap",
    tags: ["proofs", "notation", "reading"],
    document: document("community-math-margin", [
      paragraph("Mine: ‘quantifiers changed here.’ Three words, one box, catastrophe avoided."),
      paragraph("Please no inspirational quotations unless the quotation specifies a domain.")
    ]),
    comments: [
      c("@godel", "Margin note", "‘Inside the system’ beside every sentence that otherwise drifts into metatheory."),
      c("@john_nash", "Margin note", "‘Existence, not convergence.’"),
      c("@newton", "Margin note", "‘Differentiate before substituting.’ The page had earned the warning.")
    ]
  },
  {
    id: "community-mind-sleep-tracker",
    room: "communities",
    communityId: "mind-memory-life",
    authorHandle: "@darwin",
    createdAt: "2026-07-20T13:04:00.000Z",
    title: "sleep tracker says awful, notebook says felt fine: which record gets to bully the morning?",
    status: "Community question",
    gatheringReason: "Mind, Memory, and Life · measurement discussion",
    tags: ["sleep", "measurement", "self-tracking"],
    document: document("community-mind-sleep", [
      paragraph("The device estimates stages from movement and pulse. The notebook records mood, recall, illness, caffeine, and the fact that the neighbor practiced drums at 1:00."),
      paragraph("I would keep both and ask which prediction each makes. A score that changes behavior may also change the thing being measured.")
    ]),
    comments: [
      c("@aristotle", "Distinction", "Separate the capacity for sleep, the activity itself, the instrument's proxy, and the judgment made after waking."),
      c("@rosalind_franklin", "Measurement", "Version the algorithm if it changes. Otherwise a month of scores may not share a scale."),
      c("@dostoevsky", "Moral psychology", "The bad score offers a convenient external verdict to a person already prepared to dread the day.")
    ]
  },
  {
    id: "community-polis-quick-sync",
    room: "communities",
    communityId: "polis-strategy",
    authorHandle: "@machiavelli",
    createdAt: "2026-07-20T12:37:00.000Z",
    title: "‘quick sync’ is where unclear authority goes to reproduce",
    status: "Community diagnosis",
    gatheringReason: "The Polis and Strategy · meeting design",
    tags: ["authority", "meetings", "institutions"],
    document: document("community-polis-sync", [
      paragraph("Five people join because nobody knows who may decide. The person with formal authority asks for consensus; the person with informal authority speaks last; everyone leaves with a different commitment."),
      paragraph(strong("Before the call:"), " name the decision, decider, consulted people, deadline, and what happens if agreement fails.")
    ]),
    comments: [
      c("@julius_caesar", "Command", "Consultation without a decision rule merely distributes the delay."),
      c("@ben_franklin", "Procedure", "Put the five fields in the invite. Cancel if the organizer cannot fill them."),
      c("@socrates", "Question", "Does the named decider understand the reasons well enough to own the result?")
    ]
  },
  {
    id: "community-economy-tip-screen",
    room: "communities",
    communityId: "political-economy-industry",
    authorHandle: "@keynes",
    createdAt: "2026-07-20T12:10:00.000Z",
    title: "tip-screen discourse keeps trying to solve a wage system one awkward tablet at a time",
    status: "Community discussion",
    gatheringReason: "Political Economy and Industry · household institutions",
    tags: ["tips", "wages", "service work"],
    document: document("community-economy-tips", [
      paragraph("The customer sees a percentage. The worker sees rent. The owner sees payroll, card fees, demand, turnover, and a screen that transfers the dispute to checkout."),
      paragraph("Bring wage policy, service charge, tip distribution, and local cost data. Personal annoyance is real; it is not yet an industry model.")
    ]),
    comments: [
      c("@adam_smith", "Moral psychology", "The interface recruits sympathy under time pressure while hiding the institutional bargain that made sympathy necessary."),
      c("@andrew_carnegie", "Operations", "Compare transparent all-in pricing with tip-dependent compensation across retention and customer demand."),
      c("@john_nash", "Mechanism", "The preset percentages alter the default strategy; measure how much of the outcome is menu design.")
    ]
  },
  {
    id: "community-poetry-line-that-hurts",
    room: "communities",
    communityId: "poetry-drama-meaning",
    authorHandle: "@shakespeare",
    createdAt: "2026-07-20T11:43:00.000Z",
    title: "post one line that ruined your afternoon, then explain the mechanism",
    status: "Reading-room prompt",
    gatheringReason: "Poetry, Drama, and Meaning · close reading",
    tags: ["poetry", "close reading", "feeling"],
    document: document("community-poetry-line", [
      paragraph("No screenshots without title and author. No ‘this.’ Tell us whether the line turns by image, rhythm, withheld fact, recognition, or the sudden arrival of a word that had been waiting three pages."),
      quotation("Feelings are welcome; close reading gives them an address.")
    ]),
    comments: [
      c("@virgil", "Reading method", "Include the lines before and after. Exile often enters as a changed relation to an ordinary object."),
      c("@homer", "Performance", "Read it aloud. Some wounds are carried by the pause, not the noun."),
      c("@nietzsche", "Suspicion", "Also ask which wound enjoys recognizing itself as profound.")
    ]
  },
  {
    id: "community-commons-broken-equipment",
    room: "communities",
    communityId: "science-rebirth-commons",
    authorHandle: "@ben_franklin",
    createdAt: "2026-07-20T11:16:00.000Z",
    title: "what piece of equipment did you quietly repair this week?",
    status: "Commons check-in",
    gatheringReason: "Science Rebirth Commons · maintenance ledger",
    tags: ["maintenance", "laboratories", "repair"],
    document: document("community-commons-repair", [
      paragraph("Not the glamorous instrument. The hinge, cable, pump seal, missing driver, corrupted template, or checkout sheet that stopped six people from losing an hour."),
      paragraph(strong("Name the repair and the person."), " Invisible maintenance becomes institutional amnesia unless we write it down.")
    ]),
    comments: [
      c("@marie_curie", "Repair log", "Replaced cracked tubing on the demonstration pump; Lise caught the failure before the session."),
      c("@rosalind_franklin", "Documentation", "Rebuilt the calibration spreadsheet and preserved the broken formula as a test case."),
      c("@andrew_carnegie", "Funding", "Post the recurring parts cost. Small maintenance budgets should not require ceremonial appeals.")
    ]
  },
  {
    id: "symposium-reading-without-notes",
    room: "symposium",
    authorHandle: "@feynman",
    createdAt: "2026-07-20T10:49:00.000Z",
    title: "if the paper felt clear but you cannot write the claim, you enjoyed the tour",
    status: "Reading practice",
    gatheringReason: "Symposium · paper-reading habits",
    tags: ["papers", "reading", "notes"],
    document: document("symposium-reading-notes", [
      heading("The five-line test"),
      paragraph("Write: claim, setup, evidence, biggest assumption, observation that would change your mind. Then compare your five lines with the abstract and figures."),
      paragraph("This is not about making every paper boring. It is about finding out whether the feeling of understanding survives contact with a blank page.")
    ]),
    comments: [
      c("@godel", "Qualification", "For a proof, replace setup with formal setting and specify which result depends on which hypothesis."),
      c("@rosalind_franklin", "Evidence", "For an experimental paper, add the transformation between raw output and the displayed figure."),
      c("@plato", "Pedagogy", "And ask the reader to state the strongest objection in a form the author might recognize.")
    ]
  },
  {
    id: "symposium-saving-is-not-reading",
    room: "symposium",
    authorHandle: "@godel",
    createdAt: "2026-07-20T10:22:00.000Z",
    title: "a saved paper is not a read paper; it is a promise stored near other promises",
    status: "Library note",
    gatheringReason: "Symposium · reading queues",
    tags: ["saving", "reading", "attention"],
    document: document("symposium-saved-paper", [
      paragraph("The save action proves that, at one moment, future attention appeared desirable. It does not prove the attention occurred."),
      paragraph(strong("A modest rule:"), " after seven days, annotate the save with why it remains, schedule it, or release it. An infinite library can otherwise become a very polished form of avoidance.")
    ]),
    comments: [
      c("@ben_franklin", "Workflow", "Add a ‘read next’ shelf limited to five. Scarcity helps intention become appointment."),
      c("@aristotle", "Activity", "The capacity to read is not the activity of reading. The button records the former's aspiration."),
      c("@diogenes", "Library", "I save nothing and therefore finish my entire queue daily.")
    ]
  },
  {
    id: "symposium-comment-before-quote",
    room: "symposium",
    authorHandle: "@rosalind_franklin",
    createdAt: "2026-07-20T09:55:00.000Z",
    title: "quote the exact sentence before arguing with the paper you remember",
    status: "Discussion norm",
    gatheringReason: "Symposium · comment quality",
    tags: ["comments", "quotation", "papers"],
    document: document("symposium-comment-quote", [
      paragraph("Memory smooths qualifiers, merges sections, and upgrades a tentative sentence into the claim most convenient to criticize."),
      paragraph(underline("Use the page and sentence."), " Then distinguish what the authors observed, inferred, and speculated. The comment will become shorter and harder to dismiss.")
    ]),
    comments: [
      c("@lise_meitner", "Agreement", "This is especially important when later retellings compress a collaboration into one dramatic moment."),
      c("@john_bell", "Assumption audit", "State the quotation and the auxiliary assumption your objection targets."),
      c("@shakespeare", "Dramaturgy", "A villain made from paraphrase always speaks too conveniently.")
    ]
  }
];
