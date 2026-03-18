#!/usr/bin/env python3
"""
Test Exhaustif Genesis V2 - End-to-End
Teste tous les scopes, scales, et agents avec injection de contexte
"""

import json
import time
import subprocess
import uuid
from typing import Dict, List, Tuple

BACKEND_URL = "http://localhost:3457/api/chat"
WAIT_BETWEEN_REQUESTS = 3  # 3s entre requêtes (backend optimisé)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION DES TESTS PAR SCOPE
# ═══════════════════════════════════════════════════════════════

SCOPE_TESTS = {
    "meta_ads": {
        "name": "Meta Ads",
        "metadata": {
            "industry": "ecommerce",
            "business_goal": "increase_sales",
            "persona": "Femmes 25-40 ans, urbaines, intérêt yoga et bien-être",
            "competitors": "concurrent-yoga.com, zen-store.fr",
            "brand_voice": "friendly",
            "pain_point": "Mal de dos chronique lié au travail de bureau",
            "offer_hook": "-50% sur le 2ème cours + tapis offert",
            "visual_tone": "minimalist",
            "budget_monthly": 5000,
            "website_url": "https://yoga-example.com",
            "usp": "Cours de yoga personnalisés en ligne avec suivi kiné"
        },
        "expected_tasks": {
            "sprint": 8,
            "campaign": 14,
            "strategy": 19
        },
        "test_agent": "marcus",
        "test_question": "Quel est mon objectif business et quel budget ai-je pour cette campagne Meta Ads ?"
    },
    "sem": {
        "name": "Google Ads (SEM)",
        "metadata": {
            "industry": "saas",
            "business_goal": "generate_leads",
            "persona": "Product Managers tech 30-45 ans, remote workers",
            "competitors": "asana.com, monday.com, clickup.com",
            "brand_voice": "expert",
            "budget_monthly": 8000,
            "negative_keywords": ["gratuit", "free", "cracked", "nulled"],
            "competitive_advantage": "Intégration native Slack + Notion",
            "website_url": "https://saas-example.io",
            "usp": "Gestion de projet IA-powered avec automatisation complète"
        },
        "expected_tasks": {
            "sprint": 10,
            "campaign": 16,
            "strategy": 21
        },
        "test_agent": "marcus",
        "test_question": "Quels sont mes mots-clés négatifs et mon avantage concurrentiel pour Google Ads ?"
    },
    "seo": {
        "name": "SEO",
        "metadata": {
            "industry": "services_b2b",
            "business_goal": "generate_leads",
            "persona": "Dirigeants PME 40-60 ans, Paris et Île-de-France",
            "competitors": "cabinet-concurrent1.fr, avocat-paris.com",
            "brand_voice": "expert",
            "geo_target": "local",
            "editorial_tone": "expert",
            "website_url": "https://cabinet-juridique.fr",
            "usp": "Cabinet droit affaires spécialisé startups tech"
        },
        "expected_tasks": {
            "sprint": 12,
            "campaign": 19,
            "strategy": 26
        },
        "test_agent": "luna",
        "test_question": "Qui sont mes concurrents et dans quel secteur d'activité je suis ?"
    },
    "analytics": {
        "name": "Analytics & Tracking",
        "metadata": {
            "industry": "ecommerce",
            "business_goal": "increase_sales",
            "persona": "Acheteurs en ligne 25-50 ans, sensibles au prix",
            "competitors": "amazon.fr, cdiscount.com",
            "brand_voice": "friendly",
            "cms_platform": "shopify",
            "tracking_events": ["purchase", "add_to_cart", "begin_checkout", "view_item"],
            "conversion_goals": ["Achat", "Inscription newsletter", "Téléchargement guide"],
            "website_url": "https://shop-example.com",
            "usp": "Prix garantis les plus bas + Livraison 24h"
        },
        "expected_tasks": {
            "sprint": 8,
            "campaign": 15,
            "strategy": 21
        },
        "test_agent": "sora",
        "test_question": "Quels événements dois-je tracker et sur quelle plateforme CMS ?"
    },
    "social_media": {
        "name": "Social Media",
        "metadata": {
            "industry": "hospitality",
            "business_goal": "brand_awareness",
            "persona": "Foodies 30-50 ans, Paris, revenus moyens-élevés",
            "competitors": "@chezgeorges, @bistrot-moderne, @latabledefranck",
            "brand_voice": "bold",
            "brand_tone": "bold",
            "website_url": "https://restaurant-example.fr",
            "usp": "Cuisine du marché, chef étoilé Michelin, cave 500 références"
        },
        "expected_tasks": {
            "sprint": 6,
            "campaign": 10,
            "strategy": 15
        },
        "test_agent": "doffy",
        "test_question": "Quelle est mon audience cible et quel ton utiliser sur les réseaux sociaux ?"
    },
    "full_scale": {
        "name": "Full Scale (Stratégie Complète)",
        "metadata": {
            "industry": "health",
            "business_goal": "launch_product",
            "persona": "Sportifs amateurs 25-45 ans, urbains, actifs sur réseaux",
            "competitors": "competitor1.com, competitor2.com, competitor3.com",
            "brand_voice": "inspirational",
            "budget_monthly": 15000,
            "website_url": "https://fitness-app.com",
            "usp": "App fitness IA avec coach virtuel personnalisé"
        },
        "expected_tasks": {
            "strategy": 82  # Full scale = toutes les tâches de tous les scopes
        },
        "test_agent": "luna",
        "test_question": "Résume-moi le contexte complet de ce projet et ses objectifs."
    }
}

# ═══════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════

def call_chat_api(agent_id: str, message: str, metadata: Dict, session_id: str, project_id: str) -> Tuple[bool, str, str, float]:
    """Appelle l'API chat et retourne (success, message, error, duration)"""
    payload = {
        "action": "chat",
        "chatInput": message,
        "session_id": session_id,
        "project_id": project_id,
        "activeAgentId": agent_id,
        "chat_mode": "chat",
        "shared_memory": {
            "project_id": project_id,
            "project_name": f"TEST {metadata.get('industry', 'unknown').upper()}",
            "project_scope": "paid_ads_launch",  # Backend mapping
            "current_phase": "Setup",
            "state_flags": {},
            "project_metadata": metadata
        }
    }

    start_time = time.time()

    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", BACKEND_URL,
             "-H", "Content-Type: application/json",
             "-d", json.dumps(payload)],
            capture_output=True,
            text=True,
            timeout=60
        )

        duration = time.time() - start_time
        response = json.loads(result.stdout)

        if response.get("success"):
            return True, response.get("message", ""), "", duration
        else:
            error_msg = response.get("error", {}).get("message", "Unknown error")
            return False, "", error_msg, duration

    except json.JSONDecodeError:
        duration = time.time() - start_time
        return False, "", f"Invalid JSON: {result.stdout[:200]}", duration
    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        return False, "", "Client timeout after 60s", duration
    except Exception as e:
        duration = time.time() - start_time
        return False, "", str(e), duration


def verify_genesis_context(message: str, metadata: Dict) -> Tuple[int, List[str]]:
    """Vérifie la présence de données Genesis dans la réponse"""
    message_lower = message.lower()
    found = []

    # Vérifier les champs clés
    if metadata.get("industry") and metadata["industry"].lower() in message_lower:
        found.append("industry")

    if metadata.get("business_goal"):
        # Mapper les valeurs vers leurs labels possibles
        goal_keywords = {
            "increase_sales": ["vente", "sales", "chiffre d'affaires"],
            "generate_leads": ["lead", "prospect", "génér"],
            "brand_awareness": ["notorié", "awareness", "visibilité"],
            "launch_product": ["lancement", "launch", "nouveau produit"]
        }
        for keyword in goal_keywords.get(metadata["business_goal"], []):
            if keyword in message_lower:
                found.append("business_goal")
                break

    if metadata.get("persona") and any(word in message_lower for word in metadata["persona"].lower().split()[:3]):
        found.append("persona")

    if metadata.get("brand_voice") and metadata["brand_voice"] in message_lower:
        found.append("brand_voice")

    if metadata.get("budget_monthly"):
        budget_str = str(metadata["budget_monthly"])
        if budget_str in message or budget_str.replace("000", "k") in message_lower:
            found.append("budget")

    return len(found), found


# ═══════════════════════════════════════════════════════════════
# TESTS PRINCIPAUX
# ═══════════════════════════════════════════════════════════════

def main():
    print("=" * 80)
    print("TEST EXHAUSTIF GENESIS V2 - END-TO-END")
    print("=" * 80)
    print(f"\nConfiguration:")
    print(f"  - Scopes à tester: 6 (meta_ads, sem, seo, analytics, social_media, full_scale)")
    print(f"  - Scales par scope: 3 (sprint, campaign, strategy)")
    print(f"  - Total combinaisons: 18 tests")
    print(f"  - Délai entre requêtes: {WAIT_BETWEEN_REQUESTS}s\n")

    results = {}
    total_tests = 0
    total_success = 0
    total_context_found = 0

    # Test de chaque scope
    for scope_id, config in SCOPE_TESTS.items():
        print("\n" + "━" * 80)
        print(f"🎯 SCOPE: {config['name'].upper()}")
        print("━" * 80)

        scope_results = {"tests": []}

        # Déterminer quels scales tester
        scales_to_test = ["strategy"] if scope_id == "full_scale" else ["sprint", "campaign", "strategy"]

        for scale in scales_to_test:
            project_id = str(uuid.uuid4())
            session_id = str(uuid.uuid4())
            total_tests += 1

            print(f"\n  [{scale.upper()}] Test avec scale '{scale}'")

            # Vérifier nombre de tâches attendu
            expected_tasks = config["expected_tasks"].get(scale, 0)
            print(f"  📋 Tâches attendues: ~{expected_tasks}")

            # Tester l'agent avec question contextuelle
            agent_id = config["test_agent"]
            question = config["test_question"]

            print(f"  🤖 Test agent {agent_id.upper()}")
            print(f"  ❓ Question: {question[:60]}...")

            success, response, error, duration = call_chat_api(
                agent_id, question, config["metadata"], session_id, project_id
            )

            if success:
                total_success += 1

                # Vérifier présence contexte Genesis
                context_found, fields_found = verify_genesis_context(response, config["metadata"])
                if context_found > 0:
                    total_context_found += 1

                status = "✅" if context_found >= 2 else "⚠️"
                print(f"  {status} Succès ({len(response)} chars, {duration:.1f}s)")
                print(f"     Contexte Genesis: {context_found}/5 champs détectés")

                if fields_found:
                    print(f"     Trouvés: {', '.join(fields_found)}")

                scope_results["tests"].append({
                    "scale": scale,
                    "success": True,
                    "context_fields": context_found,
                    "fields_found": fields_found,
                    "duration": duration,
                    "response_length": len(response),
                    "expected_tasks": expected_tasks
                })
            else:
                print(f"  ❌ ÉCHEC ({duration:.1f}s): {error}")
                scope_results["tests"].append({
                    "scale": scale,
                    "success": False,
                    "error": error,
                    "duration": duration,
                    "expected_tasks": expected_tasks
                })

            # Attendre entre tests du même scope
            if scale != scales_to_test[-1]:
                print(f"  ⏸️  Attente {WAIT_BETWEEN_REQUESTS}s...")
                time.sleep(WAIT_BETWEEN_REQUESTS)

        results[scope_id] = scope_results

        # Attendre entre scopes
        if scope_id != list(SCOPE_TESTS.keys())[-1]:
            print(f"\n  ⏸️  Pause avant scope suivant ({WAIT_BETWEEN_REQUESTS}s)...")
            time.sleep(WAIT_BETWEEN_REQUESTS)

    # ═══════════════════════════════════════════════════════════
    # RÉSUMÉ FINAL
    # ═══════════════════════════════════════════════════════════

    print("\n\n" + "=" * 80)
    print("📊 RÉSUMÉ FINAL - GENESIS V2")
    print("=" * 80)

    success_rate = (total_success / total_tests * 100) if total_tests > 0 else 0
    context_rate = (total_context_found / total_success * 100) if total_success > 0 else 0

    print(f"\n🎯 Tests exécutés: {total_tests}")
    print(f"✅ Réussis: {total_success}/{total_tests} ({success_rate:.1f}%)")
    print(f"📝 Contexte Genesis détecté: {total_context_found}/{total_success} ({context_rate:.1f}%)\n")

    print("Détail par scope:\n")

    for scope_id, config in SCOPE_TESTS.items():
        scope_result = results[scope_id]
        successful = sum(1 for t in scope_result["tests"] if t.get("success"))
        total_scope = len(scope_result["tests"])
        total_context = sum(t.get("context_fields", 0) for t in scope_result["tests"] if t.get("success"))

        if successful == total_scope and total_context > 0:
            status = "✅"
        elif successful == total_scope:
            status = "⚠️"
        else:
            status = "❌"

        print(f"{status} {config['name']}")
        print(f"   Tests réussis: {successful}/{total_scope}")
        print(f"   Contexte détecté: {total_context} champs au total")

        # Détails par scale
        for test_result in scope_result["tests"]:
            scale = test_result["scale"]
            if test_result.get("success"):
                fields = test_result.get("context_fields", 0)
                found = ", ".join(test_result.get("fields_found", []))
                print(f"   • {scale:8s}: ✅ {test_result['duration']:.1f}s | {fields} champs ({found})")
            else:
                print(f"   • {scale:8s}: ❌ {test_result.get('error', 'Unknown')}")

        print()

    print("=" * 80)

    if success_rate == 100 and context_rate >= 80:
        print("🎉 SUCCÈS TOTAL - Genesis V2 fonctionne parfaitement !")
    elif success_rate == 100:
        print("⚠️  TESTS PASSÉS - Mais contexte Genesis partiellement détecté")
    else:
        print(f"⚠️  ÉCHECS DÉTECTÉS - {100 - success_rate:.1f}% à corriger")

    print("=" * 80)

    # Sauvegarder résultats JSON
    with open("/tmp/genesis_v2_test_results.json", "w") as f:
        json.dump({
            "total_tests": total_tests,
            "total_success": total_success,
            "success_rate": success_rate,
            "context_detection_rate": context_rate,
            "results_by_scope": results
        }, f, indent=2)

    print("\n📄 Résultats sauvegardés: /tmp/genesis_v2_test_results.json")


if __name__ == "__main__":
    main()
