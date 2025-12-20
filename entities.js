// --- entities.js ---
// Contient les définitions des Héros et des Monstres

const HEROES_DATA = {
    "test": {
        name: "test", 
        icon: "",
        maxHp: 100, maxMp: 50, str: 10, def: 10, int: 10, magDef: 10,
        resistances: { }, 
        skills: ["coup_basique", "posture_defensive", "analyse"] 
    },
    "mage": {
        name: "Sorcier", 
        icon: "🧙‍♂️",
        maxHp: 100, maxMp: 50, str: 10, def: 2, int: 10, magDef: 3,
        resistances: { }, 
        skills: ["coup_basique", "posture_defensive", "analyse"] 
    },
    "guerrier": {
        name: "Guerrier",
        icon: "🛡️",
        maxHp: 120, maxMp: 30, str: 15, def: 5, int: 2, magDef: 1,
        resistances: { physique: 10},
        skills: ["coup_basique", "posture_defensive", "analyse"] 
    }
};

const MONSTERS_DATA = {
    "gobelin": {
        name: "Gobelin", 
        maxHp: 35, maxMp: 0, str: 8, def: 2, int: 1, magDef: 0, xpReward: 50, 
        minWave: 1, maxWave: 15,
        spawnWeight: 100, // <--- AJOUT : Très fréquent
        skills: ["coup_basique"],
        resistances: { physique: 5 ,feu : -10} 
    },
    "loup": {
        name: "Loup", 
        maxHp: 40, maxMp: 0, str: 10, def: 1, int: 1, magDef: 1, xpReward: 50, 
        minWave: 1, maxWave: 25,
        spawnWeight: 50, // <--- AJOUT : Très fréquent
        skills: ["morsure","hurlement"],
        resistances: {feu : -10} 
    },
    "orc": {
        name: "Orc", 
        maxHp: 85, maxMp: 0, str: 15, def: 3, int: 2, magDef: 1, xpReward: 100, 
        minWave: 15, maxWave: 70,
        spawnWeight: 40, // <--- AJOUT : Fréquence moyenne
        skills: ["coup_basique", "cri"],
        resistances: { physique: 10, terre: 10, feu : -30}
    },
    "bandi": {
        name: "bandi", 
        maxHp: 65, maxMp: 0, str: 10, def: 5, int: 2, magDef: 5, xpReward: 100, 
        minWave: 10, maxWave: 50,
        spawnWeight: 80,
        skills: ["coup_basique", "peau_de_pierre"],
        resistances: { physique: 10}
    },
     "pretre": {
        name: "pretre", 
        maxHp: 80, maxMp: 0, str: 2, def: 2, int: 12, magDef: 12, xpReward: 100, 
        minWave: 10, maxWave: 50,
        spawnWeight: 60,
        skills: ["coup_basique", "soin_leger"],
        resistances: { lumiere: 30,tenebres:-30}
    },
    "dragonnet": {
        name: "Dragonnet", 
        maxHp: 120, maxMp: 50, str: 20, def: 10, int: 25, magDef: 10, xpReward: 150, 
        minWave: 45, maxWave: 999,
        spawnWeight: 5, // <--- AJOUT : Très rare (Boss)
        skills: ["morsure", "souffle_feu"],
        resistances: { feu: 50, eau: -50, terre: -20, physique: 10 }
    }
};
