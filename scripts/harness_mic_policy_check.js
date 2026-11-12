#!/usr/bin/env node
// Harness pre-check: the page must ALLOW the microphone for real callers.
//
// Runs Chrome WITHOUT --use-fake-ui-for-media-stream / --use-fake-device-for-media-stream
// and WITHOUT any getUserMedia override, then asserts
//   document.featurePolicy.allowsFeature('microphone') === true
// A page-JS getUserMedia override (how the journey harness injects audio) bypasses
// Permissions-Policy, so the harness can be green while real users get "mic off".
// Exit 0 = pass, exit 2 = FAIL (loud), exit 1 = could not run.
//
// Usage: node scripts/harness_mic_policy_check.js [url ...]
//   CHROME_PATH=/path/to/chrome   (default: macOS Google Chrome)
// Requires puppeteer-core (npm i --no-save puppeteer-core@22).

const puppeteer = require('puppeteer-core')

const DEFAULT_URLS = [
  'https://staging.aiivrs.com/experience?autostart=true&tenant_key=j_k_bank_contact_center&ivr_key=retail&journey=0',
  'https://staging.aiivrs.com/experience',
]
const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_URLS
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run'] })
  let failed = 0
  try {
    for (const url of urls) {
      const page = await browser.newPage()
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      const header = resp ? (resp.headers()['permissions-policy'] || '(none)') : '(no response)'
      const allows = await page.evaluate(() =>
        document.featurePolicy ? document.featurePolicy.allowsFeature('microphone') : null)
      const ok = allows === true
      if (!ok) failed++
      console.log(`${ok ? 'PASS' : '!!!! FAIL'}  allowsFeature('microphone')=${allows}  permissions-policy="${header}"  ${url}`)
      await page.close()
    }
  } finally {
    await browser.close()
  }
  if (failed) {
    console.error(`\n!!!! MIC POLICY CHECK FAILED on ${failed}/${urls.length} URL(s): real callers cannot use the microphone.`)
    console.error('!!!! Journey results with injected audio are NOT valid for real users. Fix Permissions-Policy (microphone=(self)).')
    process.exit(2)
  }
  console.log(`\nMic policy check passed on ${urls.length} URL(s).`)
})().catch(e => { console.error('mic policy check could not run:', e.message); process.exit(1) })
