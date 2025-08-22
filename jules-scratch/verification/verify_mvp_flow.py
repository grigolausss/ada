import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        base_url="http://localhost:3000",
        # Emulate Italian language to get correct date formatting for watermark
        locale="it-IT",
        # Emulate a timezone
        timezone_id="Europe/Rome"
    )
    page = context.new_page()

    try:
        # --- Step 1: Verification ---
        page.goto("/start?t=test-token-123")
        page.get_by_placeholder("Il tuo numero di telefono").fill("3331234567")
        page.get_by_role("button", name="Invia Codice").click()
        expect(page.get_by_text("Verifica il tuo numero")).to_be_visible()
        page.get_by_placeholder("Codice a 6 cifre").fill("123456")
        page.get_by_role("button", name="Verifica").click()

        # --- Step 2: Property Selection ---
        expect(page.get_by_text("Identifica l'Immobile")).to_be_visible()
        page.get_by_placeholder("Es: RM-123").fill("RM-123")
        page.get_by_text("RM-123 - Splendido Attico con Terrazza").click()
        expect(page.get_by_text("Zona: Centro Storico | MQ: 120 | Prezzo: 350-500k")).to_be_visible()
        page.get_by_label("Dichiaro di aver letto").check()
        page.get_by_role("button", name="Continua").click()

        # --- Step 3: Qualification ---
        expect(page.get_by_text("Ancora un passo...")).to_be_visible()
        page.locator(".question-group[data-question='budget'] .option-btn[data-value='350-500k']").click()
        page.locator(".question-group[data-question='mutuo'] .option-btn[data-value='no mutuo']").click()
        page.locator(".question-group[data-question='anticipo'] .option-btn[data-value='>20%']").click()
        page.locator(".question-group[data-question='tempistiche'] .option-btn[data-value='1-3 mesi']").click()
        page.get_by_role("button", name="Sblocca Planimetria").click()

        # --- Step 4: Plan Viewer ---
        expect(page.get_by_text("Visuale Privata")).to_be_visible()
        page.get_by_role("button", name="Accetto e Continuo").click()

        # In this environment, OpenSeadragon may not render a canvas with a fake image.
        # We will instead verify that the watermark data, which comes from our backend, is correctly loaded.
        # This is the most critical part of the feature we can test here.
        expect(page.locator(".watermark-text").first).to_be_visible(timeout=10000)
        expect(page.locator(".watermark-text")).to_have_count(30)

        # Take a screenshot of the plan viewer
        page.screenshot(path="jules-scratch/verification/plan_viewer.png")

        page.get_by_role("button", name="Ho deciso").click()

        # --- Step 5: Decision & Feedback ---
        expect(page.get_by_text("Cosa ne pensi?")).to_be_visible()
        page.get_by_role("button", name="Non fa per me").click()

        expect(page.get_by_text("Ci aiuti a capire perché")).to_be_visible()
        page.get_by_label("La zona non mi convince").check()
        page.get_by_role("button", name="Invia Feedback e Vedi Alternative").click()

        # --- Step 6: Alternatives ---
        expect(page.get_by_text("Grazie per il tuo feedback!")).to_be_visible()
        expect(page.locator("#alternatives-list li")).to_have_count(2)

        # Final screenshot
        page.screenshot(path="jules-scratch/verification/final_verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
