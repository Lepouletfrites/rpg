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
        { key: "magDef", val: 4, label: "Aura Protectrice" },
        
        // --- NOUVEAU : Résistances Épiques (+10%) ---
        { key: "res_feu", val: 10, label: "Ignifugé" },
        { key: "res_physique", val: 5, label: "Corps d'Acier" }
    ],
    "legendary": [
        { key: "maxHp", val: 50, label: "Cœur de Dragon" },
        { key: "str", val: 8, label: "Puissance Divine" },
        { key: "def", val: 5, label: "Invulnérabilité" },
        
        // --- NOUVEAU : Résistances Légendaires (+20%) ---
        { key: "res_tenebres", val: 20, label: "Lumière Intérieure" },
        { key: "res_physique", val: 10, label: "Peau de Diamant" }
    ]
};


// --- DÉPLACÉ DEPUIS SKILLS.JS ---
// Liste des Sorts distribuables en récompense
const SKILL_POOL = [
    { key: "soin_leger", rarity: "common" },
    { key: "boule_feu", rarity: "rare", classes: ["mage"] },
    { key: "frappe_lourde", rarity: "rare", classes: ["guerrier"] },
    { key: "torent_feu", rarity: "legendary", classes: ["mage"] },
    { key: "jet_eau", rarity: "rare", classes: ["mage"] },
    { key: "orbe_de_poison", rarity: "epic", classes: ["mage"] },
    { key: "peau_de_pierre", rarity: "rare", classes: ["guerrier"] },
    { key: "cri", rarity: "epic",classes: ["guerrier"] }
];

