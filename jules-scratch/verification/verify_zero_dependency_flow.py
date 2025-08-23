import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(base_url="http://localhost:3000")
    page = context.new_page()

    try:
        # Step 1: Start Session
        page.goto("/")
        page.locator("#name").fill("Mario")
        page.locator("#surname").fill("Rossi")
        page.locator("#email").fill("mario.rossi@test.it")
        page.locator("#phone").fill("3331122333")
        page.locator("#ref").fill("R806")
        page.get_by_role("button", name="Richiedi Accesso").click()

        # Step 2: Verify OTP
        page.wait_for_function("document.querySelector('#otp-step').style.display === 'block'")
        expect(page.get_by_text("Verifica la tua identità")).to_be_visible()
        page.get_by_placeholder("Codice a 6 cifre").fill("123456") # Mock OTP
        page.get_by_role("button", name="Verifica e Continua").click()

        # Step 3: Privacy Consent
        page.wait_for_url("**/privacy.html")
        expect(page.get_by_text("Informativa sulla Privacy")).to_be_visible()
        page.get_by_label("Dichiaro di aver letto").check()
        page.get_by_role("button", name="Accetto e Continuo").click()

        # Step 4: Qualification
        expect(page.get_by_text("Ancora un passo...")).to_be_visible()
        page.locator(".question-group[data-question='budget'] .option-btn[data-value='350-500k']").click()
        page.locator(".question-group[data-question='mutuo'] .option-btn[data-value='no mutuo']").click()
        page.locator(".question-group[data-question='anticipo'] .option-btn[data-value='>20%']").click()
        page.locator(".question-group[data-question='tempistiche'] .option-btn[data-value='1-3 mesi']").click()
        page.get_by_role("button", name="Sblocca Planimetria").click()

        # Step 5: Plan Viewer
        expect(page.get_by_text("Visuale Privata")).to_be_visible()
        page.get_by_role("button", name="Accetto e Continuo").click()

        # Wait for the canvas to be visible and rendered
        expect(page.locator("#plan-canvas")).to_be_visible(timeout=10000)

        # Take a screenshot of the plan viewer
        page.screenshot(path="jules-scratch/verification/final_mvp_screenshot.png")

        page.get_by_role("button", name="Ho Visto Abbastanza").click()

        # Step 6: Result
        expect(page.get_by_text("Ottimo!")).to_be_visible()

        print("Verification script completed successfully!")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
