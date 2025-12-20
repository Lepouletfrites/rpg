// --- loot.js ---
// Configuration des probabilités et des bonus de stats

// Configuration des probabilités (Total = 100%)
const BASE_RARITY_CHANCE = {
    "common": 60,
    "rare": 30, 
    "epic": 8,
    "legendary": 2
};

// Liste des Bonus de Stats possibles par rareté
// --- loot.js ---

const STAT_POOL = {
    "common": [
        { key: "str", val: 1, label: "Force Mineure", desc: "For + 1" },
        { key: "int", val: 1, label: "Intelligence Mineure", desc: "Int + 1"  },
        { key: "maxHp", val: 10, label: "Petit Boost Santé", desc: "Max PV + 10"  },
        { key: "maxMp", val: 5, label: "Petit Boost de Mana", desc: "Max MP + 5"  }
    ],
    "rare": [
        { key: "str", val: 3, label: "Force Accrue", desc: "For + 3"  },
        { key: "int", val: 3, label: "Esprit Vif", desc: "Int + 3"  },
        { key: "def", val: 2, label: "Peau de Fer", desc: "Def + 2"  },
        { key: "maxHp", val: 25, label: "Vitalité", desc: "Max PV + 25"  },
        { key: "maxMp", val: 10, label: "Source de Mana", desc: "Max MP + 10"  }
    ],
    "epic": [
        { key: "str", val: 5, label: "Force de Titan", desc: "For + 5"  },
        { key: "int", val: 5, label: "Génie Magique", desc: "Int + 5"  },
        { key: "maxMp", val: 20, label: "Mana evolution", desc: "Max MP + 20"  },
        { key: "magDef", val: 4, label: "Aura Protectrice", desc: "Def mag + 4"  },
        
        // --- NOUVEAU : Résistances Épiques (+10%) ---
        { key: "res_feu", val: 10, label: "Ignifugé", desc: "Res feu + 10"  },
        { key: "res_physique", val: 5, label: "Corps d'Acier", desc: "Res phy + 5"  }
    ],
    "legendary": [
        { key: "maxHp", val: 50, label: "Cœur de Dragon", desc: "Max PV + 50"  },
        { key: "str", val: 8, label: "Puissance Divine", desc: "For + 8"  },
        { key: "int", val: 8, label: "Magie Divine", desc: "Int + 8"  },
        { key: "def", val: 5, label: "Invulnérabilité", desc: "Def + 5"  },
        { key: "magDef", val: 5, label: "Bouclier anti sorts", desc: "Def magique + 5"  },
        
        // --- NOUVEAU : Résistances Légendaires (+20%) ---
        { key: "res_tenebres", val: 20, label: "Lumière Intérieure", desc: "Res tene + 20"  },
        { key: "res_physique", val: 10, label: "Peau de Diamant", desc: "Res phy + 10"  }
    ]
};


// --- DÉPLACÉ DEPUIS SKILLS.JS ---
// Liste des Sorts distribuables en récompense
const SKILL_POOL = [
    // --- COMMUNS ---
    { key: "soin_leger", rarity: "common", classes: ["mage", "paladin"] },
    { key: "meditation", rarity: "common", classes: ["mage", "guerrier", "paladin"] },
    { key: "dague_poison", rarity: "common", classes: ["voleur"] },
    { key: "choc_bouclier", rarity: "common", classes: ["paladin", "guerrier"] },
    { key: "coup_pommeau", rarity: "common", classes: ["guerrier", "paladin"] },
    { key: "vol_de_mana", rarity: "common", classes: ["voleur", "mage"] },
    
    // --- RARES ---
    { key: "boule_feu", rarity: "rare", classes: ["mage"] },
    { key: "frappe_lourde", rarity: "rare", classes: ["guerrier", "paladin"] },
    { key: "jet_eau", rarity: "rare", classes: ["mage"] },
    { key: "peau_de_pierre", rarity: "rare", classes: ["guerrier", "paladin"] },
    { key: "saignement", rarity: "rare", classes: ["guerrier", "voleur"] },
    { key: "eclair", rarity: "rare", classes: ["mage"] },
    { key: "mur_de_glace", rarity: "rare", classes: ["mage"] },
    { key: "choc_mental", rarity: "rare", classes: ["mage", "voleur"] },
    
    // Nouveaux Rares
    { key: "attaque_sournoise", rarity: "rare", classes: ["voleur"] },
    { key: "chatiment", rarity: "rare", classes: ["paladin"] },
    { key: "stalactite", rarity: "rare", classes: ["mage"] },
    { key: "tornade", rarity: "rare", classes: ["mage"] },
    { key: "brise_armure", rarity: "rare", classes: ["guerrier"] },
    { key: "ombre_liquide", rarity: "rare", classes: ["voleur", "mage"] },

    // --- ÉPIQUES ---
    { key: "orbe_de_poison", rarity: "epic", classes: ["mage", "voleur"] },
    { key: "cri", rarity: "epic",classes: ["guerrier"] },
    { key: "coup_vampire", rarity: "epic", classes: ["guerrier", "mage", "voleur"] },
    { key: "berserk", rarity: "epic", classes: ["guerrier"] },
    { key: "seisme", rarity: "epic", classes: ["mage", "paladin"] },
    
    // Nouveaux Épiques
    { key: "pluie_lames", rarity: "epic", classes: ["voleur"] },
    { key: "camouflage", rarity: "epic", classes: ["voleur"] },
    { key: "imposition_mains", rarity: "epic", classes: ["paladin"] },
    { key: "aura_devotion", rarity: "epic", classes: ["paladin"] },
    { key: "blizzard", rarity: "epic", classes: ["mage"] },
    { key: "racines", rarity: "epic", classes: ["mage", "paladin"] },
    { key: "transpercement", rarity: "epic", classes: ["guerrier", "voleur"] },
    { key: "martyr", rarity: "epic", classes: ["paladin"] },

    // --- LÉGENDAIRES ---
    { key: "torent_feu", rarity: "legendary", classes: ["mage"] },
    { key: "execution", rarity: "legendary", classes: ["guerrier"] },
    { key: "lumiere_sacree", rarity: "legendary", classes: ["mage", "paladin"] },
    
    // Nouveaux Légendaires
    { key: "jugement_dernier", rarity: "legendary", classes: ["paladin"] },
    { key: "assassinat", rarity: "legendary", classes: ["voleur"] },
    { key: "avatar_titan", rarity: "legendary", classes: ["guerrier", "paladin"] },
    { key: "supernova", rarity: "legendary", classes: ["mage"] },
    { key: "boule_magma", rarity: "legendary", classes: ["mage"] },
    { key: "paix_interieure", rarity: "legendary", classes: ["paladin", "mage"] }
];

