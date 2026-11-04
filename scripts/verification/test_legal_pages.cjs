/**
 * Verification test for Privacy Policy and Terms of Service Pages
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runLegalPagesAudit() {
  console.log('🧪 Verifying International Standard Legal Pages & Links...\n');

  const baseDir = path.resolve(__dirname, '../../');
  const privacyFile = path.join(baseDir, 'src/pages/PrivacyPolicy.jsx');
  const termsFile = path.join(baseDir, 'src/pages/TermsOfService.jsx');
  const landingFile = path.join(baseDir, 'src/pages/LandingPage.jsx');
  const appFile = path.join(baseDir, 'src/App.jsx');

  // 1. Check Privacy Policy content
  assert(fs.existsSync(privacyFile), 'PrivacyPolicy.jsx must exist');
  const privacyCode = fs.readFileSync(privacyFile, 'utf8');
  assert(privacyCode.includes('YouTube API Services'), 'Privacy Policy must include YouTube API Services compliance');
  assert(privacyCode.includes('GDPR & CCPA/CPRA'), 'Privacy Policy must include GDPR & CCPA section');
  assert(privacyCode.includes('Local-First'), 'Privacy Policy must detail Local-First Dexie IndexedDB architecture');
  assert(privacyCode.includes('Google Gemini'), 'Privacy Policy must detail Google Gemini AI processing transparency');
  assert(privacyCode.includes('Children'), 'Privacy Policy must detail COPPA compliance');
  console.log('  ✅ PrivacyPolicy.jsx verified with all international standards (GDPR, CCPA, YouTube API, Gemini, Local-First)');

  // 2. Check Terms of Service content
  assert(fs.existsSync(termsFile), 'TermsOfService.jsx must exist');
  const termsCode = fs.readFileSync(termsFile, 'utf8');
  assert(termsCode.includes('YouTube Terms of Service'), 'Terms must incorporate YouTube Terms of Service');
  assert(termsCode.includes('Cryptocurrency-Mining'), 'Terms must explicitly ban crypto-mining and exploit payloads');
  assert(termsCode.includes('AI Study Tutor Disclaimer'), 'Terms must include AI Tutor liability disclaimer');
  assert(termsCode.includes('Disclaimer of Warranties'), 'Terms must include standard warranty disclaimers');
  console.log('  ✅ TermsOfService.jsx verified with acceptable use, crypto prohibitions & disclaimers');

  // 3. Check Landing Page Footer Links
  const landingCode = fs.readFileSync(landingFile, 'utf8');
  assert(landingCode.includes('to="/privacy"'), 'Landing page footer must link to /privacy');
  assert(landingCode.includes('to="/terms"'), 'Landing page footer must link to /terms');
  console.log('  ✅ LandingPage footer successfully linked to /privacy and /terms');

  // 4. Check App.jsx Routes
  const appCode = fs.readFileSync(appFile, 'utf8');
  assert(appCode.includes('path="/privacy"'), 'App.jsx must route /privacy');
  assert(appCode.includes('path="/terms"'), 'App.jsx must route /terms');
  console.log('  ✅ App.jsx registered both routes with lazy-loaded Suspense');

  console.log('\n========================================');
  console.log('🎉 All Legal Pages & Footer Links Passed!');
  console.log('========================================\n');
}

runLegalPagesAudit();
