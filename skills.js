// --- skills.js ---
// Contient la base de données des sorts
// NOTE : La liste SKILL_POOL a été déplacée vers loot.js

const SKILL_DATABASE = {
    // Format : new Skill(Nom, Coût, CD, TYPE, Desc, Effet)
    
    // --- PHYSIQUE ---
    "coup_basique": new Skill("⚔️ Attaque", 0, 0, "physique", "Attaque normale", (user, target) => {
        let rawDmg = Math.max(1, user.str - Math.floor(target.def / 2));
        return target.receiveDamage(rawDmg, "physique");
    }),

    "frappe_lourde": new Skill("🔨 Marteau", 20, 2, "physique", "Gros Dégâts Physiques", (user, target) => {
        let rawDmg = Math.floor(user.str * 2.2) - Math.floor(target.def / 2);
        if (rawDmg < 1) rawDmg = 1;
        return target.receiveDamage(rawDmg, "physique");
    }),

    "morsure": new Skill("Morsure", 0, 0, "physique", "Attaque sauvage", (user, target) => {
        let rawDmg = Math.max(1, user.str - Math.floor(target.def / 2));
        return target.receiveDamage(rawDmg, "physique");
    }),

    // --- MAGIE (FEU) ---
    "boule_feu": new Skill("🔥 Feu", 8, 2, "feu", "Magie de Feu", (user, target) => {
        let rawDmg = Math.floor(user.int * 1.5); 
        let calc = Math.max(1, rawDmg - target.magDef);
        return target.receiveDamage(calc, "feu");
    }),

    "souffle_feu": new Skill("Souffle", 0, 3, "feu", "Feu de zone", (user, target) => {
        let calc = Math.max(1, (user.int * 1.2) - target.magDef);
        return target.receiveDamage(calc, "feu");
    }),

    // --- AUTRES / UTILITAIRE ---
    "soin_leger": new Skill("✨ Soin", 12, 3, "lumiere", "Soin", (user, target) => {
        let heal = 20 + Math.floor(user.int * 1.2);
        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
        return heal; 
    }),

    "posture_defensive": new Skill("🛡️ Défense", 0, 0, "physique", "-50% Dégâts reçus", (user, target) => {
        user.isDefending = true; 
        user.currentMp += 5;
        return "DEFENSE";
    }),

    "analyse": new Skill("👁️ Analyse", 0, 0, "physique", "Info Ennemi", (user, target) => {
        return "ANALYSE";
    }),
    
    "cri": new Skill("Cri", 0, 3, "physique", "Boost Force", (user, target) => {
        user.str += 2; return "BUFF";
    })
};
