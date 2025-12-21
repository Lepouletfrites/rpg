// --- entities.js ---
// RE-BALANCED VERSION "SWEET SPOT" (4 à 6 tours par combat)
// PV x4 par rapport à l'original, MP x1.5 pour tenir la cadence.

const HEROES_DATA = {
    "test": {
        name: "Testeur", 
        icon: "🛠️",
        maxHp: 600, maxMp: 75, 
        str: 10, def: 10, int: 10, magDef: 10,
        resistances: { }, 
        skills: ["coup_basique", "posture_defensive", "analyse"] 
    },
    "mage": {
        name: "Sorcier", 
        icon: "🧙‍♂️",
        maxHp: 440, maxMp: 100, // Fragile mais beaucoup de mana
        str: 8, 
        def: 8,     
        int: 14,    
        magDef: 12, 
        resistances: { }, 
        skills: ["coup_basique", "posture_defensive", "analyse"] 
    },
    "guerrier": {
        name: "Guerrier",
        icon: "🛡️",
        maxHp: 600, maxMp: 45, // Solide
        str: 14, 
        def: 18,    
        int: 4, 
        magDef: 8, 
        resistances: { physique: 10},
        skills: ["coup_basique", "posture_defensive", "analyse"] 
    },
    "voleur": {
        name: "Voleur",
        icon: "🗡️",
        maxHp: 400, maxMp: 60, // Très fragile (Glass Cannon)
        str: 16,    
        def: 6,     
        int: 6, 
        magDef: 6, 
        resistances: { terre: 10 },
        skills: ["coup_basique","posture_defensive", "analyse"] 
    },
    "paladin": {
        name: "Paladin",
        icon: "✝️",
        maxHp: 640, maxMp: 75, // Le Tank
        str: 12, 
        def: 14,    
        int: 10,    
        magDef: 12, 
        resistances: { lumiere: 50, tenebres: -20, physique: 10 },
        skills: ["coup_basique","posture_defensive", "analyse"] 
    }
};

const MONSTERS_DATA = {
    // =================================================================
    // TIER 1 : LE DÉBUT (Vagues 1 - 20)
    // =================================================================

    "rat": {
        name: "Rat Géant", maxHp: 100, maxMp: 0, str: 5, def: 0, int: 1, magDef: 0, xpReward: 20,
        minWave: 1, maxWave: 10, spawnWeight: 100,
        skills: ["morsure"],
        resistances: { poison: 20 }
    },
    "gobelin": {
        name: "Gobelin", maxHp: 140, maxMp: 0, str: 7, def: 2, int: 1, magDef: 2, xpReward: 35,
        minWave: 1, maxWave: 15, spawnWeight: 90,
        skills: ["coup_basique"],
        resistances: { physique: 5, feu: -10 }
    },
    "chauve_souris": {
        name: "Chauve-souris", maxHp: 80, maxMp: 0, str: 6, def: 10, int: 1, magDef: 0, xpReward: 30,
        minWave: 2, maxWave: 18, spawnWeight: 80,
        skills: ["morsure", "vol_de_mana"], 
        resistances: { terre: -50, physique: 20 } 
    },
    "loup": {
        name: "Loup", maxHp: 180, maxMp: 0, str: 9, def: 4, int: 1, magDef: 2, xpReward: 50,
        minWave: 3, maxWave: 25, spawnWeight: 70,
        skills: ["morsure", "hurlement"],
        resistances: { feu: -10 }
    },
    "bandit": {
        name: "Bandit", maxHp: 240, maxMp: 30, str: 10, def: 8, int: 2, magDef: 5, xpReward: 60,
        minWave: 5, maxWave: 30, spawnWeight: 60,
        skills: ["coup_basique", "attaque_sournoise"],
        resistances: { physique: 5 }
    },
    "slime_vert": {
        name: "Slime Vert", maxHp: 320, maxMp: 0, str: 6, def: 15, int: 1, magDef: 0, xpReward: 55,
        minWave: 5, maxWave: 25, spawnWeight: 80,
        skills: ["coup_basique"],
        resistances: { physique: 30, feu: -20, foudre: -20 }
    },
    "sanglier": {
        name: "Sanglier", maxHp: 280, maxMp: 0, str: 12, def: 10, int: 1, magDef: 5, xpReward: 65,
        minWave: 8, maxWave: 35, spawnWeight: 50,
        skills: ["morsure", "frappe_lourde"],
        resistances: { terre: 10 }
    },
    "archer_squelette": {
        name: "Squelette Archer", maxHp: 180, maxMp: 0, str: 14, def: 5, int: 1, magDef: 5, xpReward: 70,
        minWave: 10, maxWave: 40, spawnWeight: 60,
        skills: ["coup_basique", "transpercement"],
        resistances: { tenebres: 20, lumiere: -50, poison: 100 }
    },

    // =================================================================
    // TIER 2 : MID GAME (Vagues 20 - 60)
    // =================================================================

    "pretre_corrompu": {
        name: "Prêtre Corrompu", maxHp: 320, maxMp: 120, str: 4, def: 8, int: 13, magDef: 20, xpReward: 100,
        minWave: 15, maxWave: 55, spawnWeight: 50,
        skills: ["coup_basique", "soin_leger", "choc_mental"],
        resistances: { lumiere: 20, tenebres: 20, physique: -10 }
    },
    "orc": {
        name: "Orc", maxHp: 400, maxMp: 30, str: 16, def: 15, int: 2, magDef: 5, xpReward: 110,
        minWave: 20, maxWave: 60, spawnWeight: 70,
        skills: ["coup_basique", "cri", "frappe_lourde"],
        resistances: { physique: 15, feu: -20 }
    },
    "orc_shaman": {
        name: "Shaman Orc", maxHp: 400, maxMp: 150, str: 8, def: 10, int: 18, magDef: 15, xpReward: 130,
        minWave: 22, maxWave: 65, spawnWeight: 40,
        skills: ["coup_basique", "boule_feu", "soin_leger", "racines"],
        resistances: { feu: 20, terre: 20 }
    },
    "slime_acide": {
        name: "Slime Acide", maxHp: 360, maxMp: 45, str: 10, def: 30, int: 8, magDef: 5, xpReward: 90,
        minWave: 25, maxWave: 55, spawnWeight: 60,
        skills: ["coup_basique", "vapeur_acide"],
        resistances: { physique: 60, feu: -30 }
    },
    "spectre": {
        name: "Spectre", maxHp: 240, maxMp: 75, str: 5, def: 5, int: 22, magDef: 99, xpReward: 120,
        minWave: 30, maxWave: 70, spawnWeight: 50,
        skills: ["coup_basique", "drain_vie", "ombre_liquide"],
        resistances: { physique: 80, tenebres: 100, poison: 100, lumiere: -50 }
    },
    "gargouille": {
        name: "Gargouille", maxHp: 600, maxMp: 0, str: 16, def: 40, int: 5, magDef: 30, xpReward: 140,
        minWave: 35, maxWave: 80, spawnWeight: 50,
        skills: ["coup_basique", "peau_de_pierre", "frappe_lourde"],
        resistances: { physique: 40, feu: 30, terre: 50 }
    },
    "assassin_drow": {
        name: "Assassin Drow", maxHp: 360, maxMp: 60, str: 25, def: 10, int: 10, magDef: 12, xpReward: 150,
        minWave: 35, maxWave: 85, spawnWeight: 40,
        skills: ["coup_basique", "attaque_sournoise", "dague_poison", "camouflage"],
        resistances: { tenebres: 30 }
    },
    "elementaire_feu": {
        name: "Elem. Feu", maxHp: 520, maxMp: 90, str: 10, def: 15, int: 25, magDef: 25, xpReward: 160,
        minWave: 40, maxWave: 90, spawnWeight: 45,
        skills: ["coup_basique", "boule_feu", "souffle_feu"],
        resistances: { feu: 100, eau: -50, terre: 20 }
    },
    "elementaire_eau": {
        name: "Elem. Eau", maxHp: 560, maxMp: 90, str: 10, def: 20, int: 22, magDef: 25, xpReward: 160,
        minWave: 40, maxWave: 90, spawnWeight: 45,
        skills: ["coup_basique", "jet_eau", "mur_de_glace", "soin_leger"],
        resistances: { eau: 100, electrique: -50, feu: 20 }
    },
    "minotaure": {
        name: "Minotaure", maxHp: 1000, maxMp: 0, str: 30, def: 25, int: 5, magDef: 10, xpReward: 200,
        minWave: 45, maxWave: 95, spawnWeight: 35,
        skills: ["coup_basique", "frappe_lourde", "berserk", "cri"],
        resistances: { physique: 20 }
    },

    // =================================================================
    // TIER 3 : HIGH MID (Vagues 60 - 100)
    // =================================================================

    "basilic": {
        name: "Basilic", maxHp: 800, maxMp: 75, str: 22, def: 35, int: 15, magDef: 30, xpReward: 220,
        minWave: 55, maxWave: 100, spawnWeight: 40,
        skills: ["morsure", "regard_petrifiant"],
        resistances: { terre: 50, eau: 20 }
    },
    "troll_regen": {
        name: "Troll des Cavernes", maxHp: 1600, maxMp: 30, str: 35, def: 20, int: 5, magDef: 15, xpReward: 250,
        minWave: 60, maxWave: 110, spawnWeight: 40,
        skills: ["coup_basique", "frappe_lourde", "rage_sanglante"],
        resistances: { physique: 10, feu: -40 }
    },
    "sorciere": {
        name: "Sorcière", maxHp: 720, maxMp: 225, str: 8, def: 12, int: 35, magDef: 40, xpReward: 240,
        minWave: 60, maxWave: 110, spawnWeight: 45,
        skills: ["coup_basique", "choc_mental", "orbe_de_poison", "blizzard"],
        resistances: { tenebres: 40, magique: 20 }
    },
    "golem_acier": {
        name: "Golem d'Acier", maxHp: 1400, maxMp: 0, str: 40, def: 80, int: 5, magDef: 40, xpReward: 300,
        minWave: 65, maxWave: 120, spawnWeight: 35,
        skills: ["coup_basique", "peau_de_pierre"],
        resistances: { physique: 70, poison: 100, feu: 20, electrique: -30 }
    },
    "chevalier_noir": {
        name: "Chevalier Noir", maxHp: 1120, maxMp: 90, str: 38, def: 45, int: 20, magDef: 35, xpReward: 280,
        minWave: 70, maxWave: 130, spawnWeight: 40,
        skills: ["coup_basique", "coup_vampire", "frappe_lourde", "ombre_liquide"],
        resistances: { tenebres: 60, physique: 25, lumiere: -30 }
    },
    "wyvern": {
        name: "Wyverne", maxHp: 1280, maxMp: 75, str: 42, def: 30, int: 15, magDef: 20, xpReward: 320,
        minWave: 75, maxWave: 140, spawnWeight: 30,
        skills: ["morsure", "souffle_feu", "tornade"],
        resistances: { terre: -50 } 
    },
    "elementaire_foudre_maj": {
        name: "Orage Vivant", maxHp: 1000, maxMp: 150, str: 10, def: 20, int: 45, magDef: 50, xpReward: 310,
        minWave: 75, maxWave: 135, spawnWeight: 35,
        skills: ["coup_basique", "eclair", "analyse", "pluie_lames"],
        resistances: { electrique: 100, eau: -40, terre: 50 }
    },

    // =================================================================
    // TIER 4 : LATE GAME (Vagues 100 - 150)
    // =================================================================

    "hydre": {
        name: "Hydre", maxHp: 2400, maxMp: 75, str: 50, def: 30, int: 30, magDef: 30, xpReward: 500,
        minWave: 95, maxWave: 160, spawnWeight: 20,
        skills: ["morsure", "jet_eau", "vapeur_acide", "rage_sanglante"],
        resistances: { eau: 50, poison: 50, feu: -20 }
    },
    "vampire_lord": {
        name: "Seigneur Vampire", maxHp: 1800, maxMp: 225, str: 55, def: 40, int: 60, magDef: 45, xpReward: 550,
        minWave: 100, maxWave: 170, spawnWeight: 25,
        skills: ["coup_basique", "coup_vampire", "drain_vie", "camouflage", "assassinat"],
        resistances: { tenebres: 80, physique: 30, lumiere: -60 }
    },
    "geant_givre": {
        name: "Géant de Givre", maxHp: 3200, maxMp: 150, str: 70, def: 60, int: 20, magDef: 40, xpReward: 600,
        minWave: 105, maxWave: 180, spawnWeight: 25,
        skills: ["coup_basique", "frappe_lourde", "blizzard", "mur_de_glace"],
        resistances: { eau: 80, feu: -40 }
    },
    "succube": {
        name: "Succube Reine", maxHp: 1600, maxMp: 450, str: 30, def: 30, int: 75, magDef: 70, xpReward: 580,
        minWave: 110, maxWave: 180, spawnWeight: 30,
        skills: ["coup_basique", "choc_mental", "vol_de_mana", "flamme_noire"],
        resistances: { tenebres: 50, feu: 50 }
    },
    "drake_magma": {
        name: "Drake de Magma", maxHp: 3000, maxMp: 150, str: 65, def: 80, int: 40, magDef: 50, xpReward: 650,
        minWave: 115, maxWave: 190, spawnWeight: 20,
        skills: ["morsure", "souffle_feu", "bouclier_lave", "boule_magma"],
        resistances: { feu: 100, terre: 50, eau: -30 }
    },
    "gardien_runique": {
        name: "Gardien Runique", maxHp: 4000, maxMp: 750, str: 50, def: 60, int: 60, magDef: 120, xpReward: 700,
        minWave: 120, maxWave: 199, spawnWeight: 15,
        skills: ["coup_basique", "analyse", "seisme", "lumiere_sacree"],
        resistances: { magique: 80, physique: 20 }
    },

    // =================================================================
    // TIER 5 : END GAME (Vagues 150 - 200)
    // =================================================================

    "ange_dechu": {
        name: "Ange Déchu", maxHp: 4800, maxMp: 900, str: 80, def: 70, int: 90, magDef: 70, xpReward: 1000,
        minWave: 145, maxWave: 200, spawnWeight: 15,
        skills: ["coup_basique", "jugement_dernier", "flamme_noire", "imposition_mains"],
        resistances: { lumiere: 50, tenebres: 50 }
    },
    "lich_king": {
        name: "Roi Liche", maxHp: 3600, maxMp: 999, str: 40, def: 50, int: 120, magDef: 100, xpReward: 1200,
        minWave: 150, maxWave: 200, spawnWeight: 10,
        skills: ["coup_basique", "blizzard", "drain_vie", "supernova", "ombre_liquide"],
        resistances: { physique: 50, eau: 100, tenebres: 100, poison: 100 }
    },
    "balrog": {
        name: "Balrog", maxHp: 6000, maxMp: 300, str: 130, def: 90, int: 80, magDef: 60, xpReward: 1500,
        minWave: 155, maxWave: 200, spawnWeight: 10,
        skills: ["coup_basique", "boule_magma", "berserk", "brise_armure"],
        resistances: { feu: 100, tenebres: 50, physique: 30 }
    },
    "devoreur": {
        name: "Dévoreur d'Âmes", maxHp: 4400, maxMp: 750, str: 100, def: 40, int: 100, magDef: 40, xpReward: 1400,
        minWave: 160, maxWave: 200, spawnWeight: 10,
        skills: ["coup_basique", "assassinat", "choc_mental", "coup_vampire"],
        resistances: { tenebres: 100 }
    },
    "titan": {
        name: "Titan Ancestral", maxHp: 12000, maxMp: 300, str: 150, def: 150, int: 20, magDef: 150, xpReward: 2000,
        minWave: 170, maxWave: 200, spawnWeight: 5,
        skills: ["coup_basique", "avatar_titan", "seisme", "frappe_lourde"],
        resistances: { physique: 60, terre: 80 }
    },

    // =================================================================
    // BOSSES (Vagues Fixes ou Rares)
    // =================================================================

    "dragonnet": {
        name: "Dragonnet (Boss)", maxHp: 800, maxMp: 150, str: 15, def: 20, int: 15, magDef: 20, xpReward: 500,
        minWave: 15, maxWave: 50, spawnWeight: 3, 
        skills: ["morsure", "souffle_feu", "cri"],
        resistances: { feu: 50, physique: 10 }
    },
    "chimere": {
        name: "Chimère (Boss)", maxHp: 4000, maxMp: 300, str: 60, def: 40, int: 50, magDef: 40, xpReward: 1500,
        minWave: 50, maxWave: 100, spawnWeight: 3,
        skills: ["morsure", "boule_feu", "jet_eau", "eclair"],
        resistances: { feu: 30, eau: 30, electrique: 30 }
    },
    "roi_demon": {
        name: "Seigneur Démon (Boss)", maxHp: 10000, maxMp: 999, str: 90, def: 80, int: 100, magDef: 80, xpReward: 5000,
        minWave: 95, maxWave: 199, spawnWeight: 2, 
        skills: ["coup_basique", "execution", "torent_feu", "flamme_noire", "berserk"],
        resistances: { feu: 80, tenebres: 80, physique: 30, lumiere: -20 }
    },
    "dieu_ancien": {
        name: "Dieu Oublié (FINAL)", maxHp: 40000, maxMp: 9999, str: 250, def: 120, int: 250, magDef: 120, xpReward: 50000,
        minWave: 200, maxWave: 999, spawnWeight: 100, 
        skills: ["coup_basique", "jugement_dernier", "supernova", "regard_petrifiant", "paix_interieure"],
        resistances: { physique: 50, magique: 50, tenebres: 100, lumiere: 100 }
    }
};
