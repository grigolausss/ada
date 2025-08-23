import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(base_url="http://localhost:3000")
    page = context.new_page()

    try:
        print("Step 1: Starting session...")
        page.goto("/")
        page.locator("#name").fill("Mario")
        page.locator("#surname").fill("Rossi")
        page.locator("#email").fill("mario.rossi@test.it")
        page.locator("#phone").fill("3331122333")
        page.locator("#ref").fill("R806")
        page.get_by_role("button", name="Richiedi Accesso").click()

        print("Step 2: Verifying OTP...")
        page.wait_for_function("document.querySelector('#otp-step').style.display === 'block'")
        page.locator("#otp").fill("123456") # Mock OTP from server log
        page.get_by_role("button", name="Verifica e Continua").click()

        print("Step 3: Consenting to privacy...")
        page.wait_for_url("**/privacy.html")
        page.locator("#privacy-checkbox").check()
        page.get_by_role("button", name="Accetto e Continuo").click()

        print("Step 4: Answering qualification questions...")
        page.wait_for_url("**/qualify.html")
        page.locator(".question-group[data-question='budget'] .option-btn[data-value='350-500k']").click()
        page.locator(".question-group[data-question='mutuo'] .option-btn[data-value='no mutuo']").click()
        page.locator(".question-group[data-question='anticipo'] .option-btn[data-value='>20%']").click()
        page.locator(".question-group[data-question='tempistiche'] .option-btn[data-value='1-3 mesi']").click()
        page.get_by_role("button", name="Sblocca Planimetria").click()

        print("Step 5: Viewing plan...")
        page.wait_for_url("**/plan.html")
        page.get_by_role("button", name="Accetto e Continuo").click()

        expect(page.locator("#plan-canvas")).to_be_visible(timeout=10000)

        # A small delay to ensure canvas is painted
        page.wait_for_timeout(1000)

        print("Step 6: Taking screenshot...")
        page.screenshot(path="jules-scratch/verification/final_screenshot.png")

        page.get_by_role("button", name="Ho Visto Abbastanza").click()

        print("Step 7: Checking final result...")
        page.wait_for_url("**/result.html")
        expect(page.get_by_text("Ottimo!")).to_be_visible()

        print("Verification script completed successfully!")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
