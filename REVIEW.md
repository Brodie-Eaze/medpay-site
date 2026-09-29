# MedPay review preview

Open http://localhost:4173 while the local preview server is running. This folder contains the complete standalone site. To restart it, run `PORT=4173 npm start` here with Node 18 or later. No dependency installation is needed.

Original source located at `/Users/Brodie/medpay-scroll-world/site`. This review copy is isolated. The original source and Railway production service have not been changed.

## Changes

- Preserved the hero photograph, composition, gradient into the introduction, and introduction spacing.
- Corrected the film's scroll origin. It previously counted the hero and introduction as film progress.
- Replaced page-wide fixed film layers with a section-contained sticky viewport. Removed the compensating copy-layer opacity handler.
- Recovered the omitted F4 Higgsfield render from the original project. It connects the consultation room to the corridor. Encoded a desktop and lighter mobile version, restored its two joins, and added its actual starting frame as the loading poster.
- Removed artificial mid-scene speed changes. Shortened the dissolve and made layer order stable. Kept seek coalescing and blob loading. Hold the final scene through the section exit.
- Added an explicit still-image mode and a direct route from the film to the product demo. System reduced-motion preference also chooses stills without downloading video.
- Rebuilt the product explanation as three interactive stages with sample data, keyboard-operable tabs, visible demo labels and no network submissions.
- Restyled the lender panel, practice sectors, onboarding steps, trust section and final call to action using the paper, navy and blue house palette.
- Preserved business disclosures and existing commercial claims. Removed internal pricing-draft commentary from the public layout. No pricing, APR or monthly repayment claims were introduced.
- Replaced the dead final signup link with a visibly disabled button and a preview notice. A real signup destination is still required before launch.

## Validation

JavaScript syntax checks passed. Browser checks covered desktop at the default 1265 by 720 viewport and a 390 by 844 phone viewport, including film frames, sticky containment, product controls, keyboard arrow navigation and absence of horizontal overflow. Loaded videos reported seekable ranges across their full duration. No browser console errors were observed during these checks.

Inspected all five original film joins as paired boundary frames. Four were close matches. The consultation-to-corridor join was a major discontinuity caused by the omitted F4 render. Inspected the recovered render's start/end frames and verified it seeks and paints inside the browser. This repairs the missing movement; it does not remove artifacts already generated inside the original footage.

Verified the still-mode path in the browser: seven loaded posters and zero video elements. Native operating-system reduced-motion preference was not separately toggled. Real iPhone Safari, device rotation and throttled low-end hardware were not tested.

## Remaining limits

Mobile uses the original lighter 1024 by 576 landscape videos with a center crop. No native portrait footage was generated. Original timing and commercial claims were retained, not independently substantiated. Registration is disconnected. No production deployment has been performed.

## Revision 2: MedPay brand, navigation and usable application

The previous house-style blue was incorrect for MedPay. The actual MedPay Brand Guidelines v1.0 were read from `/Users/Brodie/code/eazepay-wiki/raw/medpay-brand-guidelines.md` (source recorded as the EazePay Vertical OS brand-guidelines page). This revision follows its paper #F4F8F8, ink #0C2B33, teal #14B8A6, deep teal #0F766E and Inter system. Rounded mark in ink and the Pay word in deep teal avoid a double teal logo accent. The hero composition and its opening transition remain intact.

The entire header has been rebuilt as a contained, high-contrast paper navigation surface with aligned typography, refined spacing and one deep-teal primary action. All five existing section destinations remain available. Phones have an expandable menu with Escape and outside-click dismissal.

The static product panels have been replaced by a working tablet application. Fields are based on the actual dedicated MedPay intake at `/Users/Brodie/eazepay-platform/apps/partner-portal/app/apply/medpay/page.tsx`: first name, last name, email, phone and amount. The demo supports blank entry, sample fill, field validation, edited-value preservation, review, acknowledgment, fictional matches, simulated lender hand-off, back navigation and reset. Inputs stay only in this component's memory. There are no API calls, persistent storage writes, credit scoring or real lender decisions. The tablet scrolls internally and fits the phone viewport.

Browser checks verified all five stages, required-field blocking, changed names in review, acknowledgment blocking, completed hand-off, reset, mobile menu/Escape, no horizontal overflow at 390px and the exact paper/deep-teal computed colors. Syntax checks pass and no console errors were observed during the flow. Native iPhone testing remains outstanding.

### Video remains a separate decision

Inspected chronological frames from q6, r6, r6_trim and leg_6_raw. None preserves both believable room architecture and the partner's continuity. The existing final shot is not declared fixed. Video generation is explicitly on hold, and no credits were spent.

The connected Higgsfield Ultra workspace had 45.9 credits when checked. Read-only cost estimates returned 72 credits for an 8-second 1080p Seedance 2.0 shot, or 20 credits for an 8-second 720p Mini draft. These are estimates, not purchases. A continuous, believable departure with the same couple requires replacement footage and motion QA.

A separate no-generation-cost editorial ending is available at `http://localhost:4173/?edit=short`. It holds the treatment-room boundary frame, then cuts to existing reception footage. It deliberately omits the defective exit and smiling-alone finale. It does not show the requested chair-to-reception walk or reunite the couple. An on-screen review notice labels that limitation. This option is not the default film and needs user review as a different storytelling choice.

Production and the original source directory remain unchanged.
