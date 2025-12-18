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
const STAT_POOL = {
    "common": [
        { key: "str", val: 1, label: "Force Mineure" },
        { key: "int", val: 1, label: "Intelligence Mineure" },
        { key: "maxHp", val: 10, label: "Petit Boost Santé" }
    ],
    "rare": [
        { key: "str", val: 3, label: "Force Accrue" },
        { key: "int", val: 3, label: "Esprit Vif" },
        { key: "def", val: 2, label: "Peau de Fer" },
        { key: "maxHp", val: 25, label: "Vitalité" }
    ],
    "epic": [
        { key: "str", val: 5, label: "Force de Titan" },
        { key: "int", val: 5, label: "Génie Magique" },
        { key: "maxMp", val: 20, label: "Source de Mana" },
        { key: "magDef", val: 4, label: "Aura Protectrice" }
    ],
    "legendary": [
        { key: "maxHp", val: 50, label: "Cœur de Dragon" },
        { key: "str", val: 8, label: "Puissance Divine" },
        { key: "int", val: 8, label: "Omniscience" },
        { key: "def", val: 5, label: "Invulnérabilité" }
    ]
};

// --- DÉPLACÉ DEPUIS SKILLS.JS ---
// Liste des Sorts distribuables en récompense
const SKILL_POOL = [
    { key: "soin_leger", rarity: "common" },
    { key: "posture_defensive", rarity: "common" },
    { key: "boule_feu", rarity: "rare" },
    { key: "frappe_lourde", rarity: "rare" },
    { key: "souffle_feu", rarity: "epic" },
    { key: "cri", rarity: "epic" }
];

