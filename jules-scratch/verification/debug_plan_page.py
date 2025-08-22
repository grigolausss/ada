from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        base_url="http://localhost:3000",
        locale="it-IT",
        timezone_id="Europe/Rome"
    )
    page = context.new_page()

    # Listen for all console events and print them
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

    try:
        # Go to a page to have a valid context for sessionStorage
        page.goto("/")

        # Manually set sessionStorage to simulate a logged-in user
        page.evaluate("""() => {
            sessionStorage.setItem('sessionId', 'sess_1755871103625');
            sessionStorage.setItem('propertyRef', 'RM-123');
        }""")

        # Navigate to the plan page
        page.goto("/plan.html")

        # Expect the confirmation modal and accept it
        expect(page.get_by_text("Visuale Privata")).to_be_visible()
        page.get_by_role("button", name="Accetto e Continuo").click()

        # Check for the watermark
        expect(page.locator(".watermark-text").first).to_be_visible(timeout=10000)

        print("Success! Watermark found.")
        page.screenshot(path="jules-scratch/verification/debug_success.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
