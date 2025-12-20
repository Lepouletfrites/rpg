// --- skills.js ---
// Contient la base de données des sorts
// NOTE : La liste SKILL_POOL a été déplacée vers loot.js

const SKILL_DATABASE = {
    // Format : new Skill(Nom, Coût, CD, TYPE, Desc, Effet)
    
    // --- PHYSIQUE ---
    "coup_basique": new Skill("⚔️ Attaque", 0, 0, "physique", "Attaque normale (meilleur stat)", (user, target) => {
        let rawDmg = 0;
        if(user.str > user.int){
            rawDmg = Math.max(1, Math.floor(user.str) - Math.floor(target.def));            
        }
        else{
            rawDmg = Math.max(1, Math.floor(user.int) - Math.floor(target.magDef));  
        }
        
        return target.receiveDamage(rawDmg, "physique");
    }),

    "frappe_lourde": new Skill("frappe lourde", 10, 2, "physique", "Gros Dégâts Physiques", (user, target) => {
        let rawDmg = (Math.floor(user.str) - Math.floor(target.def)) * 2.2;
        if (rawDmg < 1) rawDmg = 1;
        return target.receiveDamage(rawDmg, "physique");
    }),

    "morsure": new Skill("Morsure", 0, 0, "physique", "Attaque sauvage", (user, target) => {
        let rawDmg = Math.max(1, user.str - target.def);
        return target.receiveDamage(rawDmg, "physique");
    }),

    // --- MAGIE (FEU) ---
    "boule_feu": new Skill("🔥 Feu", 8, 2, "feu", "Magie de Feu[coef 1.5]", (user, target) => {
        let rawDmg = Math.floor((user.int- target.magDef) * 1.5); 
        return target.receiveDamage(rawDmg, "feu");
    }),
    "torent_feu": new Skill("🔥 vague enflamer", 35, 5, "feu", "Magie de Feu[coef 4.5]", (user, target) => {
        let rawDmg =  Math.floor((user.int- target.magDef) * 4.5); 
        return target.receiveDamage(rawDmg, "feu");
    }),
    "jet_eau": new Skill("💧 Eau", 8, 2, "eau", "Magie d'eau", (user, target) => {
        let rawDmg = Math.floor((user.int- target.magDef) * 1.5); 
        return target.receiveDamage(rawDmg, "eau");
    }),

    "souffle_feu": new Skill("Souffle", 0, 3, "feu", "Feu de zone", (user, target) => {
        let calc = Math.floor((user.int- target.magDef) * 2.5)
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
    
    "cri": new Skill("Cri", 0, 3, "physique", "Boost Force + 5", (user, target) => {
        user.str += 5;

        return { 
            customMsg: " ta force augmente" 
        };
    }),
    
    "bouclier_lave": new Skill("🛡️ Bouclier Lave", 15, 4, "feu", "+50% Res. Feu", (user, target) => {
        // On modifie la résistance COURANTE (celle qui sera reset fin de vague)
        user.resistances["feu"] += 50;
        // On retourne un message personnalisé pour le log
        return { 
            customMsg: " se recouvre de lave durcie (+50% Résistance Feu) !" 
        };
    }),
    
    "hurlement": new Skill("Hurlement", 5, 2, "feu", "- 5 def", (user, target) => {
        target.def -= 5;
        return { 
            customMsg: " ta defence diminue" 
        };
    }),

    "peau_de_pierre": new Skill("peau de pierre", 5, 2, "feu", "+ 5 def", (user, target) => {
        user.def += 5;
        return { 
            customMsg: " ta defence augmente" 
        };
    }),
    // dot damage
    "orbe_de_poison": new Skill("☠️ Poison", 10, 3, "tenebres", "Dégâts + Poison (3 tours)", (user, target) => {
        // 1. Dégâts initiaux (faibles)
        let rawDmg = Math.floor((user.int- target.magDef) * 1.5)
        let dmgResult = target.receiveDamage(rawDmg, "tenebres");
        // 2. Application de l'effet
        // (Nom, Dégâts par tour, Durée en tours, Type)
        let dotDamage = Math.floor(user.int * 0.6); // Dégâts du poison basés sur l'Intell
        target.applyEffect("Poison", dotDamage, 3, "tenebres");
        return { 
            dmg: dmgResult.dmg, 
            customMsg: ` et infecte la cible avec du Poison !` 
        };
    })

};
