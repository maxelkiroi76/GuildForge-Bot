export interface TriviaQuestion {
  question: string;
  category: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    question: "Dans quel jeu vidéo explore-t-on les terres d'Hyrule ?",
    category: "Gaming 🎮",
    options: ["The Legend of Zelda", "Final Fantasy", "Dark Souls", "The Witcher"],
    correctIndex: 0,
    explanation: "Hyrule est le royaume légendaire de la franchise The Legend of Zelda créée par Nintendo."
  },
  {
    question: "Quel est le nom du monde cubique dans Minecraft ?",
    category: "Gaming 🎮",
    options: ["The End", "The Overworld", "Netherland", "Aether"],
    correctIndex: 1,
    explanation: "La dimension principale où démarre le joueur dans Minecraft s'appelle l'Overworld (la Surface)."
  },
  {
    question: "Quelle entreprise a créé la console PlayStation en 1994 ?",
    category: "Tech & Gaming 🕹️",
    options: ["Sega", "Nintendo", "Sony", "Microsoft"],
    correctIndex: 2,
    explanation: "Sony a sorti sa toute première PlayStation au Japon le 3 décembre 1994."
  },
  {
    question: "Dans League of Legends, quel monstre neutre offre le buff 'Main du Baron' ?",
    category: "Esport ⚔️",
    options: ["Le Héraut de la Faille", "Le Dragon Ancestral", "Le Dragon Elémentaire", "Le Baron Nashor"],
    correctIndex: 3,
    explanation: "Tuer le Baron Nashor confère à l'équipe un puissant buff d'attaque et renforce les sbires."
  },
  {
    question: "Quel est le langage de programmation principalement utilisé pour le Web côté client ?",
    category: "Tech 💻",
    options: ["Python", "JavaScript", "C++", "Rust"],
    correctIndex: 1,
    explanation: "JavaScript est le langage natif exécuté par tous les navigateurs web modernes."
  },
  {
    question: "Quel studio a développé les jeux The Witcher 3 et Cyberpunk 2077 ?",
    category: "Gaming 🎮",
    options: ["Ubisoft", "Bethesda", "CD Projekt Red", "BioWare"],
    correctIndex: 2,
    explanation: "Le studio polonais CD Projekt Red est le créateur de ces deux chefs-d'œuvre."
  },
  {
    question: "Quel héros de manga possède le pouvoir du 'One For All' ?",
    category: "Anime & Manga 📺",
    options: ["Izuku Midoriya (Deku)", "Naruto Uzumaki", "Monkey D. Luffy", "Tanjiro Kamado"],
    correctIndex: 0,
    explanation: "Izuku Midoriya hérite de l'alter One For All transmis par All Might dans My Hero Academia."
  },
  {
    question: "Quelle est la capitale mythologique des dieux nordiques dans la mythologie scandinave ?",
    category: "Mythologie ⚡",
    options: ["Midgard", "Asgard", "Valhalla", "Niflheim"],
    correctIndex: 1,
    explanation: "Asgard est le domaine des dieux Ases régné par Odin."
  }
];
