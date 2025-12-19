// --- entities.js ---
// Contient les définitions des Héros et des Monstres

const HEROES_DATA = {
    "mage": {
        name: "Sorcier", 
        icon: "🧙‍♂️",
        maxHp: 100, maxMp: 50, str: 10, def: 3, int: 10, magDef: 3,
        resistances: { feu: 10, lumiere: 10, tenebres: -10 }, 
        skills: ["coup_basique", "posture_defensive", "analyse","flechette_poison","bouclier_lave"] 
    },
    "guerrier": {
        name: "Guerrier",
        icon: "🛡️",
        maxHp: 120, maxMp: 20, str: 12, def: 5, int: 2, magDef: 1, // Stats typées Tank
        resistances: { physique: 10, feu: -10 },
        skills: ["coup_basique", "posture_defensive", "analyse"] // Sorts de départ
    }
};

const MONSTERS_DATA = {
    "gobelin": {
        name: "Gobelin", 
        maxHp: 35, maxMp: 0, str: 8, def: 1, int: 1, magDef: 0, xpReward: 50, 
        minWave: 1, maxWave: 15,
        spawnWeight: 100, // <--- AJOUT : Très fréquent
        skills: ["morsure"],
        resistances: { physique: 0 } 
    },
    "orc": {
        name: "Orc", 
        maxHp: 75, maxMp: 0, str: 12, def: 3, int: 2, magDef: 1, xpReward: 100, 
        minWave: 5, maxWave: 50,
        spawnWeight: 40, // <--- AJOUT : Fréquence moyenne
        skills: ["morsure", "cri"],
        resistances: { physique: 10, terre: 10, feu : -30}
    },
    "dragon": {
        name: "Dragonnet", 
        maxHp: 120, maxMp: 50, str: 14, def: 5, int: 15, magDef: 8, xpReward: 150, 
        minWave: 45, maxWave: 999,
        spawnWeight: 5, // <--- AJOUT : Très rare (Boss)
        skills: ["morsure", "souffle_feu"],
        resistances: { feu: 50, eau: -50, terre: -20, physique: 10 }
    }
};
