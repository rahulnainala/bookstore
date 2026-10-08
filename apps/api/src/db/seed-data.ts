/**
 * Starter catalog for the demo store. Covers are loaded from the Open Library covers API by ISBN;
 * the web app falls back to a generated cover when one is missing. Descriptions are original
 * one-line summaries written for this project.
 */

export const GENRES = [
  "Classics",
  "Literary Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery & Thriller",
  "Romance",
  "History",
  "Science",
  "Biography & Memoir",
  "Business & Self-Help",
  "Young Adult",
] as const;

type GenreName = (typeof GENRES)[number];

export const AUTHORS: Record<string, string> = {
  "Jane Austen": "English novelist (1775–1817) known for sharp social comedy and memorable heroines.",
  "George Orwell": "English essayist and novelist whose work examines power, propaganda and plain language.",
  "Harper Lee": "American novelist from Alabama, best known for her Pulitzer Prize-winning debut.",
  "F. Scott Fitzgerald": "Chronicler of the American Jazz Age and its glittering, uneasy wealth.",
  "Charlotte Brontë": "English novelist and poet, eldest of the three Brontë sisters to reach adulthood.",
  "Mary Shelley": "English writer who helped invent science fiction while still a teenager.",
  "Herman Melville": "American novelist and poet of the sea, of whaling voyages and obsession.",
  "Fyodor Dostoevsky": "Russian novelist who probed guilt, faith and freedom in psychological depth.",
  "J.R.R. Tolkien": "Oxford philologist who built Middle-earth and shaped modern fantasy.",
  "George R.R. Martin": "American author of sprawling, morally grey epic fantasy.",
  "Patrick Rothfuss": "American fantasy writer celebrated for lyrical prose and intricate magic.",
  "Brandon Sanderson": "Prolific American fantasy author known for rule-driven magic systems.",
  "J.K. Rowling": "British author of the best-selling series about a boy wizard.",
  "Frank Herbert": "American author whose desert planet epic is a landmark of science fiction.",
  "Isaac Asimov": "Biochemist and hugely prolific writer of science fiction and popular science.",
  "William Gibson": "American-Canadian writer who coined 'cyberspace' and defined cyberpunk.",
  "Ursula K. Le Guin": "American author of anthropological science fiction and wise, humane fantasy.",
  "Andy Weir": "Former software engineer who writes problem-solving, science-heavy adventures.",
  "Orson Scott Card": "American author of military science fiction and family sagas.",
  "Douglas Adams": "English humorist and radio writer with a gift for cosmic absurdity.",
  "Ray Bradbury": "American storyteller of rockets, small towns and the power of books.",
  "Aldous Huxley": "English writer and philosopher who imagined a pleasure-engineered future.",
  "Stieg Larsson": "Swedish journalist whose crime trilogy became an international phenomenon.",
  "Gillian Flynn": "American author of dark, twisty psychological thrillers.",
  "Dan Brown": "American thriller writer known for puzzles, codes and secret societies.",
  "Agatha Christie": "The best-selling novelist of all time and the queen of the whodunit.",
  "Arthur Conan Doyle": "Scottish physician and writer who created Sherlock Holmes.",
  "Alex Michaelides": "British-Cypriot author and screenwriter of psychological suspense.",
  "Sally Rooney": "Irish novelist writing about intimacy, class and young adulthood.",
  "Khaled Hosseini": "Afghan-American novelist and physician writing about Afghanistan and family.",
  "Cormac McCarthy": "American novelist of stark landscapes and spare, haunting prose.",
  "Toni Morrison": "Nobel laureate whose novels center Black American history and memory.",
  "Gabriel García Márquez": "Colombian Nobel laureate and master of magical realism.",
  "Matt Haig": "English author of hopeful fiction and non-fiction about mental health.",
  "Delia Owens": "American zoologist turned novelist of the natural world.",
  "Taylor Jenkins Reid": "American novelist of glamorous, emotionally sweeping stories.",
  "Diana Gabaldon": "American scientist-turned-author of a time-travelling historical saga.",
  "Jojo Moyes": "British journalist and novelist of heartfelt contemporary romance.",
  "Yuval Noah Harari": "Israeli historian writing big-picture histories of humankind.",
  "Jared Diamond": "American geographer and biologist exploring why societies rise and fall.",
  "Stephen Hawking": "Theoretical physicist who brought black holes and cosmology to the public.",
  "Carl Sagan": "Astronomer and science communicator with a poet's sense of wonder.",
  "Richard Dawkins": "British evolutionary biologist and popular science writer.",
  "Siddhartha Mukherjee": "Oncologist and Pulitzer-winning writer on medicine and genetics.",
  "Daniel Kahneman": "Nobel-winning psychologist who mapped the biases in human judgment.",
  "James Clear": "Writer and speaker on habits, decision-making and continuous improvement.",
  "Eric Ries": "Entrepreneur who popularized lean methods for building startups.",
  "Peter Thiel": "Entrepreneur and investor who co-founded PayPal and Palantir.",
  "Tara Westover": "Historian who grew up off the grid in Idaho and later earned a Cambridge PhD.",
  "Michelle Obama": "Lawyer, author and former First Lady of the United States.",
  "Walter Isaacson": "Journalist and biographer of innovators from Franklin to Jobs.",
  "Anne Frank": "Jewish diarist whose wartime journal became one of the most read books ever.",
  "Trevor Noah": "South African comedian and former host of The Daily Show.",
  "David McCullough": "Two-time Pulitzer-winning American historian and narrator.",
  "Mary Beard": "Cambridge classicist and broadcaster on ancient Rome.",
  "Suzanne Collins": "American writer for television and author of dystopian YA fiction.",
};

export interface SeedBook {
  title: string;
  author: keyof typeof AUTHORS;
  isbn: string;
  price: number;
  stock: number;
  published: string;
  pages: number;
  genres: GenreName[];
  featured?: boolean;
  description: string;
}

export const BOOKS: SeedBook[] = [
  { title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", price: 9.99, stock: 42, published: "1813-01-28", pages: 480, genres: ["Classics", "Romance"], featured: true, description: "Elizabeth Bennet trades barbs with the proud Mr. Darcy in a comedy of manners about first impressions, family pressure and learning to change your mind." },
  { title: "Emma", author: "Jane Austen", isbn: "9780141439587", price: 10.99, stock: 18, published: "1815-12-23", pages: 512, genres: ["Classics", "Romance"], description: "A clever, comfortable young woman plays matchmaker for her neighbours and discovers how little she understands her own heart." },
  { title: "Nineteen Eighty-Four", author: "George Orwell", isbn: "9780451524935", price: 9.99, stock: 55, published: "1949-06-08", pages: 328, genres: ["Classics", "Science Fiction"], featured: true, description: "Winston Smith rewrites history for a regime that watches everything, until a forbidden love affair tempts him to think for himself." },
  { title: "Animal Farm", author: "George Orwell", isbn: "9780451526342", price: 7.99, stock: 37, published: "1945-08-17", pages: 140, genres: ["Classics"], description: "Farm animals overthrow their owner and promise equality, only to watch a new ruling class take shape in this sharp political fable." },
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", price: 12.99, stock: 29, published: "1960-07-11", pages: 336, genres: ["Classics", "Literary Fiction"], featured: true, description: "In a small Alabama town, Scout Finch watches her father defend a Black man accused of a crime he did not commit." },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", price: 11.99, stock: 33, published: "1925-04-10", pages: 180, genres: ["Classics", "Literary Fiction"], description: "Nick Carraway is drawn into the lavish parties of his mysterious neighbour and a doomed pursuit of the past." },
  { title: "Jane Eyre", author: "Charlotte Brontë", isbn: "9780141441146", price: 9.99, stock: 21, published: "1847-10-16", pages: 624, genres: ["Classics", "Romance"], description: "An orphaned governess with a fierce sense of self takes a post at Thornfield Hall, where secrets lurk behind locked doors." },
  { title: "Frankenstein", author: "Mary Shelley", isbn: "9780141439471", price: 8.99, stock: 24, published: "1818-01-01", pages: 288, genres: ["Classics", "Science Fiction"], description: "A young scientist gives life to a creature and then abandons it, setting off a tragedy about ambition and responsibility." },
  { title: "Moby-Dick", author: "Herman Melville", isbn: "9780142437247", price: 14.99, stock: 4, published: "1851-10-18", pages: 720, genres: ["Classics"], description: "Ishmael ships aboard the Pequod, whose captain will sacrifice anything to hunt down the white whale that took his leg." },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky", isbn: "9780143058144", price: 15.99, stock: 14, published: "1866-01-01", pages: 720, genres: ["Classics", "Literary Fiction"], description: "A destitute former student commits murder to prove a theory, then is hunted by his own conscience and a patient detective." },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", price: 14.99, stock: 48, published: "1937-09-21", pages: 300, genres: ["Fantasy", "Classics"], featured: true, description: "Bilbo Baggins is swept from his cosy hole into a quest with thirteen dwarves, a wizard and a dragon guarding a mountain of gold." },
  { title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", isbn: "9780547928210", price: 16.99, stock: 26, published: "1954-07-29", pages: 432, genres: ["Fantasy", "Classics"], description: "Frodo inherits a ring of terrible power and sets out with eight companions to keep it from the Dark Lord." },
  { title: "A Game of Thrones", author: "George R.R. Martin", isbn: "9780553593716", price: 10.99, stock: 31, published: "1996-08-01", pages: 864, genres: ["Fantasy"], description: "Noble houses scheme for the Iron Throne while an ancient threat stirs beyond the Wall in the first book of an epic saga." },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", isbn: "9780756404741", price: 11.99, stock: 3, published: "2007-03-27", pages: 736, genres: ["Fantasy"], description: "A legendary innkeeper tells the true story of his life: an orphan, a university of magic, and a hunt for the beings who killed his family." },
  { title: "Mistborn: The Final Empire", author: "Brandon Sanderson", isbn: "9780765350381", price: 9.99, stock: 22, published: "2006-07-17", pages: 672, genres: ["Fantasy"], description: "A street thief discovers she can burn metals for power and joins a crew planning the impossible: overthrowing an immortal emperor." },
  { title: "The Way of Kings", author: "Brandon Sanderson", isbn: "9780765365279", price: 10.99, stock: 17, published: "2010-08-31", pages: 1008, genres: ["Fantasy"], description: "On a storm-scoured world, a slave, a scholar and a highprince are pulled into a war that hides an older, stranger conflict." },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "9780590353427", price: 10.99, stock: 64, published: "1997-06-26", pages: 320, genres: ["Fantasy", "Young Adult"], featured: true, description: "On his eleventh birthday, Harry learns he is a wizard and leaves his miserable relatives for Hogwarts School of Witchcraft and Wizardry." },
  { title: "Dune", author: "Frank Herbert", isbn: "9780441172719", price: 12.99, stock: 39, published: "1965-08-01", pages: 688, genres: ["Science Fiction", "Classics"], featured: true, description: "Paul Atreides' family takes control of the desert planet Arrakis, the only source of the most valuable substance in the universe." },
  { title: "Foundation", author: "Isaac Asimov", isbn: "9780553293357", price: 8.99, stock: 25, published: "1951-05-01", pages: 256, genres: ["Science Fiction", "Classics"], description: "A mathematician predicts the fall of the Galactic Empire and sets up a colony of scholars to shorten the dark age that follows." },
  { title: "I, Robot", author: "Isaac Asimov", isbn: "9780553382563", price: 9.99, stock: 0, published: "1950-12-02", pages: 272, genres: ["Science Fiction", "Classics"], description: "Linked stories about robots bound by the Three Laws, and the strange, logical ways those laws can go wrong." },
  { title: "Neuromancer", author: "William Gibson", isbn: "9780441569595", price: 10.99, stock: 12, published: "1984-07-01", pages: 288, genres: ["Science Fiction"], description: "A burned-out hacker is hired for one last job in cyberspace, working for an employer who may not be human." },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", isbn: "9780441478125", price: 9.99, stock: 9, published: "1969-03-01", pages: 304, genres: ["Science Fiction", "Classics"], description: "An envoy to an icy planet whose people have no fixed sex must learn to trust across a divide he barely understands." },
  { title: "A Wizard of Earthsea", author: "Ursula K. Le Guin", isbn: "9780547773742", price: 9.99, stock: 15, published: "1968-01-01", pages: 208, genres: ["Fantasy", "Young Adult"], description: "A gifted, proud young mage unleashes a shadow on the world and must chase it across the islands of Earthsea." },
  { title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", price: 19.99, stock: 46, published: "2021-05-04", pages: 496, genres: ["Science Fiction"], featured: true, description: "A science teacher wakes alone on a spaceship with no memory and a mission to save Earth, then discovers he may not be alone after all." },
  { title: "The Martian", author: "Andy Weir", isbn: "9780553418026", price: 11.99, stock: 34, published: "2014-02-11", pages: 384, genres: ["Science Fiction"], description: "Stranded on Mars, astronaut Mark Watney has to science his way to survival with duct tape, potatoes and a lot of sarcasm." },
  { title: "Ender's Game", author: "Orson Scott Card", isbn: "9780812550702", price: 8.99, stock: 20, published: "1985-01-15", pages: 324, genres: ["Science Fiction", "Young Adult"], description: "A brilliant child is trained in zero-gravity war games to lead humanity against an alien threat." },
  { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams", isbn: "9780345391803", price: 8.99, stock: 41, published: "1979-10-12", pages: 224, genres: ["Science Fiction"], description: "Seconds before Earth is demolished for a hyperspace bypass, Arthur Dent is rescued by a friend who turns out to be an alien." },
  { title: "Fahrenheit 451", author: "Ray Bradbury", isbn: "9781451673319", price: 9.99, stock: 28, published: "1953-10-19", pages: 256, genres: ["Science Fiction", "Classics"], description: "A fireman whose job is to burn books begins to wonder what is inside them." },
  { title: "Brave New World", author: "Aldous Huxley", isbn: "9780060850524", price: 10.99, stock: 19, published: "1932-01-01", pages: 288, genres: ["Science Fiction", "Classics"], description: "In a future engineered for stability and pleasure, one misfit starts to question what has been traded away." },
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", isbn: "9780307454546", price: 10.99, stock: 23, published: "2005-08-01", pages: 672, genres: ["Mystery & Thriller"], description: "A disgraced journalist and a brilliant, guarded hacker investigate a forty-year-old disappearance in a wealthy Swedish family." },
  { title: "Gone Girl", author: "Gillian Flynn", isbn: "9780307588371", price: 11.99, stock: 30, published: "2012-06-05", pages: 432, genres: ["Mystery & Thriller"], description: "On their fifth anniversary, Amy Dunne vanishes, and every clue seems to point at her husband." },
  { title: "The Da Vinci Code", author: "Dan Brown", isbn: "9780307474278", price: 9.99, stock: 27, published: "2003-03-18", pages: 597, genres: ["Mystery & Thriller"], description: "A symbologist and a cryptologist follow a trail of codes through Paris and London toward a secret guarded for centuries." },
  { title: "And Then There Were None", author: "Agatha Christie", isbn: "9780062073488", price: 8.99, stock: 36, published: "1939-11-06", pages: 272, genres: ["Mystery & Thriller", "Classics"], featured: true, description: "Ten strangers are lured to an island and accused of past crimes, then begin to die one by one." },
  { title: "Murder on the Orient Express", author: "Agatha Christie", isbn: "9780062693662", price: 9.99, stock: 25, published: "1934-01-01", pages: 288, genres: ["Mystery & Thriller", "Classics"], description: "Snowbound on a luxury train, Hercule Poirot must find which passenger stabbed a wealthy American." },
  { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", isbn: "9780451528018", price: 6.99, stock: 13, published: "1902-04-01", pages: 256, genres: ["Mystery & Thriller", "Classics"], description: "Sherlock Holmes and Dr. Watson investigate a family curse and a spectral hound on the Devonshire moors." },
  { title: "The Silent Patient", author: "Alex Michaelides", isbn: "9781250301697", price: 13.99, stock: 2, published: "2019-02-05", pages: 336, genres: ["Mystery & Thriller"], description: "A celebrated painter shoots her husband and never speaks again. Her psychotherapist is determined to find out why." },
  { title: "Normal People", author: "Sally Rooney", isbn: "9781984822185", price: 12.99, stock: 16, published: "2018-08-28", pages: 288, genres: ["Literary Fiction", "Romance"], description: "Two teenagers from a small Irish town circle each other through school and university, never quite able to let go." },
  { title: "The Kite Runner", author: "Khaled Hosseini", isbn: "9781594631931", price: 12.99, stock: 22, published: "2003-05-29", pages: 400, genres: ["Literary Fiction"], description: "A man returns to Kabul to atone for a childhood betrayal of his closest friend." },
  { title: "A Thousand Splendid Suns", author: "Khaled Hosseini", isbn: "9781594483851", price: 12.99, stock: 11, published: "2007-05-22", pages: 384, genres: ["Literary Fiction"], description: "Two women from different generations are bound together by marriage, war and an unbreakable friendship in Afghanistan." },
  { title: "The Road", author: "Cormac McCarthy", isbn: "9780307387899", price: 11.99, stock: 18, published: "2006-09-26", pages: 287, genres: ["Literary Fiction"], description: "A father and son walk south through a burned, silent America, carrying the fire and each other." },
  { title: "Beloved", author: "Toni Morrison", isbn: "9781400033416", price: 13.99, stock: 10, published: "1987-09-02", pages: 324, genres: ["Literary Fiction", "Classics"], description: "Years after escaping slavery, Sethe's home in Ohio is haunted by the daughter she lost and the past she cannot outrun." },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", isbn: "9780060883287", price: 14.99, stock: 15, published: "1967-05-30", pages: 448, genres: ["Literary Fiction", "Classics"], description: "Seven generations of the Buendía family rise and fall in the magical, doomed town of Macondo." },
  { title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474", price: 15.99, stock: 38, published: "2020-08-13", pages: 304, genres: ["Literary Fiction"], description: "Between life and death, Nora Seed finds a library where every book lets her try a life she could have lived." },
  { title: "Where the Crawdads Sing", author: "Delia Owens", isbn: "9780735219090", price: 13.99, stock: 26, published: "2018-08-14", pages: 384, genres: ["Literary Fiction", "Mystery & Thriller"], description: "Abandoned as a child, the 'Marsh Girl' raises herself in the North Carolina wetlands, until a local man is found dead." },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", isbn: "9781501161933", price: 14.99, stock: 32, published: "2017-06-13", pages: 400, genres: ["Literary Fiction", "Romance"], description: "A reclusive Hollywood icon finally tells her life story to an unknown journalist, and the reason she chose her is the last secret." },
  { title: "Outlander", author: "Diana Gabaldon", isbn: "9780440212560", price: 10.99, stock: 14, published: "1991-06-01", pages: 896, genres: ["Romance", "Fantasy"], description: "A WWII nurse touches a standing stone in Scotland and wakes in 1743, caught between two times and two men." },
  { title: "Me Before You", author: "Jojo Moyes", isbn: "9780143124542", price: 11.99, stock: 20, published: "2012-01-05", pages: 400, genres: ["Romance"], description: "A quirky small-town carer takes a job looking after a wealthy, embittered man paralysed in an accident." },
  { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", price: 18.99, stock: 44, published: "2014-09-04", pages: 464, genres: ["History", "Science"], featured: true, description: "How an unremarkable ape came to rule the planet, told through the cognitive, agricultural and scientific revolutions." },
  { title: "Homo Deus", author: "Yuval Noah Harari", isbn: "9780062464316", price: 17.99, stock: 12, published: "2016-09-08", pages: 464, genres: ["History", "Science"], description: "Having tamed famine, plague and war, what will humanity strive for next, and what might it cost us?" },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", isbn: "9780393317558", price: 16.99, stock: 9, published: "1997-03-01", pages: 528, genres: ["History", "Science"], description: "Why did some societies conquer others? A geographer argues the answer lies in crops, animals and continents, not people." },
  { title: "SPQR", author: "Mary Beard", isbn: "9781631492228", price: 17.99, stock: 7, published: "2015-10-20", pages: 608, genres: ["History"], description: "A thousand years of Roman history, from myth to empire, told with wit and a historian's eye for evidence." },
  { title: "The Wright Brothers", author: "David McCullough", isbn: "9781476728742", price: 16.99, stock: 8, published: "2015-05-05", pages: 336, genres: ["History", "Biography & Memoir"], description: "Two bicycle makers from Ohio teach themselves to fly through stubborn experiment and remarkable partnership." },
  { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", price: 18.99, stock: 21, published: "1988-04-01", pages: 212, genres: ["Science"], description: "From the Big Bang to black holes, a physicist explains the nature of space and time for curious non-specialists." },
  { title: "Cosmos", author: "Carl Sagan", isbn: "9780345539434", price: 17.99, stock: 16, published: "1980-10-01", pages: 432, genres: ["Science"], description: "A tour of the universe and of the human story of discovering it, full of wonder and scientific skepticism." },
  { title: "The Selfish Gene", author: "Richard Dawkins", isbn: "9780198788607", price: 15.99, stock: 11, published: "1976-01-01", pages: 544, genres: ["Science"], description: "Evolution viewed from the gene's point of view, and what that means for cooperation, altruism and culture." },
  { title: "The Gene: An Intimate History", author: "Siddhartha Mukherjee", isbn: "9781476733524", price: 19.99, stock: 10, published: "2016-05-17", pages: 608, genres: ["Science", "History"], description: "The story of the gene from Mendel's peas to gene editing, woven with the author's own family history of mental illness." },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "9780374533557", price: 18.99, stock: 27, published: "2011-10-25", pages: 512, genres: ["Science", "Business & Self-Help"], description: "Two systems drive the way we think, one fast and intuitive, one slow and deliberate, and both lead us astray." },
  { title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", price: 21.99, stock: 58, published: "2018-10-16", pages: 320, genres: ["Business & Self-Help"], featured: true, description: "A practical framework for building good habits and breaking bad ones through tiny, compounding changes." },
  { title: "The Lean Startup", author: "Eric Ries", isbn: "9780307887894", price: 22.99, stock: 15, published: "2011-09-13", pages: 336, genres: ["Business & Self-Help"], description: "Build, measure, learn: a method for testing ideas quickly and growing a company under extreme uncertainty." },
  { title: "Zero to One", author: "Peter Thiel", isbn: "9780804139298", price: 20.99, stock: 13, published: "2014-09-16", pages: 224, genres: ["Business & Self-Help"], description: "Notes on startups and how to build companies that create something genuinely new." },
  { title: "Educated", author: "Tara Westover", isbn: "9780399590504", price: 16.99, stock: 24, published: "2018-02-20", pages: 352, genres: ["Biography & Memoir"], featured: true, description: "Raised by survivalists in rural Idaho with no schooling, a young woman teaches herself enough to reach Cambridge." },
  { title: "Becoming", author: "Michelle Obama", isbn: "9781524763138", price: 19.99, stock: 30, published: "2018-11-13", pages: 448, genres: ["Biography & Memoir"], description: "From the South Side of Chicago to the White House, a former First Lady reflects on family, work and finding her voice." },
  { title: "Steve Jobs", author: "Walter Isaacson", isbn: "9781451648539", price: 21.99, stock: 5, published: "2011-10-24", pages: 656, genres: ["Biography & Memoir", "Business & Self-Help"], description: "The exclusive biography of Apple's co-founder, drawn from dozens of interviews with him and those around him." },
  { title: "The Diary of a Young Girl", author: "Anne Frank", isbn: "9780553296983", price: 8.99, stock: 19, published: "1947-06-25", pages: 283, genres: ["Biography & Memoir", "History", "Classics"], description: "The diary a Jewish teenager kept while hiding with her family from the Nazis in Amsterdam." },
  { title: "Born a Crime", author: "Trevor Noah", isbn: "9780399588174", price: 15.99, stock: 22, published: "2016-11-15", pages: 304, genres: ["Biography & Memoir"], description: "Funny and moving stories of growing up mixed-race in apartheid South Africa, where his very existence was illegal." },
  { title: "The Hunger Games", author: "Suzanne Collins", isbn: "9780439023481", price: 10.99, stock: 47, published: "2008-09-14", pages: 384, genres: ["Young Adult", "Science Fiction"], description: "Katniss volunteers in her sister's place for a televised fight to the death and becomes a symbol of rebellion." },
];

export const REVIEW_SNIPPETS: Record<number, string[]> = {
  5: [
    "Couldn't put it down. Already recommending it to everyone I know.",
    "An all-time favourite. Every re-read reveals something new.",
    "Beautifully written and completely absorbing.",
    "Lived up to the hype and then some.",
  ],
  4: [
    "Really enjoyed this. A slow start, but the payoff is worth it.",
    "Great read. A few sections dragged, but the ending landed.",
    "Thoughtful and well paced. Would read more from this author.",
  ],
  3: [
    "Solid, if not quite as good as I'd hoped.",
    "Some brilliant moments, some that didn't work for me.",
  ],
  2: ["Not really my thing. I can see why others love it, though."],
  1: ["Couldn't get into it, sadly."],
};

export const SAMPLE_CUSTOMERS = [
  "Aarav Sharma",
  "Maya Chen",
  "Liam O'Connor",
  "Sofia Rossi",
  "Noah Williams",
  "Priya Patel",
  "Ethan Brooks",
  "Zara Ahmed",
  "Lucas Silva",
  "Hannah Müller",
  "Kenji Tanaka",
  "Amara Okafor",
];

export const SAMPLE_ADDRESSES = [
  { line1: "221B Baker Street", city: "London", postalCode: "NW1 6XE", country: "United Kingdom" },
  { line1: "12 MG Road", city: "Bengaluru", postalCode: "560001", country: "India" },
  { line1: "400 Market Street", city: "San Francisco", postalCode: "94105", country: "United States" },
  { line1: "8 Rue de Rivoli", city: "Paris", postalCode: "75004", country: "France" },
  { line1: "55 Collins Street", city: "Melbourne", postalCode: "3000", country: "Australia" },
  { line1: "1 Queen Street West", city: "Toronto", postalCode: "M5H 2N2", country: "Canada" },
];
