# La Méthode Griffes Vivienne — Livrable Version 2.0

**Date :** 10 mars 2026  
**Statut :** Production-ready (en attente de validation des textures)  
**URL de prévisualisation :** https://3000-inw5vnyqmv223t22628bl-2ce0a5fe.us2.manus.computer

---

## 1. Résumé exécutif

La version 2.0 de **La Méthode Griffes Vivienne** est une application web complète permettant à tout professionnel du textile ou de la mode de transformer son logo en une maquette photoréaliste d'étiquette tissée haut de gamme. Le moteur de génération repose sur le modèle **Nano Banana Pro** (`gemini-3-pro-image-preview`) de Google, guidé par des images de référence (moodboards) pour chaque type de texture.

L'application est bilingue (FR/EN), dotée d'un système de crédits, d'un historique des générations et d'une interface soignée à l'identité visuelle luxe.

---

## 2. Fonctionnalités implémentées

### 2.1 Parcours utilisateur principal

Le parcours se déroule en trois étapes successives, sans friction :

1. **Upload du logo** — L'utilisateur dépose son logo (PNG, JPG ou SVG jusqu'à 10 Mo) par glisser-déposer ou sélection de fichier. Le fond blanc est automatiquement supprimé via `mix-blend-mode: multiply`.

2. **Sélection de la texture** — Quatre options de tissage sont proposées, chacune avec une prévisualisation CSS dynamique appliquée directement sur le logo :

| Texture | Description | Pattern CSS |
|---|---|---|
| **HD** | Haute densité, trame très serrée | Quadrillage 2×2 px, trait 0.3 px |
| **HD Coton** | Haute densité, fil coton biologique | Quadrillage 2.67×2.67 px, trait 0.35 px |
| **Satin** | Brillance subtile, diagonal 20° | Quadrillage incliné + gradient radial |
| **Taffetas** | Trame standard, aspect classique | Quadrillage 4×4 px, trait 0.5 px |

3. **Génération et résultat** — L'IA génère l'étiquette en 20 à 30 secondes. L'image résultante est affichée et peut être téléchargée.

### 2.2 Système de crédits et essai gratuit

Chaque utilisateur bénéficie d'**un essai gratuit** sans inscription obligatoire. Les générations suivantes requièrent des crédits. Le système est entièrement implémenté côté serveur, avec les tables de base de données correspondantes.

| Pack | Crédits | Prix indicatif |
|---|---|---|
| Starter | 1 griffe | 4,99 € |
| Standard | 3 griffes | 12,99 € |
| Pro | 10 griffes | 29,99 € |

> **Note :** L'intégration Stripe n'est pas encore activée. Le bouton d'achat est présent dans l'interface mais non fonctionnel. L'activation nécessite la configuration des clés Stripe via `webdev_add_feature stripe`.

### 2.3 Internationalisation (FR/EN)

L'intégralité de l'interface est disponible en français et en anglais. Le sélecteur de langue est accessible depuis le header sur toutes les pages. La langue sélectionnée est persistée dans `localStorage`.

### 2.4 Espace compte utilisateur

Une page **Mon Compte** permet à l'utilisateur connecté de consulter son historique de générations avec les images produites, le type de texture utilisé et la date de création.

---

## 3. Architecture technique

### 3.1 Stack technologique

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js 22, Express 4, tRPC 11 |
| Base de données | MySQL/TiDB via Drizzle ORM |
| Stockage fichiers | Amazon S3 (via helpers Manus) |
| Authentification | Manus OAuth |
| IA génération | Google Gemini (`gemini-3-pro-image-preview`) via `@google/genai` v1.40.0 |

### 3.2 Flux de génération d'images

Le flux complet de génération suit la chaîne suivante :

```
Frontend (logo base64 + texture sélectionnée)
    ↓  trpc.label.generate.useMutation()
Router tRPC  (server/routers.ts)
    ↓  Vérification crédits / essai gratuit
nanoBananaService.ts
    ↓  Chargement moodboards (server/moodboards.ts)
    ↓  Construction du prompt + parts (logo + 2 références)
API Nano Banana Pro  (gemini-3-pro-image-preview)
    ↓  Image générée en base64 (~20-30 secondes)
Stockage S3  (storagePut)
    ↓  URL publique
Retour au frontend  (labelUrl)
```

### 3.3 Système de moodboards

Chaque texture dispose de **deux images de référence** stockées en base64 dans `server/moodboards.ts`. Ces images sont envoyées à l'IA avec le prompt pour guider le rendu visuel (texture, éclairage, matière).

Le prompt utilisé est de type **"Texture Transfer"** :

```
ROLE: Textile Design AI.
TASK: Perform a high-fidelity TEXTURE TRANSFER.

INPUTS:
1. [IMAGE 1]: The LOGO (Geometry/Shape).
2. [REFERENCE IMAGES]: The MATERIAL REFERENCES (Texture/Lighting/Color).

INSTRUCTIONS:
- Render the LOGO from [IMAGE 1] physically woven into a fabric label.
- CRITICAL: The fabric texture, thread thickness, light reflection, and weaving
  technique must MATCH the [REFERENCE IMAGES] EXACTLY.
- Do not generate the text inside the Reference Images, only copy their
  *material properties*.
- View: Macro photography, 2K resolution, sharp details.
```

### 3.4 Schéma de base de données

Trois tables principales sont utilisées :

- **`users`** — Profil utilisateur avec `hasUsedFreeTrial` et `creditBalance`
- **`generations`** — Historique des étiquettes générées (logoUrl, labelUrl, textureType, isFreeTrial)
- **`creditTransactions`** — Historique des achats et utilisations de crédits

---

## 4. Fichiers clés

| Fichier | Rôle |
|---|---|
| `server/nanoBananaService.ts` | Service de génération IA — appel API, prompts, moodboards |
| `server/moodboards.ts` | Images de référence en base64 (2 par texture) |
| `server/routers.ts` | Router tRPC — point d'entrée `label.generate` |
| `client/src/pages/Home.tsx` | Page d'accueil avec upload logo |
| `client/src/pages/Prepare.tsx` | Sélection texture + prévisualisation CSS |
| `client/src/pages/Result.tsx` | Affichage et téléchargement de l'étiquette générée |
| `client/src/pages/Credits.tsx` | Interface d'achat de crédits |
| `client/src/pages/Account.tsx` | Historique des générations |
| `client/src/contexts/LanguageContext.tsx` | Système bilingue FR/EN |
| `drizzle/schema.ts` | Schéma de base de données |

---

## 5. Tests

Les tests unitaires couvrent les points critiques de l'application :

| Fichier de test | Couverture | Statut |
|---|---|---|
| `server/generation.test.ts` | Validation des 4 types de texture, structure des données | ✅ 7/7 |
| `server/auth.logout.test.ts` | Déconnexion OAuth, suppression du cookie | ✅ 1/1 |
| `server/nanoBanana.test.ts` | Structure du service IA, gestion d'erreur API key manquante | ✅ 4/4 |

**Total : 12/12 tests passés.**

---

## 6. Points en suspens

Les éléments suivants sont identifiés comme nécessitant une attention avant la mise en production commerciale :

### 6.1 Qualité des textures Satin

La génération Satin présente des résultats **incohérents** selon les tests effectués :
- Parfois : brillance satin parfaite, fond beige, rendu haut de gamme
- Parfois : fond noir/gris foncé (l'IA adopte la couleur du vêtement de fond du moodboard)
- Parfois : rendu mat sans brillance (texture taffetas au lieu de satin)

**Cause probable :** Le moodboard de référence Satin montre une étiquette posée sur un tissu sombre, que l'IA interprète comme la couleur de fond souhaitée. Le prompt ne contraint pas suffisamment la couleur du fond de l'étiquette.

**Solution recommandée :** Ajouter dans le prompt Satin une contrainte explicite sur la couleur : `"Label background: light beige/cream (#F5F5DC). The label itself must be light-colored, NOT dark."`.

### 6.2 Paiement Stripe non activé

Le système de crédits est entièrement implémenté côté backend, mais le paiement réel n'est pas connecté. Pour activer Stripe, utiliser `webdev_add_feature stripe` et configurer les clés via `webdev_request_secrets`.

### 6.3 Textures HD Coton et Taffetas non testées en génération IA

Seules les textures HD et Satin ont été testées avec le moteur Nano Banana Pro. Les textures HD Coton et Taffetas restent à valider visuellement.

---

## 7. Instructions de déploiement

L'application est prête à être publiée via le bouton **Publish** de l'interface Manus (après création d'un checkpoint). Aucune configuration supplémentaire n'est requise pour les fonctionnalités actuelles.

Pour activer le paiement Stripe avant la mise en production, contacter l'équipe technique pour la configuration des webhooks et des clés API.

---

*Document préparé par Manus AI — 10 mars 2026*
